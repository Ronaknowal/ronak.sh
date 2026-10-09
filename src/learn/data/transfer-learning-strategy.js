/** Exact trainable-parameter accounting for the lesson's 64 → 32 → 16 → 5 network. */
export const TRANSFER_BLOCK_SIZES = {
  lower: 64 * 32 + 32, // 2,080
  upper: 32 * 16 + 16, // 528
  head: 16 * 5 + 5, // 85
  adapter: (16 * 4 + 4) + (4 * 16 + 16), // 148
  loraLower: 2 * (64 + 32), // 192
  loraUpper: 2 * (32 + 16), // 96
};

const BLOCK_LABELS = { lower: 'lower layer', upper: 'upper layer', adapter: 'adapter', head: 'head' };

// Map a configuration onto one of the six measured methods, when it matches one.
function measuredMethod({ start, lower, upper, lora, adapter, slowLower }) {
  if (start === 'random') return 'scratch';
  if (lora && !adapter) return 'lora2';
  if (lora) return null;
  if (adapter) return !lower && !upper ? 'adapter4' : null;
  if (lower && upper) return slowLower ? 'discriminative' : 'full';
  if (!lower && !upper) return 'probe';
  return null;
}

export function transferStrategy(config) {
  const s = TRANSFER_BLOCK_SIZES;
  const scratch = config.start === 'random';
  const lower = scratch || config.lower, upper = scratch || config.upper;
  const lora = !scratch && config.lora && !lower && !upper;
  const adapter = !scratch && config.adapter;
  const layerBlock = (name, trains, loraCount, rate) => trains
    ? { name, state: 'trains', trainable: s[name], description: `${scratch ? 'Random start' : 'Source weights'}; learning rate ${rate}` }
    : lora ? { name, state: 'added', trainable: loraCount, description: `Base frozen; LoRA factors train at 0.01` }
    : { name, state: 'frozen', trainable: 0, description: 'Copied source weights, unchanged' };
  const blocks = [
    layerBlock('lower', lower, s.loraLower, config.slowLower && !scratch ? '0.0001' : '0.001'),
    layerBlock('upper', upper, s.loraUpper, '0.001'),
    ...(adapter ? [{ name: 'adapter', state: 'added', trainable: s.adapter, description: 'Starts as the identity; trains at 0.01' }] : []),
    { name: 'head', state: 'trains', trainable: s.head, description: 'Random start; learning rate 0.01' },
  ];
  const trainable = blocks.reduce((sum, block) => sum + block.trainable, 0);
  const total = s.lower + s.upper + s.head + (lora ? s.loraLower + s.loraUpper : 0) + (adapter ? s.adapter : 0);
  const method = measuredMethod({ ...config, lora, adapter });
  const key = !scratch && !lower && upper && !lora && !adapter ? 'partial' : method;
  const featuresUnchanged = !scratch && !lower && !upper && !lora && !adapter;
  const retention = scratch
    ? 'Not applicable: a random backbone never learned digits 0–4.'
    : featuresUnchanged
      ? 'Preserved exactly. The backbone computes the same features, so the original head gives the same answers.'
      : 'Not guaranteed. The features the old head reads will change, so its answers on 0–4 have to be measured again.';
  const countExplanation = blocks.map(block => `${BLOCK_LABELS[block.name]} ${block.trainable.toLocaleString('en-US')}`).join(' + ') + ` = ${trainable.toLocaleString('en-US')}.`;
  return { blocks, trainable, total, method, key, retention, countExplanation };
}
