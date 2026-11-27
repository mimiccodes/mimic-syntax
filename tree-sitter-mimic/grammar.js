/**
 * Tree-sitter grammar for Mimic (.mim): Neovim, Helix, Zed and other editors.
 *
 * Declarations (modules, functions, types, `use`, `extern`, `test`, `let`)
 * are parsed exactly. Expressions are a flat run of terms: Mimic reads them
 * left to right with glyphs as prefix and infix operators, and an editor
 * needs every valid program to parse (for highlighting, folding and
 * selection), not the compiler's precedence. Calls, indexing, fields,
 * lambdas, strings with interpolation, arrays and blocks are nodes of
 * their own inside that run.
 */

const PRIM_WORDS = [
  'iota', 'shape', 'reverse', 'sum', 'product', 'maximum', 'minimum', 'len', 'print',
  'take', 'drop', 'keep', 'each', 'range', 'max', 'min', 'abs', 'gather', 'trail',
  'evolve', 'settle', 'reshape', 'transpose', 'matmul',
];

const PRIM_GLYPHS = [
  '+/', '×/', '*/', '⌈/', '⌊/', '⍳', '⍴', '⌽', '≢', '⎕', '↑', '↓', '⌿', '¨', '‥',
  '⌈', '⌊', '∣', '∕', '⍀', '⍣', '⍥', '⥊', '⍉', '⊠',
];

const OPERATORS = [
  '▷', '|>', '×', '÷', '⫽', '≠', '≤', '≥', '∧', '∨', '¬', '←', '↩',
  '==', '!=', '<=', '>=', '<', '>', '>>>', '<<', '>>', '&', '^', '~',
  '+', '-', '*', '/', '%', '=', '..', '|', '!',
];

const BUILTIN_TYPES = [
  'i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'isize', 'usize', 'f32', 'f64',
  'bool', 'char', 'str', 'any', 'c_char', 'cstr', 'cptr', 'fnref', 'ptr',
];

const commaSep = (rule) => optional(seq(rule, repeat(seq(',', rule)), optional(',')));

