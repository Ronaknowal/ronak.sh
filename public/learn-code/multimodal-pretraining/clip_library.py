"""Ordinary Transformers CLIP training with locally constructed configuration.

Run beside alignment_study.py: python clip_library.py --output library-study.json
Requires Transformers, tokenizers, NumPy, PyTorch, scikit-learn. No downloads.
This randomly initialized tiny CLIP is not a released pretrained checkpoint.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import torch
import transformers
from tokenizers import Tokenizer
from tokenizers.models import WordLevel
from tokenizers.pre_tokenizers import Whitespace
from tokenizers.processors import TemplateProcessing
from transformers import (CLIPConfig, CLIPImageProcessor, CLIPModel,
                          CLIPTextConfig, CLIPVisionConfig, PreTrainedTokenizerFast)
from alignment_study import (CAPTIONS, NAMES, CHECKPOINTS, dataset, paired_ce,
                             evaluate, controls, baseline, save_report)


def make_library_model():
    vocab = {"[PAD]":0, "[UNK]":1, "[BOS]":2, "digit":3}
    vocab.update({name:i + 4 for i,name in enumerate(NAMES)})
    vocab["[EOS]"] = 14
    raw_tokenizer = Tokenizer(WordLevel(vocab, unk_token="[UNK]"))
    raw_tokenizer.pre_tokenizer = Whitespace()
    raw_tokenizer.post_processor = TemplateProcessing(
        single="[BOS] $A [EOS]", special_tokens=[("[BOS]",2), ("[EOS]",14)])
    tokenizer = PreTrainedTokenizerFast(
        tokenizer_object=raw_tokenizer, pad_token="[PAD]", unk_token="[UNK]",
        bos_token="[BOS]", eos_token="[EOS]")
    text = CLIPTextConfig(vocab_size=15, hidden_size=32, intermediate_size=64,
                          num_hidden_layers=2, num_attention_heads=4,
                          max_position_embeddings=8, pad_token_id=0,
                          bos_token_id=2, eos_token_id=14, attention_dropout=0.)
    vision = CLIPVisionConfig(hidden_size=32, intermediate_size=64,
                              num_hidden_layers=2, num_attention_heads=4,
                              image_size=8, patch_size=2, num_channels=1,
                              attention_dropout=0.)
    config = CLIPConfig(text_config=text.to_dict(), vision_config=vision.to_dict(),
                        projection_dim=32, logit_scale_init_value=math.log(2.))
    model = CLIPModel(config)
    # Preserve measured 8x8 geometry. This processor rescales; it does not encode.
    processor = CLIPImageProcessor(do_resize=False, do_center_crop=False,
                                   do_normalize=False, do_rescale=True,
                                   rescale_factor=1 / 16, do_convert_rgb=False)
    return model, tokenizer, processor


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=400)
    parser.add_argument("--output", default="library-study.json")
    args = parser.parse_args()
    torch.set_num_threads(1)
    torch.manual_seed(17)
    rng = np.random.default_rng(23)
    pixels, labels, splits = dataset()
    model, tokenizer, processor = make_library_model()
    caption_inputs = tokenizer(CAPTIONS, return_tensors="pt", padding=True)
    caption_inputs = {k:v for k,v in caption_inputs.items() if k != "token_type_ids"}
    processed = processor(images=[row.reshape(8,8,1) for row in pixels],
                          input_data_format="channels_last", return_tensors="pt")
    all_pixels = processed["pixel_values"]
    np.testing.assert_allclose(all_pixels[:,0].numpy(), pixels.reshape(-1,8,8) / 16.)
    optimizer = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=.01)
    fit_by_class = [np.array([i for i in splits["fit"] if labels[i] == c]) for c in range(10)]

    def score_function(x):
        model.eval()
        with torch.no_grad():
            return model(pixel_values=torch.tensor(x.reshape(-1,1,8,8), dtype=torch.float32),
                         **caption_inputs).logits_per_image.numpy()

    logs = []
    loss_parity_error = 0.
    for step in range(args.steps + 1):
        if step in CHECKPOINTS or step == args.steps:
            evaluation = evaluate(score_function, pixels, labels, splits)
            fixed = [group[0] for group in fit_by_class]
            model.eval()
            with torch.no_grad():
                output = model(pixel_values=all_pixels[fixed], **caption_inputs, return_loss=True)
                explicit = paired_ce(output.logits_per_image)
                loss_parity_error = max(loss_parity_error, abs(float(output.loss - explicit)))
            logs.append({"step":step, "fixed_fit_loss":float(output.loss),
                         "development_accuracy":evaluation["development"]["accuracy"],
                         "assessment_accuracy":evaluation["assessment"]["accuracy"]})
        if step == args.steps:
            break
        selected = [rng.choice(group) for group in fit_by_class]
        model.train()
        optimizer.zero_grad()
        output = model(pixel_values=all_pixels[selected], **caption_inputs, return_loss=True)
        output.loss.backward()
        optimizer.step()
        with torch.no_grad():
            model.logit_scale.clamp_(0., math.log(100.))
    final = evaluate(score_function, pixels, labels, splits)
    fixture = all_pixels[splits["assessment"][:3]]
    model.eval()
    with torch.no_grad():
        before = model(pixel_values=fixture, **caption_inputs).logits_per_image
    # A normal save/load route, with the exact checkpoint retained beside report.
    checkpoint = Path(args.output).with_suffix("").with_name(Path(args.output).stem + "-checkpoint")
    model.save_pretrained(checkpoint)
    tokenizer.save_pretrained(checkpoint)
    processor.save_pretrained(checkpoint)
    restored = CLIPModel.from_pretrained(checkpoint).eval()
    with torch.no_grad():
        after = restored(pixel_values=fixture, **caption_inputs).logits_per_image
    reload_error = float((before - after).abs().max())
    report = {"model":"tiny Transformers CLIP; random initialization", "seed":17,
              "sampler_seed":23, "steps":args.steps, "learning_rate":.001,
              "logs":logs, "final":final, "config":model.config.to_dict(),
              "caption_ids":caption_inputs["input_ids"].tolist(),
              "controls":controls(score_function, pixels, labels, splits["assessment"]),
              "baseline":baseline(pixels, labels, splits),
              "loss_parity_max_abs_error":loss_parity_error,
              "reload_max_abs_error":reload_error,
              "transformers_version":transformers.__version__,
              "library_source_sha256":hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    save_report(args.output, report, pixels, labels, splits)
    print(json.dumps({"output":args.output, "checkpoints":logs,
                      "final_correct":final["assessment"]["correct"],
                      "count":final["assessment"]["count"],
                      "loss_parity_max_abs_error":loss_parity_error,
                      "reload_max_abs_error":reload_error}, indent=2))


if __name__ == "__main__":
    main()
