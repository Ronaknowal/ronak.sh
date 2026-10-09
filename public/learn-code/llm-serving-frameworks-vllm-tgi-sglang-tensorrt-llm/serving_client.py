"""Call an already-running local chat-completions endpoint; no server/model download."""
import argparse
import json
from urllib.request import Request, urlopen


def complete(base_url, model, prompt, maximum=32):
    payload = {'model': model, 'messages': [{'role': 'user', 'content': prompt}],
               'temperature': 0, 'max_tokens': maximum, 'stream': False}
    request = Request(base_url.rstrip('/') + '/chat/completions',
                      data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
    with urlopen(request, timeout=30) as response:
        result = json.load(response)
    choice = result['choices'][0]
    return {'text': choice['message']['content'], 'finish_reason': choice['finish_reason'],
            'usage': result.get('usage')}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', default='http://127.0.0.1:8000/v1')
    parser.add_argument('--model', required=True)
    parser.add_argument('--prompt', default='Explain a cache in one sentence.')
    args = parser.parse_args()
    print(json.dumps(complete(args.base_url, args.model, args.prompt), indent=2))
