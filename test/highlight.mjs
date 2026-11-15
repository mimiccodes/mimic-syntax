// Tokenize Mimic files with the engine VS Code uses, and fail on any text
// the grammar does not recognise (a token whose only scope is the file's).
//
//   node test/highlight.mjs <files or folders…>
//   node test/highlight.mjs --words <file>   one glyph, word or keyword per
//       line: each must be highlighted as part of the language, not as a
//       plain name
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vsctm from "vscode-textmate";
import oniguruma from "vscode-oniguruma";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const wasm = fs.readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm")).buffer;
await oniguruma.loadWASM(wasm);

const grammars = {
  "source.mimic": path.join(here, "../grammars/mimic.tmLanguage.json"),
  "source.mimic-net": path.join(here, "../grammars/mimic-net.tmLanguage.json"),
};
const registry = new vsctm.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (s) => new oniguruma.OnigScanner(s),
    createOnigString: (s) => new oniguruma.OnigString(s),
  }),
  loadGrammar: async (scope) => {
    const file = grammars[scope];
    return file ? vsctm.parseRawGrammar(fs.readFileSync(file, "utf8"), file) : null;
  },
});

function files(args) {
  const out = [];
  for (const a of args) {
    const st = fs.statSync(a);
    if (st.isDirectory()) {
      out.push(...files(fs.readdirSync(a).map((f) => path.join(a, f))));
    } else if (a.endsWith(".mim") || a.endsWith(".mnet")) {
      out.push(a);
    }
  }
  return out;
}

const words = process.argv[2] === "--words";
const list = files(process.argv.slice(words ? 3 : 2));
let problems = 0;
for (const file of list) {
  const scope = file.endsWith(".mnet") ? "source.mimic-net" : "source.mimic";
  const grammar = await registry.loadGrammar(scope);
  let state = vsctm.INITIAL;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    const r = grammar.tokenizeLine(line, state);
    if (words && line.trim() !== "") {
      const t = r.tokens.find((t) => line.slice(t.startIndex, t.endIndex).trim() !== "");
      const scope = t.scopes[t.scopes.length - 1];
      const whole = line.slice(t.startIndex, t.endIndex) === line.trim();
      if (!whole || scope.startsWith("variable.") || t.scopes.length === 1) {
        problems++;
        console.log(`${file}:${i + 1}: ${JSON.stringify(line.trim())} is not highlighted as Mimic (${scope}, ${JSON.stringify(line.slice(t.startIndex, t.endIndex))})`);
      }
    }
    for (const t of r.tokens) {
      const text = line.slice(t.startIndex, t.endIndex);
      if (t.scopes.length === 1 && text.trim() !== "") {
        problems++;
        if (problems <= 50) console.log(`${file}:${i + 1}:${t.startIndex + 1}: not recognised: ${JSON.stringify(text)}`);
      }
    }
    state = r.ruleStack;
  });
}
console.log(`${list.length} files, ${problems} unrecognised token(s)`);
process.exit(problems === 0 ? 0 : 1);
