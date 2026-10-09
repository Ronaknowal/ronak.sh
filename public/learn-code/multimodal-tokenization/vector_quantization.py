"""Nearest codebook vectors, straight-through gradients and a tiny VQ-VAE.

Run: python vector_quantization.py --epochs 30
Requires numpy and torch; download digits_subset.csv alongside this file.
The retained real UCI/sklearn digits subset contains integer 8x8 pixels.
The loader divides by16; 320 train images fit the parameters, 80 disjoint
heldout images supply reconstruction and usage diagnostics only. Digit
labels are metadata; this reconstruction model never uses them as targets.
Seed0, CPU, one thread, fixed training order make this a reproducible small
experiment, not a claim about perceptual quality or generalization.

VQ-VAE loss: reconstruction MSE + codebook MSE + beta*commitment MSE.
stop_gradient controls which parameter receives each gradient. Forward
values are selected vectors; reconstruction gradients reach the encoder
through the straight-through expression. Source: van den Oord et al.,
https://arxiv.org/abs/1711.00937 section3.2. This uses gradient updates,
not the alternative exponential-moving-average codebook update.
"""

import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


def nearest_numpy(latents, codebook, chunk_size=1024):
    """Squared L2 selection without an [N,K,D] temporary; first tie wins.

    Inputs are finite [N,D] and [K,D] arrays with a nonempty codebook.
    O(NKD) work, O(chunk_size*K) temporary memory. Float64 helps the
    norm expansion on these modest magnitudes; extreme common offsets can
    cause cancellation, so center/rescale those inputs or use direct L2.
    """
    latents = np.asarray(latents, dtype=np.float64)
    codebook = np.asarray(codebook, dtype=np.float64)
    ids = np.empty(len(latents), dtype=np.int64)
    book_norm = np.sum(codebook * codebook, axis=1)
    for start in range(0, len(latents), chunk_size):
        block = latents[start:start + chunk_size]
        distances = (np.sum(block * block, axis=1)[:, None]
                     + book_norm[None, :] - 2 * block @ codebook.T)
        # Do not clip before argmin: clipping can manufacture near-zero ties.
        ids[start:start + len(block)] = np.argmin(distances, axis=1)
    return ids, codebook[ids]


def quantize_torch(latents, codebook, beta=0.25):
    """Latents [N,D], codebook [K,D]; all three losses use mean reduction."""
    distances = (latents.square().sum(1, keepdim=True)
                 + codebook.square().sum(1)[None, :] - 2 * latents @ codebook.T)
    ids = distances.argmin(1)
    selected = codebook[ids]
    straight_through = latents + (selected - latents).detach()
    codebook_loss = F.mse_loss(selected, latents.detach())
    commitment_loss = beta * F.mse_loss(latents, selected.detach())
    return straight_through, ids, codebook_loss, commitment_loss


def gradient_demo():
    """Separate each loss's derivatives instead of inferring them from a fit."""
    encoder = torch.tensor([[0.8, 0.6]], dtype=torch.float64, requires_grad=True)
    book = torch.tensor([[-1., -1.], [1., 1.]],
                        dtype=torch.float64, requires_grad=True)
    selected, ids, book_loss, commitment = quantize_torch(encoder, book)
    reconstruction = selected.square().mean()
    losses = {"reconstruction": reconstruction,
              "codebook": book_loss, "commitment": commitment}
    result = {"selected_id": ids.tolist(), "forward_vector": selected.tolist()}
    for name, loss in losses.items():
        encoder_grad, book_grad = torch.autograd.grad(
            loss, (encoder, book), retain_graph=True, allow_unused=True)
        result[name] = {
            "value": float(loss.detach()),
            "encoder_gradient": None if encoder_grad is None else encoder_grad.tolist(),
            "codebook_gradient": None if book_grad is None else book_grad.tolist(),
        }
    return result


def scalar_update_demo():
    """One scalar encoder/codebook update, identity decoder, target zero.

    With one scalar per term, mean and sum reduction coincide. The hard
    selection remains e=1 forward. Encoder reconstruction derivative2 is
    the straight-through estimate, not the derivative of hard argmin.
    """
    encoder = torch.tensor([[0.8]], dtype=torch.float64, requires_grad=True)
    book = torch.tensor([[1.0]], dtype=torch.float64, requires_grad=True)
    selected, _, book_loss, commitment = quantize_torch(encoder, book)
    reconstruction = selected.square().mean()
    loss = reconstruction + book_loss + commitment
    loss.backward()
    before = {"encoder": encoder.detach().tolist(), "codebook": book.detach().tolist()}
    gradients = {"encoder": encoder.grad.tolist(), "codebook": book.grad.tolist()}
    with torch.no_grad():
        encoder -= 0.1 * encoder.grad
        book -= 0.1 * book.grad
    return {"before": before, "reconstruction": float(reconstruction.detach()),
            "codebook_loss": float(book_loss.detach()),
            "commitment_loss": float(commitment.detach()), "total_loss": float(loss.detach()),
            "gradients": gradients, "learning_rate": 0.1,
            "after": {"encoder": encoder.tolist(), "codebook": book.tolist()}}


