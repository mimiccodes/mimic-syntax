// Parse Mimic files with the tree-sitter grammar and fail on any error node.
//
//   node test/tree-sitter-parse.mjs <files or folders…>
// (run from tree-sitter-mimic/, after `npm ci` there)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const grammarDir = path.resolve(here, "../tree-sitter-mimic");

function files(args) {
  const out = [];
  for (const a of args) {
    if (fs.statSync(a).isDirectory()) out.push(...files(fs.readdirSync(a).map((f) => path.join(a, f))));
    else if (a.endsWith(".mim")) out.push(path.resolve(a));
  }
  return out;
}

const list = files(process.argv.slice(2));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mimic-ts-"));
const config = path.join(tmp, "config.json");
fs.writeFileSync(config, JSON.stringify({ "parser-directories": [path.dirname(grammarDir)] }));
const paths = path.join(tmp, "paths.txt");
fs.writeFileSync(paths, list.join("\n") + "\n");
const cli = path.join(grammarDir, "node_modules", ".bin", process.platform === "win32" ? "tree-sitter.cmd" : "tree-sitter");
const r = spawnSync(cli, ["parse", "--config-path", config, "--quiet", "--stat", "--paths", paths], { cwd: grammarDir, encoding: "utf8", shell: process.platform === "win32" });
const out = (r.stdout || "") + (r.stderr || "");
const failed = out.split("\n").filter((l) => l.includes("ERROR") || l.includes("MISSING"));
for (const l of failed.slice(0, 50)) console.log(l.trim());
const total = out.split("\n").find((l) => l.startsWith("Total parses")) || out.trim();
console.log(total);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(failed.length === 0 && list.length > 0 && r.status !== null ? 0 : 1);
