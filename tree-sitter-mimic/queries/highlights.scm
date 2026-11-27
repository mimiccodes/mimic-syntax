; Mimic highlights (capture names shared by Neovim, Helix and Zed)

(comment) @comment

; declarations
(function_declaration name: (identifier) @function)
(extern_function name: (identifier) @function)
(module_declaration name: (identifier) @module)
(type_declaration name: (type_identifier) @type.definition)
(variant name: (type_identifier) @constructor)
(field_declaration name: (identifier) @property)
(parameter name: (identifier) @variable.parameter)
(lambda parameters: (identifier) @variable.parameter)
(let_statement pattern: (identifier) @variable)
(config_entry key: (identifier) @property)

; calls and names
(call function: (identifier) @function.call)
(type_arguments_call (identifier) @function.call)
(field_access field: (identifier) @property)
(namespace_name) @module
((namespace_name) @module.builtin
  (#any-of? @module.builtin "c" "cpp"))
(extern_block (namespace) @module.builtin)
; the last name of a called path is the function: `fs::read(…)`
(call function: (path (namespace (namespace_name) @function.call) .))
(type_arguments_call (path (namespace (namespace_name) @function.call) .))

; types
(type_identifier) @type
(builtin_type) @type.builtin
((type_identifier) @constant.builtin
  (#any-of? @constant.builtin "Some" "None" "Ok" "Err"))

; literals
(number) @number
(duration) @number
(boolean) @boolean
(string) @string
(raw_string) @string
(escape_sequence) @string.escape
(format_spec) @string.special
(interpolation "{" @punctuation.special "}" @punctuation.special)

; the language's own words and glyphs
(primitive) @function.builtin
(operator) @operator
(keyword_operator) @keyword.operator
(digraph) @operator
(effect) @keyword.modifier
(visibility) @keyword.modifier
(control) @keyword.conditional

[
  "module" "§" "fn" "ƒ" "type" "⊡" "use" "⇐" "as" "≔" "extern" "⌁" "trusted" "✓" "include" "⎘" "test" "⊢" "let" "mut" "⇄" "for" "∀"
] @keyword

["requires" "ensures"] @keyword.debug

["return" "⏎"] @keyword.return

["=>" "⇒" "->" "→"] @operator

["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," ";" ":" "::" "."] @punctuation.delimiter
