/**
 * PDFToken.js
 *
 * Token definitions for the PDF tokenizer and parser.
 *
 * ISO 32000-1 / ISO 32000-2
 */

export const PDFTokenType = Object.freeze({

    EOF: "EOF",

    // Primitive values

    NUMBER: "NUMBER",
    BOOLEAN: "BOOLEAN",
    NULL: "NULL",

    // Strings

    STRING: "STRING",
    HEX_STRING: "HEX_STRING",

    // Names

    NAME: "NAME",

    // Containers

    ARRAY_START: "ARRAY_START",
    ARRAY_END: "ARRAY_END",

    DICT_START: "DICT_START",
    DICT_END: "DICT_END",

    // References

    REFERENCE: "REFERENCE",

    // Stream

    STREAM: "STREAM",
    ENDSTREAM: "ENDSTREAM",

    // Objects

    OBJ: "OBJ",
    ENDOBJ: "ENDOBJ",

    // XRef

    XREF: "XREF",
    TRAILER: "TRAILER",
    STARTXREF: "STARTXREF",

    // Operators

    OPERATOR: "OPERATOR",

    // Comments

    COMMENT: "COMMENT"
});

export class PDFToken {

    constructor(type, value = null, position = 0) {

        this.type = type;
        this.value = value;
        this.position = position;
    }

    is(type) {
        return this.type === type;
    }

    clone() {

        return new PDFToken(
            this.type,
            this.value,
            this.position
        );
    }

    toString() {

        return `[${this.type}] ${this.value}`;
    }
}

/* ============================================================
   PDF Keywords
============================================================ */

export const PDFKeywords = new Set([

    "obj",
    "endobj",

    "stream",
    "endstream",

    "xref",
    "trailer",
    "startxref",

    "true",
    "false",
    "null",

    "R"
]);

/* ============================================================
   Character Codes
============================================================ */

export const CharCode = Object.freeze({

    NULL: 0x00,

    TAB: 0x09,

    LF: 0x0A,

    FF: 0x0C,

    CR: 0x0D,

    SPACE: 0x20,

    PERCENT: 0x25,

    LPAREN: 0x28,
    RPAREN: 0x29,

    LT: 0x3C,
    GT: 0x3E,

    LBRACKET: 0x5B,
    RBRACKET: 0x5D,

    LBRACE: 0x7B,
    RBRACE: 0x7D,

    SLASH: 0x2F,

    BACKSLASH: 0x5C
});

/* ============================================================
   Whitespace
============================================================ */

export function isWhiteSpace(ch) {

    return (

        ch === CharCode.NULL ||

        ch === CharCode.TAB ||

        ch === CharCode.LF ||

        ch === CharCode.FF ||

        ch === CharCode.CR ||

        ch === CharCode.SPACE
    );
}

/* ============================================================
   Delimiters
============================================================ */

export function isDelimiter(ch) {

    switch (ch) {

        case CharCode.LPAREN:
        case CharCode.RPAREN:

        case CharCode.LT:
        case CharCode.GT:

        case CharCode.LBRACKET:
        case CharCode.RBRACKET:

        case CharCode.LBRACE:
        case CharCode.RBRACE:

        case CharCode.SLASH:

        case CharCode.PERCENT:

            return true;

        default:

            return false;
    }
}

/* ============================================================
   Number
============================================================ */

export function isDigit(ch) {

    return ch >= 48 && ch <= 57;
}

export function isNumberStart(ch) {

    return (

        isDigit(ch) ||

        ch === 43 ||

        ch === 45 ||

        ch === 46
    );
}

/* ============================================================
   Hex
============================================================ */

export function isHex(ch) {

    return (

        (ch >= 48 && ch <= 57) ||

        (ch >= 65 && ch <= 70) ||

        (ch >= 97 && ch <= 102)
    );
}