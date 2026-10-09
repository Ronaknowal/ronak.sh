"""Offline library prefix, learned-query read, masks, gate and mixed-ID targets.

Run beside visual_prefix.py: python multimodal_interfaces.py
Requires NumPy, PyTorch, Transformers. All weights here start randomly.
"""
import json
import math
import numpy as np
import torch
from torch import nn
import torch.nn.functional as F
from transformers import CLIPVisionConfig, LlamaConfig, LlavaConfig, LlavaForConditionalGeneration
from visual_prefix import answer_loss


def qformer_permissions(query_count, text_count, objective):
    """True permits self-attention. Only query rows separately read images."""
    n = query_count + text_count
    allowed = np.zeros((n, n), dtype=bool)
    allowed[:query_count, :query_count] = True
    if objective == "ITC":
        allowed[query_count:, query_count:] = True
    elif objective == "ITM":
        allowed[:] = True
    elif objective == "ITG":
        allowed[query_count:, :query_count] = True
        allowed[query_count:, query_count:] = np.tri(text_count, dtype=bool)
    else:
        raise ValueError("objective must be ITC, ITM or ITG")
    return allowed


def query_read(queries, memory, permitted, wq, wk, wv):
    """One projected head; mask shape is [query rows,memory rows]."""
    q, k, v = queries @ wq.T, memory @ wk.T, memory @ wv.T
    if not permitted.any(1).all():
        raise ValueError("every query needs a permitted key")
    scores = q @ k.T / math.sqrt(q.shape[-1])
    scores = np.where(permitted, scores, -np.inf)
    scores -= scores.max(1, keepdims=True)
    weights = np.exp(scores)
    weights /= weights.sum(1, keepdims=True)
    return weights @ v, weights


def query_example():
    queries = np.array([[1.,0.], [0.,1.]])
    memory = np.array([[1.,0.], [0.,1.], [1.,1.], [-1.,0.]])
    permitted = np.array([[1,1,0,0], [0,1,1,1]], dtype=bool)
    wq = np.array([[1.,.2], [.1,1.]])
    wk = np.eye(2)
    wv = np.array([[.8,.1], [.2,1.]])
    output, weights = query_read(queries, memory, permitted, wq, wk, wv)
    library = nn.MultiheadAttention(2, 1, bias=False, batch_first=True).double()
    with torch.no_grad():
        library.in_proj_weight.copy_(torch.tensor(np.concatenate([wq,wk,wv])))
        library.out_proj.weight.copy_(torch.eye(2, dtype=torch.float64))
    q, m = torch.tensor(queries)[None], torch.tensor(memory)[None]
    # nn.MultiheadAttention's boolean mask uses True = blocked: invert ours.
    ordinary, ordinary_weights = library(q, m, m, attn_mask=torch.tensor(~permitted))
    error = float(np.max(np.abs(output - ordinary.detach().numpy()[0])))
    return {"queries":queries.tolist(), "memory":memory.tolist(),
            "permitted":permitted.tolist(), "weights":weights.tolist(),
            "output":output.tolist(), "mha_max_abs_error":error}


def last_image_permissions(last_image, memory_image_ids):
    return np.asarray(last_image)[:, None] == np.asarray(memory_image_ids)[None, :]


def gated_read(hidden, memory_read, gate):
    return hidden + np.tanh(gate) * memory_read


def llava_example():
    torch.manual_seed(17)
    vision = CLIPVisionConfig(hidden_size=16, intermediate_size=32,
                              num_hidden_layers=1, num_attention_heads=4,
                              image_size=8, patch_size=2, num_channels=1)
    text = LlamaConfig(vocab_size=40, hidden_size=16, intermediate_size=32,
                        num_hidden_layers=1, num_attention_heads=4,
                        num_key_value_heads=2, max_position_embeddings=64,
                        pad_token_id=0, bos_token_id=1, eos_token_id=2,
                        attention_dropout=0.)
    config = LlavaConfig(vision_config=vision.to_dict(), text_config=text.to_dict(),
                         image_token_index=39, image_seq_length=16,
                         vision_feature_layer=-1,
                         vision_feature_select_strategy="default")
    model = LlavaForConditionalGeneration(config).eval()
    model.requires_grad_(False)
    bridge = model.model.multi_modal_projector
    bridge.requires_grad_(True)
    frozen = {k:v.detach().clone() for k,v in model.named_parameters() if not v.requires_grad}
    pixels = torch.linspace(0.,1.,64).reshape(1,1,8,8)
    ids = torch.tensor([[39] * 16 + [3,4,5,2]])
    labels = torch.full_like(ids, -100)
    labels[:,18:] = ids[:,18:]
    result = model(input_ids=ids, attention_mask=torch.ones_like(ids),
                   pixel_values=pixels, labels=labels)
    explicit = answer_loss(result.logits, labels)
    optimizer = torch.optim.SGD(bridge.parameters(), lr=.1)
    optimizer.zero_grad()
    result.loss.backward()
    gradient_norm = float(sum(p.grad.square().sum() for p in bridge.parameters()).sqrt())
    optimizer.step()
    generated = model.generate(input_ids=ids[:,:18], attention_mask=torch.ones_like(ids[:,:18]),
                               pixel_values=pixels, max_new_tokens=3, do_sample=False,
                               pad_token_id=0, eos_token_id=2)
    return {"image_shape":list(pixels.shape), "patch_count":16,
            "placeholder_count":int((ids == 39).sum()),
            "labels":labels.tolist(), "first_answer_predicted_at_logit_position":17,
            "library_loss":float(result.loss.detach()),
            "explicit_shifted_loss":float(explicit.detach()),
            "projector_gradient_norm":gradient_norm,
            "frozen_weights_identical":all(torch.equal(p, frozen[k]) for k,p in model.named_parameters() if k in frozen),
            "generated_ids":generated[0,18:].tolist()}


def mixed_targets():
    # Teaching namespaces only: text0..5, image codes6..9, delimiters10..11.
    ids = torch.tensor([[1,10,6,7,8,9,11,4,2]])
    torch.manual_seed(5)
    logits = torch.randn(1, ids.shape[1], 12, dtype=torch.float64)
    loss = F.cross_entropy(logits[:,:-1].reshape(-1,12), ids[:,1:].reshape(-1))
    z = logits.numpy()[0,:-1]
    targets = ids.numpy()[0,1:]
    maximum = z.max(1)
    terms = maximum + np.log(np.exp(z - maximum[:,None]).sum(1)) - z[np.arange(len(z)),targets]
    return {"ids":ids.tolist(), "next_targets":targets.tolist(),
            "target_families":["image code" if 6 <= int(i) <= 9 else "text/delimiter" for i in targets],
            "torch_loss":float(loss), "numpy_loss":float(terms.mean())}


def main():
    torch.set_num_threads(1)
    permission = last_image_permissions([-1,0,0,1], [0,0,1,1])
    print(json.dumps({"llava":llava_example(), "query":query_example(),
                      "qformer_masks":{name:qformer_permissions(2,3,name).tolist()
                                       for name in ("ITC","ITM","ITG")},
                      "last_image_permitted":permission.tolist(),
                      "gate_zero":gated_read(np.array([1.,2.]),np.array([4.,5.]),0.).tolist(),
                      "mixed":mixed_targets()}, indent=2))


if __name__ == "__main__":
    main()