class TinyVQVAE(nn.Module):
    def __init__(self, codebook_size=16, latent_width=4):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 16, 4, stride=2, padding=1), nn.ReLU(),
            nn.Conv2d(16, latent_width, 3, padding=1))
        self.codebook = nn.Embedding(codebook_size, latent_width)
        nn.init.uniform_(self.codebook.weight, -1 / codebook_size, 1 / codebook_size)
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(latent_width, 16, 4, stride=2, padding=1),
            nn.ReLU(), nn.Conv2d(16, 1, 3, padding=1), nn.Sigmoid())

    def forward(self, images):
        grid = self.encoder(images)  # [B,D,4,4]
        batch, width, height, columns = grid.shape
        latents = grid.permute(0, 2, 3, 1).reshape(-1, width)
        selected, ids, book_loss, commitment = quantize_torch(
            latents, self.codebook.weight)
        selected_grid = selected.reshape(batch, height, columns, width)
        selected_grid = selected_grid.permute(0, 3, 1, 2).contiguous()
        return self.decoder(selected_grid), ids, book_loss, commitment


def load_digits_subset(path):
    rows = np.genfromtxt(path, delimiter=",", names=True, dtype=None, encoding="utf8")
    pixels = np.stack([rows[f"p{index}"] for index in range(64)], axis=1)
    images = torch.tensor(pixels, dtype=torch.float32).reshape(-1, 1, 8, 8) / 16
    return images[rows["split"] == "train"], images[rows["split"] == "heldout"]


def evaluate(model, images):
    model.eval()
    with torch.no_grad():
        reconstructed, ids, _, _ = model(images)
        counts = torch.bincount(ids, minlength=model.codebook.num_embeddings)
        probabilities = counts[counts > 0].double() / len(ids)
        entropy_bits = -(probabilities * probabilities.log2()).sum()
    return {
        "images": len(images), "latent_grid": [4, 4], "ids": len(ids),
        "reconstruction_mse_mean": float(F.mse_loss(reconstructed, images)),
        "code_counts": counts.tolist(), "used_codes": int((counts > 0).sum()),
        "usage_entropy_bits": float(entropy_bits),
    }


def train_digits(path, epochs):
    torch.manual_seed(0)
    torch.set_num_threads(1)
    torch.use_deterministic_algorithms(True)
    train, heldout = load_digits_subset(path)
    model = TinyVQVAE()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.002)
    before = evaluate(model, heldout)
    epoch_losses = []
    for _ in range(epochs):
        model.train()
        total = 0.0
        for images in train.split(64):
            optimizer.zero_grad(set_to_none=True)
            reconstructed, _, book_loss, commitment = model(images)
            loss = F.mse_loss(reconstructed, images) + book_loss + commitment
            loss.backward()
            optimizer.step()
            total += float(loss.detach()) * len(images)
        epoch_losses.append(total / len(train))
    # Two heldout examples preserve original pixels, codes and actual outputs.
    rows = np.genfromtxt(path, delimiter=",", names=True, dtype=None, encoding="utf8")
    heldout_rows = rows[rows["split"] == "heldout"]
    examples = []
    model.eval()
    with torch.no_grad():
        for index in [0, len(heldout) // 2]:
            original = heldout[index:index + 1]
            reconstructed, ids, _, _ = model(original)
            examples.append({
                "source_index": int(heldout_rows[index]["source_index"]),
                "label": int(heldout_rows[index]["label"]), "split": "heldout",
                "original_8x8": original[0, 0].tolist(),
                "reconstructed_8x8": reconstructed[0, 0].tolist(),
                "latent_ids_4x4": ids.reshape(4, 4).tolist(),
                "reconstruction_mse_mean": float(F.mse_loss(reconstructed, original)),
            })
    return {"seed": 0, "epochs": epochs, "batch_size": 64,
            "optimizer": "Adam", "learning_rate": 0.002, "beta": 0.25,
            "epoch_total_loss_means": epoch_losses,
            "heldout_before": before, "train_after": evaluate(model, train),
            "heldout_after": evaluate(model, heldout), "heldout_examples": examples}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--data", type=Path,
                        default=Path(__file__).with_name("digits_subset.csv"))
    parser.add_argument("--save-reconstructions", type=Path)
    args = parser.parse_args()
    latents = np.array([[0.8, 0.6], [0., 0.], [-0.8, -0.6]])
    book = np.array([[-1., -1.], [1., 1.]])
    ids, selected = nearest_numpy(latents, book)
    torch_ids = quantize_torch(torch.from_numpy(latents), torch.from_numpy(book))[1]
    assert np.array_equal(ids, torch_ids.numpy())
    fit = train_digits(args.data, args.epochs)
    if args.save_reconstructions:
        artifact = {
            "schema_version": 1, "seed": fit["seed"], "epochs": fit["epochs"],
            "program_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "dataset_sha256": hashlib.sha256(args.data.read_bytes()).hexdigest(),
            "train_images": fit["train_after"]["images"],
            "heldout_images": fit["heldout_after"]["images"],
            "heldout_before_mse_mean": fit["heldout_before"]["reconstruction_mse_mean"],
            "heldout_after_mse_mean": fit["heldout_after"]["reconstruction_mse_mean"],
            "heldout_after_code_counts": fit["heldout_after"]["code_counts"],
            "examples": fit["heldout_examples"],
        }
        args.save_reconstructions.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"nearest_ids": ids.tolist(), "selected": selected.tolist(),
                      "gradients": gradient_demo(),
                      "scalar_update": scalar_update_demo(),
                      "digits_vqvae": fit}, indent=2))


if __name__ == "__main__":
    main()
