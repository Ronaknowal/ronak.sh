# Six ordinary entrypoints, source-checked and unexecuted

These are complete usage examples for an already prepared compatible engine environment. No recipe below was run during authoring. The native CPU acquisition/conversion/measurement program is a separate controlled route owned by `native_cpu_route.py`; do not count these optional commands as its observations or add them to its four-request campaign.

`engine-evidence.json` binds the exact saved primary documents, commit URLs and local hashes. A documentation commit identifies the inspected interface, not the installed binary, CUDA stack or container image. Before executing a recipe, install that engine following its platform-specific installation guide, verify the actual executable/package revision, choose a supported model/backend/precision combination and record the complete environment. GPU recipes require an appropriate GPU environment. They are not Windows CPU instructions. Model IDs may download weights; an existing compatible local path avoids that only where the engine supports it. Nothing here downloads a model on behalf of the reader.

For the POSIX-shell examples, set `MODEL` to your selected compatible model ID/path. Chat routes additionally require the model's correct chat template. These examples set a 16-new-token request limit; stop semantics remain endpoint-specific. Keep each server in its own foreground terminal and stop that process with Ctrl+C after use. Do not launch the examples simultaneously on their default ports.

## Shared nonstreaming chat client

Save the following complete standard-library client as `send_chat.py`. It accepts the actual server URL and its advertised model identifier, posts one bounded request, prints the complete JSON response and closes its connection. It does not infer output quality, token timing or cross-engine parity from HTTP compatibility.

```python
import argparse
import json
from urllib.request import Request, urlopen

parser = argparse.ArgumentParser()
parser.add_argument('url')
parser.add_argument('model')
args = parser.parse_args()
payload = {
    'model': args.model,
    'messages': [{'role': 'user', 'content': 'Name one primary color.'}],
    'max_tokens': 16,
    'temperature': 0,
}
request = Request(
    args.url,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
    method='POST',
)
with urlopen(request, timeout=60) as response:
    result = json.load(response)
print(json.dumps(result, indent=2, ensure_ascii=False))
```

Streaming needs the endpoint's explicit event adapter and the lesson's incremental SSE parser. Do not parse each transport read as JSON or assign one token to each event. The common client deliberately requests a whole response because the pinned TRT quick-start provides that contract; the separate SGLang/vLLM/TGI/llama sources establish their specific streaming routes.

## vLLM

