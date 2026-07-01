/**
 * PDFTokenizer.js
 *
 * Low-level PDF tokenizer.
 * Converts byte stream → tokens.
 */

import {
    PDFToken,
    PDFTokenType,
    PDFKeywords,
    CharCode,
    isWhiteSpace,
    isDelimiter,
    isDigit,
    isNumberStart,
    isHex
} from "./PDFToken.js";

export class PDFTokenizer {

    constructor(stream) {

        this.stream = stream;
        this.position = 0;
    }

    /* =========================================================
       MAIN ENTRY
    ========================================================= */

    getNextToken() {

        this._skipWhitespaceAndComments();

        if (this.stream.eof()) {
            return new PDFToken(PDFTokenType.EOF, null);
        }

        const ch = this.stream.peekByte();

        // Numbers
        if (isNumberStart(ch)) {
            return this._readNumber();
        }

        // Names
        if (ch === CharCode.SLASH) {
            return this._readName();
        }

        // Strings
        if (ch === CharCode.LPAREN) {
            return this._readLiteralString();
        }

        // Hex string
        if (ch === CharCode.LT) {
            return this._readHexString();
        }

        // Array
        if (ch === CharCode.LBRACKET) {
            this.stream.readByte();
            return new PDFToken(PDFTokenType.ARRAY_START, "[");
        }

        if (ch === CharCode.RBRACKET) {
            this.stream.readByte();
            return new PDFToken(PDFTokenType.ARRAY_END, "]");
        }

        // Dictionary
        if (ch === CharCode.LT && this.stream.peekByte(1) === CharCode.LT) {
            this.stream.readBytes(2);
            return new PDFToken(PDFTokenType.DICT_START, "<<");
        }

        if (ch === CharCode.GT && this.stream.peekByte(1) === CharCode.GT) {
            this.stream.readBytes(2);
            return new PDFToken(PDFTokenType.DICT_END, ">>");
        }

        // Comments
        if (ch === CharCode.PERCENT) {
            return this._readComment();
        }

        // Default word / keyword / operator
        return this._readWord();
    }

    /* =========================================================
       WHITESPACE + COMMENTS
    ========================================================= */

    _skipWhitespaceAndComments() {

        while (!this.stream.eof()) {

            let ch = this.stream.peekByte();

            if (isWhiteSpace(ch)) {
                this.stream.readByte();
                continue;
            }

            if (ch === CharCode.PERCENT) {
                this._readComment();
                continue;
            }

            break;
        }
    }

    _readComment() {

        let text = "";

        while (!this.stream.eof()) {

            const ch = this.stream.readByte();

            if (ch === CharCode.LF || ch === CharCode.CR) {
                break;
            }

            text += String.fromCharCode(ch);
        }

        return new PDFToken(PDFTokenType.COMMENT, text);
    }

    /* =========================================================
       NUMBER
    ========================================================= */

    _readNumber() {

        let str = "";

        while (!this.stream.eof()) {

            const ch = this.stream.peekByte();

            if (
                isDigit(ch) ||
                ch === 45 || // -
                ch === 43 || // +
                ch === 46    // .
            ) {
                str += String.fromCharCode(this.stream.readByte());
            } else {
                break;
            }
        }

        const num = Number(str);

        return new PDFToken(PDFTokenType.NUMBER, num);
    }

    /* =========================================================
       NAME
    ========================================================= */

    _readName() {

        this.stream.readByte(); // skip /

        let name = "";

        while (!this.stream.eof()) {

            const ch = this.stream.peekByte();

            if (isWhiteSpace(ch) || isDelimiter(ch)) {
                break;
            }

            name += String.fromCharCode(this.stream.readByte());
        }

        return new PDFToken(PDFTokenType.NAME, name);
    }

    /* =========================================================
       STRING (LITERAL)
    ========================================================= */

    _readLiteralString() {

        this.stream.readByte(); // (

        let str = "";
        let depth = 1;

        while (!this.stream.eof()) {

            const ch = this.stream.readByte();

            if (ch === CharCode.LPAREN) {
                depth++;
            }

            if (ch === CharCode.RPAREN) {
                depth--;
                if (depth === 0) break;
            }

            if (ch === CharCode.BACKSLASH) {
                const next = this.stream.readByte();
                str += this._escape(next);
                continue;
            }

            str += String.fromCharCode(ch);
        }

        return new PDFToken(PDFTokenType.STRING, str);
    }

    _escape(ch) {

        switch (ch) {

            case 110: return "\n";
            case 114: return "\r";
            case 116: return "\t";
            case 98:  return "\b";
            case 102: return "\f";
            default:   return String.fromCharCode(ch);
        }
    }

    /* =========================================================
       HEX STRING
    ========================================================= */

    _readHexString() {

        this.stream.readByte(); // <

        let hex = "";

        while (!this.stream.eof()) {

            const ch = this.stream.peekByte();

            if (ch === CharCode.GT) {
                this.stream.readByte();
                break;
            }

            if (isHex(ch)) {
                hex += String.fromCharCode(this.stream.readByte());
            } else {
                this.stream.readByte();
            }
        }

        return new PDFToken(PDFTokenType.HEX_STRING, hex);
    }

    /* =========================================================
       WORD / KEYWORD / OPERATOR
    ========================================================= */

    _readWord() {

        let word = "";

        while (!this.stream.eof()) {

            const ch = this.stream.peekByte();

            if (isWhiteSpace(ch) || isDelimiter(ch)) {
                break;
            }

            word += String.fromCharCode(this.stream.readByte());
        }

        // keywords
        if (PDFKeywords.has(word)) {

            return new PDFToken(
                PDFTokenType.OPERATOR,
                word
            );
        }

        return new PDFToken(
            PDFTokenType.NAME,
            word
        );
    }
}