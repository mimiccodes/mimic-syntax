# Mimic grammars

Syntax grammars for [Mimic](https://github.com/mimiccodes/mimic), the array language that is parallel by default.

| File | Language | Grammar |
|---|---|---|
| `.mim` | Mimic source, and the project files `mim.mim`, `build.mim` and `mod.mim` | [`grammars/mimic.tmLanguage.json`](grammars/mimic.tmLanguage.json) (`source.mimic`) |
| `.mnet` | Mimic interaction nets (written by `mimic build --emit-net`, run by `mimic net run`) | [`grammars/mimic-net.tmLanguage.json`](grammars/mimic-net.tmLanguage.json) (`source.mimic-net`) |

## What is highlighted

* Keywords, and the word operators `and`, `or`, `not`, `div`.
* Every glyph (`⍳ ⌿ ¨ ▷ ⋔ …`), the word that means the same (`iota keep each |> arms …`), and the backslash digraphs that type them (`\i`).
* Strings with their escapes and `{…}` interpolation (code inside, and the format after `:`), raw strings (`'…'`).
* Numbers: decimal, hex, binary, octal, floats, durations (`300ms`) and the high minus (`¯1`).
* Types: the built-in ones (`i64`, `f64`, `str`, …) and every capitalised name.
* Namespaces: `fs::`, `json::`; names from C or C++ (`c::`, `cpp::`, and an `extern … as name`) get their own scope, `entity.name.namespace.foreign.mimic`, so themes can colour them apart.
* `extern` lines: the effect words (`pure`, `concurrent`, `ordered`, `sync`) and `include`.
* Examples in comments (`// > expression`), which `mimic test` runs.

## Use

* **VS Code:** the [Mimic extension](https://github.com/mimiccodes/mimic-vscode) includes these grammars.
* **Sublime Text, TextMate and other editors with TextMate grammars:** use the files in `grammars/`. `language-configuration.json` has the comment and bracket settings in VS Code's format.
* **GitHub:** GitHub highlights a language once [Linguist](https://github.com/github-linguist/linguist) knows it. `samples/` holds the sample files a Linguist entry needs; the request is made once `.mim` files are used in enough repositories.

## Tree-sitter (Neovim, Helix, Zed)

[`tree-sitter-mimic/`](tree-sitter-mimic) is a tree-sitter grammar for `.mim` files, with highlight queries (`queries/highlights.scm`) in the capture names Neovim, Helix and Zed share. Declarations (modules, functions, parameters, types and their variants, `let`, `use`, `extern`, `test`, and the entries of project files) are parsed exactly. Expressions are a flat run of terms (calls, indexing, fields, lambdas, strings with interpolation, arrays, blocks, glyphs and operators): Mimic reads them left to right, and an editor needs every valid program to parse, not the compiler's precedence.

**Neovim** (nvim-treesitter):

```lua
local parsers = require("nvim-treesitter.parsers").get_parser_configs()
parsers.mimic = {
  install_info = { url = "https://github.com/mimiccodes/mimic-syntax", location = "tree-sitter-mimic", files = { "src/parser.c" } },
  filetype = "mimic",
}
vim.filetype.add({ extension = { mim = "mimic" } })
```

Then `:TSInstall mimic`, and copy `tree-sitter-mimic/queries/highlights.scm` to `queries/mimic/highlights.scm` in your configuration folder.

**Helix** (`languages.toml`):

```toml
[[language]]
name = "mimic"
scope = "source.mimic"
file-types = ["mim"]
comment-token = "//"
indent = { tab-width = 4, unit = "    " }

[[grammar]]
name = "mimic"
source = { git = "https://github.com/mimiccodes/mimic-syntax", subpath = "tree-sitter-mimic", rev = "main" }
```

Then `hx --grammar fetch && hx --grammar build`, and copy the highlight queries to `runtime/queries/mimic/`.

## Tests

```sh
npm ci
npm test                                  # TextMate: the samples
node test/highlight.mjs path/to/files     # any .mim and .mnet files or folders

cd tree-sitter-mimic
npm ci
npm test                                  # tree-sitter: the corpus and the samples
node ../test/tree-sitter-parse.mjs path/to/files
```

The TextMate test tokenizes every file with the engine VS Code uses and fails on any text the grammar does not recognise; the tree-sitter test fails on any error node. The `mimic` repository, which includes this one as a submodule (`editors/syntax`), runs it over all of its test programs and examples, and checks that the grammar knows every glyph, word and keyword of the compiler.

## Licence

Apache License 2.0. Copyright 2026 Harcorp Industries.
