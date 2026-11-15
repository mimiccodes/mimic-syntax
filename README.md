# Mimic grammars

Syntax grammars for [Mimic](https://github.com/mimiccodes/mimic), the array language that is parallel by default.

| File | Language |
|---|---|
| `.mim` | Mimic source, and the project files `mim.mim`, `build.mim` and `mod.mim` |
| `.mnet` | Mimic interaction nets (the text form `mimic build --emit-net` writes and `mimic net run` reads) |

This repository will hold:

* **TextMate grammars** (`grammars/`), used by VS Code, Sublime Text, and by GitHub Linguist.
* **A tree-sitter grammar** (`tree-sitter-mimic/`), for Neovim, Helix, Zed and other editors.
* **Samples** (`samples/`), the files GitHub Linguist needs to recognise Mimic.

The grammars are developed together with the compiler: the `mimic` repository includes this one as a submodule (`editors/syntax`), and its CI checks that the grammars know every glyph, word and keyword of the language.

## Licence

Apache License 2.0. Copyright 2026 Harcorp Industries.
