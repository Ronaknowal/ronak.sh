import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const record = path.join(root, "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods/original");
const sourcePath = path.join(record, "rlaif-ipo-orpo.jsx");
const source = fs.readFileSync(sourcePath, "utf8");
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const expressions = [...source.matchAll(/<CodeBlock language="python">\s*\{`([\s\S]*?)`\}\s*<\/CodeBlock>/g)];
if (expressions.length !== 8) throw new Error("Expected eight preserved Python blocks");
const blocks = expressions.map((match, index) => {
  if (match[1].includes("${")) throw new Error("Unexpected template interpolation");
  const displayed = Function("return `" + match[1] + "`")();
  return { index: index + 1, originalLine: source.slice(0, match.index).split("\n").length, raw: match[1], displayed };
});
const work = path.join(root, "scratch/rlaif-ipo-orpo/original-audit");
fs.mkdirSync(work, { recursive: true });
for (const block of blocks) fs.writeFileSync(path.join(work, `displayed-${block.index}.py`), block.displayed + "\n");
const python = path.join(root, "scratch/lesson-tools/Scripts/python.exe");
const run = (name, code) => {
  const target = path.join(work, name + ".py");
  fs.writeFileSync(target, "import torch\ntorch.set_num_threads(2)\n" + code + "\n");
  const result = spawnSync(python, ["-X", "utf8", "-B", target], {
    cwd: work, env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    encoding: "utf8", timeout: 60000,
  });
  return { name, path: path.relative(root, target).replaceAll("\\", "/"), sha256: sha(fs.readFileSync(target)), exitCode: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message };
};
const indexProbe = `
full = torch.tensor([p + c], dtype=torch.long)
logps = F.log_softmax(policy(full), dim=-1)
start = len(p) - 1
old = logps[0, start:start+len(c), torch.tensor(c)]
positions = logps[0, start:start+len(c)]
aligned = positions.gather(-1, torch.tensor(c).unsqueeze(-1)).squeeze(-1)
print("INDEX_PROBE", {"old_shape": list(old.shape), "aligned_shape": list(aligned.shape), "old_sum": old.sum().item(), "aligned_sum": aligned.sum().item(), "diagonal_equal": torch.allclose(old.diagonal(), aligned)})
`;
const executions = [
  run("first-five-displayed-joined", blocks.slice(0, 5).map((x) => x.displayed).join("\n\n")),
  run("alignment-probe", blocks[0].displayed + "\n" + indexProbe),
];
const target = path.join(record, "program-audit.json");
if (fs.existsSync(target)) throw new Error("Preserve previous audit");
const report = {
  source: path.relative(root, sourcePath).replaceAll("\\", "/"), sourceSha256: sha(fs.readFileSync(sourcePath)),
  scriptSha256: sha(fs.readFileSync(import.meta.filename)),
  executionScope: "The protected original's first five toy blocks; two-thread prologue only. Python random is unseeded in the original. Library placeholders are not trained or downloaded.",
  blocks: blocks.map(({ raw, displayed, ...metadata }) => ({ ...metadata, rawSha256: sha(raw), displayedSha256: sha(displayed), escapesChangeDisplayedCode: raw !== displayed })),
  executions,
  libraryScope: "Sixth is a definition-only generator sketch with commented undefined usage; seventh/eighth have unpinned large checkpoints and placeholder dataset repositories. These are inspected source, not executed production training.",
};
fs.writeFileSync(target, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ report: path.relative(root, target), sha256: sha(fs.readFileSync(target)), executions }, null, 2));
