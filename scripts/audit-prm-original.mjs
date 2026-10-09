import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const record = path.join(root, "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm/original");
const sourcePath = path.join(record, "prm-vs-orm.jsx");
const source = fs.readFileSync(sourcePath, "utf8");
const digest = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const expressions = [...source.matchAll(/<CodeBlock language="python">\s*\{`([\s\S]*?)`\}\s*<\/CodeBlock>/g)];
if (expressions.length !== 7) throw new Error("Expected seven original Python blocks");
const blocks = expressions.map((match, index) => {
  if (match[1].includes("${")) throw new Error("Unexpected executable template interpolation");
  // This only evaluates reviewed local template-string text, with interpolation
  // explicitly rejected. It reproduces JS escapes in the real rendered source.
  const displayed = Function("return `" + match[1] + "`")();
  return { index: index + 1, originalLine: source.slice(0, match.index).split("\n").length, raw: match[1], displayed };
});
const work = path.join(root, "scratch/process-reward-models/original-audit");
fs.mkdirSync(work, { recursive: true });
for (const block of blocks) fs.writeFileSync(path.join(work, `displayed-${block.index}.py`), block.displayed + "\n");
const python = path.join(root, "scratch/lesson-tools/Scripts/python.exe");
const execute = (name, code) => {
  const file = path.join(work, name + ".py");
  fs.writeFileSync(file, code + "\n");
  const result = spawnSync(python, [file], { cwd: work, env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" }, encoding: "utf8", timeout: 30000 });
  return { name, file: path.relative(root, file).replaceAll("\\", "/"), sha256: digest(fs.readFileSync(file)), exitCode: result.status, stdout: result.stdout, stderr: result.stderr, error: result.error?.message };
};
const executions = [
  execute("first-five-displayed-joined", blocks.slice(0, 5).map((x) => x.displayed).join("\n\n")),
  execute("all-six-displayed-joined", blocks.slice(0, 6).map((x) => x.displayed).join("\n\n")),
  execute("six-raw-source-joined-diagnostic", blocks.slice(0, 6).map((x) => x.raw).join("\n\n")),
];
const report = {
  mode: "protected-original execution audit; no lesson publication change",
  source: path.relative(root, sourcePath).replaceAll("\\", "/"),
  sourceSha256: digest(fs.readFileSync(sourcePath)),
  scriptSha256: digest(fs.readFileSync(import.meta.filename)),
  blocks: blocks.map(({ raw, displayed, ...rest }) => ({ ...rest, rawSha256: digest(raw), displayedSha256: digest(displayed), escapesChangeDisplayedCode: raw !== displayed })),
  executions,
  libraryBlock: "Seventh block explicitly says not runnable, has undefined prm_dataset, old import/schema and unpinned dependencies; not executed as a real training program.",
};
const target = path.join(record, "program-audit.json");
if (fs.existsSync(target)) throw new Error("Preserve existing original-audit receipt");
fs.writeFileSync(target, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ report: target, sha256: digest(fs.readFileSync(target)), executions: executions.map(({ name, exitCode, stdout, stderr }) => ({ name, exitCode, stdout, stderr })) }, null, 2));