module.exports = grammar({
  name: 'mimic',

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$._condition, $.record_literal],
    [$.record_literal, $._interpolated_term],
    [$.record_literal, $._term],
    [$.scoped_type, $.path],
    [$.tuple_type, $.parenthesized],
    [$.generic_type, $._term],
    [$.lambda, $._term],
    [$.lambda, $._interpolated_term],
    [$.lambda, $.parenthesized],
    [$._term, $._type],
  ],

  rules: {
    source_file: ($) => repeat($._item),

    _item: ($) => choice(
      $.module_declaration,
      $.function_declaration,
      $.type_declaration,
      $.use_declaration,
      $.extern_block,
      $.test_block,
      $.let_statement,
      $.config_entry,
      ',',
      ';',
    ),

    comment: (_) => token(choice(seq('//', /[^\n]*/), seq('⍝', /[^\n]*/))),

    // ---- declarations ----------------------------------------------------

    visibility: (_) => choice('pub', '⇑'),

    module_declaration: ($) => prec.right(seq(
      optional($.visibility),
      choice('module', '§'),
      field('name', $.identifier),
      optional(seq('{', repeat($._item), '}')),
    )),

    function_declaration: ($) => seq(
      optional($.visibility),
      optional(seq(choice('extern', '⌁'), $.string)),
      choice('fn', 'ƒ'),
      field('name', $.identifier),
      optional($.type_parameters),
      field('parameters', $.parameters),
      optional(seq(choice('->', '→'), field('return_type', $._type))),
      repeat($.contract),
      field('body', $.block),
    ),

    // `requires n >= 0`, `ensures result > 0`
    contract: ($) => seq(choice('requires', 'ensures'), field('condition', alias($._condition, $.expression))),

    // an expression with no bare block in it: the function's body follows
    _condition: ($) => prec.right(5, repeat1(choice(
      $.number, $.duration, $.string, $.raw_string, $.boolean, $.identifier, $.type_identifier, $.path, $.call,
      $.index, $.field_access, $.parenthesized, $.array, $.primitive, $.operator, $.keyword_operator, $.digraph,
    ))),

    type_parameters: ($) => seq('[', commaSep($.type_identifier), ']'),

    parameters: ($) => seq('(', commaSep($.parameter), ')'),

    parameter: ($) => seq(
      field('name', $.identifier),
      optional(seq(':', field('type', $._type))),
      optional(seq('=', field('default', $.expression))),
    ),

    type_declaration: ($) => seq(
      optional($.visibility),
      choice('type', '⊡'),
      // (a lowercase name is an error the compiler explains; still a type here)
      field('name', choice($.type_identifier, alias($.identifier, $.type_identifier))),
      optional($.type_parameters),
      '=',
      choice($.record_type, $.union_type),
    ),

    record_type: ($) => seq('{', commaSep($.field_declaration), '}'),

    field_declaration: ($) => seq(field('name', $.identifier), ':', field('type', $._type)),

    union_type: ($) => prec.right(seq(optional('|'), $.variant, repeat(seq('|', $.variant)))),

    variant: ($) => prec.right(seq(field('name', $.type_identifier), optional(seq('(', commaSep($._type), ')')))),

    use_declaration: ($) => seq(choice('use', '⇐'), $.path, optional(seq(choice('as', '≔'), $.identifier))),

    extern_block: ($) => prec.right(seq(
      optional($.visibility),
      optional(choice('trusted', '✓')),
      choice('extern', '⌁'),
      $.string,
      repeat(choice($.effect, seq(choice('include', '⎘'), $.string), seq(choice('as', '≔'), alias($.identifier, $.namespace)))),
      optional(seq('{', repeat(choice($.extern_function, seq(choice('include', '⎘'), $.string), ',', ';')), '}')),
    )),

    effect: (_) => choice('pure', 'concurrent', 'ordered', 'sync'),

    extern_function: ($) => seq(
      optional($.visibility),
      choice('fn', 'ƒ'),
      field('name', $.identifier),
      optional($.type_parameters),
      '(',
      commaSep(choice($.parameter, '...')),
      ')',
      optional(seq(choice('->', '→'), $._type)),
    ),

    // project files (mim.mim, build.mim, mod.mim): `project { … }`,
    // `profile release { … }`, `project = "name"`
    config_entry: ($) => prec.right(seq(
      field('key', $.identifier),
      optional(field('name', $.identifier)),
      choice($.block, seq('=', $.expression)),
    )),

    // `test "…" for x: i64, xs: [i64] { … }`: a property test
    test_block: ($) => seq(choice('test', '⊢'), $.string, optional(seq(choice('for', '∀'), commaSep($.parameter))), $.block),

    // ---- types -------------------------------------------------------------

    _type: ($) => choice(
      $.builtin_type,
      $.type_identifier,
      $.generic_type,
      $.scoped_type,
      $.array_type,
      $.tuple_type,
      $.function_type,
    ),

    builtin_type: (_) => choice(...BUILTIN_TYPES),

    generic_type: ($) => seq(choice($.type_identifier, $.builtin_type, $.scoped_type), '[', commaSep($._type), ']'),

    scoped_type: ($) => seq($.namespace, repeat(seq('::', $.namespace)), '::', $.type_identifier),

    array_type: ($) => seq('[', $._type, optional(seq(':', $._type)), ']'),

    tuple_type: ($) => seq('(', commaSep($._type), ')'),

    function_type: ($) => prec.right(seq(choice('fn', 'ƒ'), '(', commaSep($._type), ')', optional(seq(choice('->', '→'), $._type)))),

    // ---- statements --------------------------------------------------------

    block: ($) => seq('{', repeat(choice($.let_statement, $.mut_binding, $.return_statement, $.expression, ',', ';')), '}'),

    // `mut x ← 1` (`⇄ x ← 1`): a mutable binding without `let`
    mut_binding: ($) => prec.right(seq(choice('mut', '⇄'), field('value', $.expression))),

    let_statement: ($) => prec.right(seq(
      'let',
      optional(choice('mut', '⇄')),
      field('pattern', choice($.identifier, seq('(', commaSep($.identifier), ')'))),
      optional(seq(':', field('type', $._type))),
      '=',
      field('value', $.expression),
    )),

    return_statement: ($) => prec.right(seq(choice('return', '⏎'), optional($.expression))),

    // ---- expressions: a run of terms ---------------------------------------

    expression: ($) => prec.right(repeat1($._term)),

    _term: ($) => choice(
      $.number,
      $.duration,
      $.string,
      $.raw_string,
      $.boolean,
      $.empty_list,
      $.character,
      $.identifier,
      $.type_identifier,
      $.path,
      $.call,
      $.index,
      $.field_access,
      $.lambda,
      $.parenthesized,
      $.array,
      $.block,
      $.primitive,
      $.operator,
      $.keyword_operator,
      $.control,
      $.digraph,
      ':',
      '=>',
      '⇒',
      '→',
      '->',
    ),

    control: (_) => choice('if', '⍰', 'else', '⋄', 'match', '⊨', 'with', '⊕', 'arms', '⋔', 'unsafe', '☡', 'while', '⟳', 'for', '∀', 'in', 'break', '↯', token(prec(2, seq('if', /\s+/, 'let')))),

    keyword_operator: (_) => choice('and', 'or', 'not', 'div'),

    primitive: (_) => choice(...PRIM_GLYPHS, ...PRIM_WORDS),

    operator: (_) => choice(...OPERATORS),

    digraph: (_) => token(seq('\\', /[A-Za-z0-9^#.&|!_<>=\/%?:]/)),

    path: ($) => prec(2, seq($.namespace, repeat1(seq('::', choice($.namespace, $.type_identifier))))),

    namespace: ($) => alias($.identifier, $.namespace_name),

    call: ($) => prec(3, seq(
      field('function', choice($.identifier, $.path, $.primitive, $.type_arguments_call)),
      token.immediate('('),
      commaSep($.expression),
      ')',
    )),

    // `json::decode[User](text)`: the callee with its explicit type arguments
    type_arguments_call: ($) => prec.dynamic(1, seq(choice($.identifier, $.path), token.immediate('['), commaSep($._type), ']')),

    index: ($) => prec(3, seq(choice($.identifier, $.call, $.field_access, $.index, $.parenthesized), token.immediate('['), commaSep($.expression), ']')),

    // `Point { x: 1 }.x`: a record literal's field
    record_literal: ($) => seq(choice($.type_identifier, $.scoped_type), $.block),

    field_access: ($) => prec(3, seq(choice($.identifier, $.call, $.index, $.parenthesized, $.field_access, $.record_literal, $.block), token.immediate('.'), field('field', choice($.identifier, alias(token.immediate(/\d+/), $.number))))),

    lambda: ($) => prec.right(seq(
      field('parameters', choice($.identifier, seq('(', commaSep($.identifier), ')'))),
      choice('=>', '⇒'),
      field('body', $.expression),
    )),

    parenthesized: ($) => seq('(', commaSep($.expression), ')'),

    array: ($) => seq('[', repeat(choice($.expression, ',')), ']'),

    boolean: (_) => choice('true', '●', 'false', '○'),

    // `⍬`: an empty list of i64 (`⍬[f64]`: the type follows as an index)
    empty_list: (_) => '⍬',

    // `a`: a character's code, a number (`\n`, `\``, `\x1b`, `\u{e9}`)
    character: (_) => token(seq('`', choice(/[^`\\\n]/, /\\[ntr0\\`'"]/, /\\x[0-9a-fA-F]{2}/, /\\u\{[0-9a-fA-F]+\}/), '`')),

    number: (_) => token(seq(
      optional('¯'),
      choice(
        /0x[0-9A-Fa-f_]+/,
        /0b[01_]+/,
        /0o[0-7_]+/,
        /\d[\d_]*(\.\d[\d_]*)?([eE][-+]?\d+)?/,
      ),
    )),

    duration: (_) => token(seq(optional('¯'), /\d[\d_]*(\.\d[\d_]*)?/, choice('ns', 'us', 'ms', 's', 'min', 'h'))),

    string: ($) => seq(
      '"',
      repeat(choice($.string_content, $.escape_sequence, $.interpolation)),
      token.immediate('"'),
    ),

    // `{` starts an interpolation; a lone `}` is text
    string_content: (_) => token.immediate(prec(1, /[^"\\{]+/)),

    escape_sequence: (_) => token.immediate(seq('\\', choice(/[ntr0\\"{}]/, /x[0-9A-Fa-f]{2}/, /u\{[0-9A-Fa-f]{1,6}\}/))),

    interpolation: ($) => seq(
      token.immediate('{'),
      repeat($._interpolated_term),
      optional(seq(':', $.format_spec)),
      '}',
    ),

    _interpolated_term: ($) => choice(
      $.number, $.string, $.raw_string, $.boolean, $.character, $.empty_list, $.identifier, $.type_identifier, $.path, $.call, $.index,
      $.field_access, $.parenthesized, $.array, $.primitive, $.operator, $.keyword_operator, $.control,
      $.block, $.lambda, '=>', '⇒',
    ),

    format_spec: (_) => token.immediate(/[^}]+/),

    raw_string: (_) => token(seq("'", /[^'\n]*/, "'")),

    identifier: (_) => /[a-z_][A-Za-z0-9_]*/,

    type_identifier: (_) => /[A-Z][A-Za-z0-9_]*/,
  },
});
