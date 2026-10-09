"""Current installed LLaVA shape contract; no fitting or study replay."""
import hashlib
import json
from pathlib import Path
import torch
import transformers
from transformers import CLIPVisionConfig, LlamaConfig, LlavaConfig, LlavaForConditionalGeneration

torch.set_num_threads(1)
torch.manual_seed(17)
vision = CLIPVisionConfig(hidden_size=16, intermediate_size=32, num_hidden_layers=1,
                         num_attention_heads=4, image_size=8, patch_size=2, num_channels=1)
text = LlamaConfig(vocab_size=40, hidden_size=16, intermediate_size=32, num_hidden_layers=1,
                   num_attention_heads=4, num_key_value_heads=2, max_position_embeddings=64,
                   pad_token_id=0, bos_token_id=1, eos_token_id=2, attention_dropout=0.)
model = LlavaForConditionalGeneration(LlavaConfig(vision_config=vision.to_dict(), text_config=text.to_dict(),
    image_token_index=39, image_seq_length=16, vision_feature_layer=-1,
    vision_feature_select_strategy='default')).eval()
pixels = torch.linspace(0., 1., 64).reshape(1, 1, 8, 8)
errors = {}
with torch.no_grad():
    for count in [15, 17]:
        ids = torch.tensor([[39] * count + [3, 4]])
        try:
            model(input_ids=ids, attention_mask=torch.ones_like(ids), pixel_values=pixels)
        except (ValueError, RuntimeError) as error:
            errors[str(count)] = str(error)
        else:
            raise AssertionError('Mismatched image token count was accepted')
    ids = torch.tensor([[39] * 16 + [3, 4]])
    output = model(input_ids=ids, attention_mask=torch.ones_like(ids), pixel_values=pixels)
    assert output.logits.shape == (1, 18, 40)
owners = {name: sum(p.numel() for p in owner.parameters()) for name, owner in {
    'vision': model.model.vision_tower, 'projector': model.model.multi_modal_projector,
    'language_backbone': model.model.language_model, 'language_head': model.lm_head}.items()}
root = Path(__file__).resolve().parents[1]
receipt = {'transformers': transformers.__version__, 'valid_logits_shape': list(output.logits.shape),
    'mismatch_errors': errors, 'parameter_owners': owners, 'scope': 'Three no_grad forwards in a random mechanism fixture; no training.',
    'verifier_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
destination = root / 'docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment/native/library-edge-checks.json'
destination.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
print(json.dumps(receipt, indent=2))