The [pinned architecture](https://github.com/vllm-project/vllm/blob/2ddde19e8e0ba1b9d06a3f9b6201f7fc915d27ab/docs/design/arch_overview.md) distinguishes the offline `LLM` class from `vllm serve`, API processing, engine scheduling/KV ownership and model workers. In the prepared vLLM environment:

```sh
: "${MODEL:?Set MODEL to a compatible model ID or local path}"
vllm serve "$MODEL"
```

From a second terminal, use the URL reported by that server (the usual default is shown; replace it when configured differently):

```sh
python send_chat.py http://127.0.0.1:8000/v1/chat/completions "$MODEL"
```

For the documented offline route instead of an HTTP process:

```python
import os
from vllm import LLM, SamplingParams

model = LLM(model=os.environ['MODEL'])
outputs = model.generate(['The capital of France is'], SamplingParams(temperature=0, max_tokens=16))
for output in outputs:
    print({'prompt': output.prompt, 'text': output.outputs[0].text})
```

The one-shot Python process owns and releases its model on exit. This is an alternative entrypoint, not a second workload required after the server request.

## SGLang

The [pinned request tutorial](https://github.com/sgl-project/sglang/blob/d8448d2e6212920eb816390a37e7f8b40cbf0a3a/docs/docs/basic_usage/send_request.mdx) supplies launch, chat and native generation examples. The host is narrowed to loopback here:

```sh
: "${MODEL:?Set MODEL to a supported model ID or local path}"
python3 -m sglang.launch_server --model-path "$MODEL" --host 127.0.0.1
```

Then:

```sh
python send_chat.py http://127.0.0.1:30000/v1/chat/completions "$MODEL"
```

The tutorial's native `/generate` stream emits cumulative `text`; a client must track the previous length to obtain each new suffix. A chat delta adapter cannot be blindly reused for that native endpoint. Stopping the foreground launch process is distinct from closing one HTTP response.

## TensorRT-LLM

Use the [same-pin migration guide](https://github.com/NVIDIA/TensorRT-LLM/blob/ce2e2f8b7023f385711c2395ac83e046fbcbea84/docs/source/legacy/tensorrt-backend-removal.md) and [quick-start](https://github.com/NVIDIA/TensorRT-LLM/blob/ce2e2f8b7023f385711c2395ac83e046fbcbea84/docs/source/quick-start-guide.md). The explicit migration removes the TensorRT engine backend: PyTorch is the sole execution backend at this revision. Do not run old `trtllm-build` instructions or pass `--backend tensorrt` based on the older architecture introduction. In the compatible installed GPU environment/container:

```sh
: "${MODEL:?Set MODEL to a supported checkpoint or model ID}"
trtllm-serve "$MODEL"
```

Inside that environment, or through an explicitly exposed local port:

```sh
python send_chat.py http://127.0.0.1:8000/v1/chat/completions "$MODEL"
```

The source shows direct checkpoint serving and the nonstreaming chat request used here. FP8 needs matching GPU support; a model-family name alone does not establish that combination. No streaming or quantization result is claimed from this recipe.

## Text Generation Inference

The [pinned README](https://github.com/huggingface/text-generation-inference/blob/b4adbf2f6e2e721280bd0ea5f91d70f7d033f5ed/README.md) states maintenance mode, with minor fixes/documentation/lightweight maintenance rather than new major feature development. It still documents a working serving interface; maintenance is not a claim that all models fail. Its Docker example names version 3.3.5. Resolve and record the actual image digest before treating a run as reproducible; that release image is not asserted to equal the documentation commit.

```sh
: "${MODEL:?Set MODEL to a supported Hugging Face model ID}"
: "${TGI_IMAGE:?Set TGI_IMAGE to the verified TGI image reference/digest for your environment}"
mkdir -p "$PWD/tgi-model-data"
docker run --rm --gpus all --shm-size 1g \
  -p 127.0.0.1:8080:80 \
  -v "$PWD/tgi-model-data:/data" \
  "$TGI_IMAGE" --model-id "$MODEL"
```

From a second terminal:

```sh
curl --fail-with-body --no-buffer --max-time 60 \
  -H 'Content-Type: application/json' \
  -d '{"inputs":"The capital of France is","parameters":{"max_new_tokens":16}}' \
  http://127.0.0.1:8080/generate_stream
```

This displays raw SSE records. Feed their bytes through `sse_records.py` for structured event handling; displayed reads are not measured token clocks. Ctrl+C stops the foreground container, and `--rm` removes only that stopped container. The model-data directory remains reusable.

## llama.cpp

The [release-pinned native server README](https://github.com/ggml-org/llama.cpp/blob/d81235049384534c167caea52b85a694f6103d14/tools/server/README.md) supplies CPU flags and `/completion`. Use a verified existing `llama-server` binary and compatible GGUF file. In Windows PowerShell:

```powershell
$serverPath = Read-Host 'Absolute path to the verified llama-server.exe'
$ggufPath = Read-Host 'Absolute path to your compatible GGUF model'
& $serverPath -m $ggufPath -ngl 0 -c 512 -np 1 -t 2 --host 127.0.0.1 --port 8080
```

In another PowerShell terminal, after health reports ready:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/health
$requestBody = @{
    prompt = 'The capital of France is'
    n_predict = 16
    temperature = 0
    seed = 0
    cache_prompt = $false
    return_tokens = $true
    stream = $false
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8080/completion `
    -ContentType 'application/json' -Body $requestBody -TimeoutSec 60
```

Use Ctrl+C in the owning server terminal when finished. The native protocol separately uses streaming and records every event. This endpoint allows `n_predict:0` for prompt evaluation and may exceed a positive requested limit to finish a multibyte character; preserve actual outputs rather than claiming a universal hard 16-token bound. A CPU feature statement does not itself verify this particular executable, GGUF conversion and tokenizer.

## DeepSpeed-MII

The [pinned README](https://github.com/deepspeedai/DeepSpeed-MII/blob/8abdd987421988a9d50d8b1dfa71ca6283a30f6c/README.md) distinguishes an offline pipeline from a persistent gRPC deployment. Its described kernel environment is NVIDIA/CUDA with appropriate Linux support. The following complete Python file uses the documented persistent client and guaranteed cleanup after successful creation:

```python
import os
import mii

client = mii.serve(os.environ['MODEL'])
try:
    responses = client.generate(['The capital of France is'], max_new_tokens=16, do_sample=False)
    for response in responses:
        print({
            'text': response.generated_text,
            'prompt_length': response.prompt_length,
            'generated_length': response.generated_length,
            'finish_reason': response.finish_reason,
        })
finally:
    client.terminate_server()
```

For a nonpersistent alternative, use `pipe = mii.pipeline(os.environ['MODEL'])`, call `pipe` with the same prompt list/options and call `pipe.destroy()` in `finally`. Persistent gRPC is not the shared HTTP chat client. The README's streaming example is inside an HTML comment; this packet does not promote that commented example into documented current streaming eligibility. Old promotional speed ratios are not a comparison result for these recipes.

## What the examples establish

The six routes demonstrate distinct documented entrypoints and lifetimes. They supply no measured ranking, universal joint-feature matrix or native success receipt. Each eventual run must bind its actual model/tokenizer, executable, configuration and outputs. Use `engine_requirements.py` to retain unknown requirements, and `compare_traces.py` only after exact common manifests and complete offered-request receipts agree.
