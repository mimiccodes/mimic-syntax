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

A tree-sitter grammar (Neovim, Helix, Zed) is planned in this repository too.

## Tests

```sh
npm ci
npm test                                  # the samples
node test/highlight.mjs path/to/files     # any .mim and .mnet files or folders
```

The test tokenizes every file with the engine VS Code uses and fails on any text the grammar does not recognise. The `mimic` repository, which includes this one as a submodule (`editors/syntax`), runs it over all of its test programs and examples, and checks that the grammar knows every glyph, word and keyword of the compiler.

## Licence

Apache License 2.0. Copyright 2026 Harcorp Industries.
