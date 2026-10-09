"""Three-way candidate filtering from pinned, scoped evidence; no benchmark.

A proposition names one precise requirement. Generic streaming support and a
separate model-family claim do not prove that model/backend/precision combination.
Use a joint proposition for the desired route; absent evidence remains unknown.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re


def nonempty(value, name):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{name} must be a nonempty string')
    return value


def validate_manifest(manifest, source_root=None):
    if not isinstance(manifest, dict) or manifest.get('schema') != 1:
        raise ValueError('expected evidence schema 1')
    sources = manifest.get('sources')
    engines = manifest.get('engines')
    if not isinstance(sources, dict) or not sources or not isinstance(engines, list) or not engines:
        raise ValueError('sources and engines are required')
    checked = []
    for key, source in sources.items():
        nonempty(key, 'source ID')
        if not isinstance(source, dict):
            raise ValueError('source record must be an object')
        for field, length in [('commit',40), ('sha256',64)]:
            if not re.fullmatch(r'[0-9a-f]{'+str(length)+'}', source.get(field,'')):
                raise ValueError(f'{key}: invalid {field}')
        url = nonempty(source.get('url'), 'source URL')
        if not url.startswith('https://github.com/') or '/blob/'+source['commit']+'/' not in url:
            raise ValueError(f'{key}: URL must identify the exact source commit')
        relative = Path(nonempty(source.get('saved_path'), 'saved source path'))
        if relative.is_absolute() or '..' in relative.parts:
            raise ValueError('source path must stay within supplied source root')
        if source_root is not None:
            root = Path(source_root).resolve()
            actual = (root/relative).resolve()
            if not actual.is_relative_to(root):
                raise ValueError('source path escaped supplied root')
            if hashlib.sha256(actual.read_bytes()).hexdigest() != source['sha256']:
                raise ValueError(f'{key}: saved source hash mismatch')
            checked.append(key)
    ids = set()
    for engine in engines:
        if not isinstance(engine, dict):
            raise ValueError('engine record must be an object')
        name = nonempty(engine.get('id'), 'engine ID')
        if name in ids:
            raise ValueError('duplicate engine ID')
        ids.add(name)
        claims = engine.get('claims')
        if not isinstance(claims, list):
            raise ValueError('claims must be a list')
        propositions = set()
        for claim in claims:
            if not isinstance(claim, dict):
                raise ValueError('claim must be an object')
            proposition = nonempty(claim.get('proposition'), 'proposition')
            if proposition in propositions:
                raise ValueError('resolve conflicting/duplicate proposition evidence explicitly')
            propositions.add(proposition)
            if claim.get('status') not in {'supported','unsupported','unknown'}:
                raise ValueError('invalid claim status')
            if claim.get('basis') not in {'documented','observed','unresolved'}:
                raise ValueError('invalid evidence basis')
            nonempty(claim.get('scope'), 'claim scope')
            nonempty(claim.get('explanation'), 'claim explanation')
            references = claim.get('sources', [])
            if not isinstance(references, list) or any(ref not in sources for ref in references):
                raise ValueError('unresolved source reference')
            if claim['status'] != 'unknown' and not references:
                raise ValueError('positive and negative claims need pinned evidence')
            if claim['status'] != 'unknown' and claim['basis'] == 'unresolved':
                raise ValueError('unresolved evidence cannot establish support or exclusion')
            if claim['basis'] == 'observed':
                observation = claim.get('observation', {})
                if not isinstance(observation, dict):
                    raise ValueError('observation must be an object')
                nonempty(observation.get('path'), 'observation receipt')
                if not re.fullmatch(r'[0-9a-f]{64}', observation.get('sha256','')):
                    raise ValueError('observed status needs an exact receipt identity')
    return {'saved_source_hashes_verified': checked,
            'verification': 'local bytes checked' if source_root is not None else 'pin metadata only'}


def select_candidates(manifest, requirements, source_root=None):
    verification = validate_manifest(manifest, source_root)
    if not isinstance(requirements, dict) or not requirements:
        raise ValueError('supply at least one precise hard requirement')
    for key, value in requirements.items():
        nonempty(key, 'required proposition')
        if type(value) is not bool:
            raise ValueError('requirements map propositions to true/false')
    decisions = []
    for engine in manifest['engines']:
        claims = {claim['proposition']: claim for claim in engine['claims']}
        rows = []
        for proposition, wanted in requirements.items():
            claim = claims.get(proposition)
            known = claim is not None and claim['status'] != 'unknown'
            actual = claim['status'] == 'supported' if known else None
            result = 'unknown' if not known else ('satisfied' if actual == wanted else 'conflict')
            rows.append({'proposition':proposition, 'required':wanted, 'result':result,
                         'evidence':claim, 'reason':'No exact scoped claim in this packet.' if claim is None else claim['explanation']})
        status = 'excluded' if any(r['result']=='conflict' for r in rows) else (
            'unknown' if any(r['result']=='unknown' for r in rows) else 'eligible')
        decisions.append({'engine':engine['id'], 'decision':status, 'requirements':rows})
    return {'requirements':requirements, 'verification':verification,
            'eligible':[r['engine'] for r in decisions if r['decision']=='eligible'],
            'unknown':[r['engine'] for r in decisions if r['decision']=='unknown'],
            'excluded':[r['engine'] for r in decisions if r['decision']=='excluded'],
            'decisions':decisions}


def reference_examples(manifest):
    streaming = select_candidates(manifest, {'interface.http_streaming':True})
    windows = select_candidates(manifest, {'route.windows_cpu_pythia14m_f16_observed':True})
    legacy_backend = select_candidates(manifest, {'backend.tensorrt_available':True})
    assert 'llama.cpp' in streaming['eligible']
    assert windows['eligible'] == []
    assert len(windows['unknown']) == 6
    assert 'tensorrt-llm' in legacy_backend['excluded']
    assert 'vllm' in legacy_backend['unknown']
    return {'streaming':streaming, 'exact_native_route':windows, 'removed_backend':legacy_backend}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, default=Path(__file__).with_name('engine-evidence.json'))
    parser.add_argument('--requirements', type=Path)
    parser.add_argument('--source-root', type=Path)
    args = parser.parse_args()
    evidence = json.loads(args.manifest.read_text(encoding='utf8'))
    if args.requirements:
        required = json.loads(args.requirements.read_text(encoding='utf8'))
        result = select_candidates(evidence, required, args.source_root)
    else:
        validate_manifest(evidence, args.source_root)
        result = reference_examples(evidence)
    print(json.dumps(result, indent=2, allow_nan=False))
