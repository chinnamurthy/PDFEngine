/**
 * PDFParser.js
 *
 * Core recursive-descent PDF parser.
 * Builds full PDF object structures.
 */

import { PDFTokenType, PDFToken } from "./PDFToken.js";

export class PDFParser {

    constructor(lexer, streamParser = null) {

        this.lexer = lexer;
        this.streamParser = streamParser;
    }

    /* =========================================================
       ENTRY
    ========================================================= */

    parse() {

        const objects = [];

        while (!this.lexer.eof()) {

            const obj = this._parseNext();

            if (obj) {
                objects.push(obj);
            } else {
                this.lexer.advance();
            }
        }

        return objects;
    }

    /* =========================================================
       MAIN DISPATCH
    ========================================================= */

    _parseNext() {

        const token = this.lexer.peek();

        if (!token) return null;

        switch (token.type) {

            case PDFTokenType.NUMBER:

                if (this.lexer.isObjectStart()) {
                    return this._parseIndirectObject();
                }

                return this._parsePrimitive();

            case PDFTokenType.DICT_START:
                return this._parseDictionary();

            case PDFTokenType.ARRAY_START:
                return this._parseArray();

            case PDFTokenType.STRING:
            case PDFTokenType.NAME:
            case PDFTokenType.HEX_STRING:
                return this._parsePrimitive();

            default:
                return null;
        }
    }

    /* =========================================================
       INDIRECT OBJECT
    ========================================================= */

    _parseIndirectObject() {

        const objNum = this.lexer.current.value;
        this.lexer.advance();

        const gen = this.lexer.current.value;
        this.lexer.advance();

        // consume "obj"
        this.lexer.advance();

        const value = this._parseValue();

        // expect endobj
        while (!this.lexer.isEndObject() && !this.lexer.eof()) {
            this.lexer.advance();
        }

        if (this.lexer.isEndObject()) {
            this.lexer.advance();
        }

        return {
            type: "indirect",
            objectNumber: objNum,
            generation: gen,
            value
        };
    }

    /* =========================================================
       VALUES
    ========================================================= */

    _parseValue() {

        const token = this.lexer.peek();

        if (!token) return null;

        switch (token.type) {

            case PDFTokenType.NUMBER:
                return this._parseNumberOrReference();

            case PDFTokenType.STRING:
            case PDFTokenType.NAME:
            case PDFTokenType.HEX_STRING:
                return this._parsePrimitive();

            case PDFTokenType.ARRAY_START:
                return this._parseArray();

            case PDFTokenType.DICT_START:
                return this._parseDictionary();

            default:
                return null;
        }
    }

    /* =========================================================
       NUMBER / REFERENCE
    ========================================================= */

    _parseNumberOrReference() {

        const first = this.lexer.current.value;
        this.lexer.advance();

        const second = this.lexer.current.value;

        // indirect reference: 12 0 R
        if (
            this.lexer.current.type === PDFTokenType.NUMBER &&
            this.lexer.next?.type === PDFTokenType.OPERATOR &&
            this.lexer.next.value === "R"
        ) {

            const objNum = first;
            const gen = second;

            this.lexer.advance(); // gen
            this.lexer.advance(); // R

            return {
                type: "reference",
                objectNumber: objNum,
                generation: gen
            };
        }

        return first;
    }

    /* =========================================================
       PRIMITIVE
    ========================================================= */

    _parsePrimitive() {

        const token = this.lexer.peek();

        this.lexer.advance();

        switch (token.type) {

            case PDFTokenType.STRING:
                return token.value;

            case PDFTokenType.NAME:
                return "/" + token.value;

            case PDFTokenType.HEX_STRING:
                return { type: "hex", value: token.value };

            case PDFTokenType.NUMBER:
                return token.value;

            default:
                return null;
        }
    }

    /* =========================================================
       ARRAY
    ========================================================= */

    _parseArray() {

        this.lexer.advance(); // [

        const arr = [];

        while (!this.lexer.eof() &&
               !this.lexer.match(PDFTokenType.ARRAY_END)) {

            const value = this._parseValue();

            if (value !== null) {
                arr.push(value);
            } else {
                this.lexer.advance();
            }
        }

        if (this.lexer.match(PDFTokenType.ARRAY_END)) {
            this.lexer.advance();
        }

        return arr;
    }

    /* =========================================================
       DICTIONARY
    ========================================================= */

    _parseDictionary() {

        this.lexer.advance(); // <<

        const dict = {};

        while (!this.lexer.eof() &&
               !this.lexer.match(PDFTokenType.DICT_END)) {

            const keyToken = this.lexer.peek();

            if (keyToken.type !== PDFTokenType.NAME) {
                this.lexer.advance();
                continue;
            }

            const key = "/" + keyToken.value;
            this.lexer.advance();

            const value = this._parseValue();

            dict[key] = value;
        }

        if (this.lexer.match(PDFTokenType.DICT_END)) {
            this.lexer.advance();
        }

        // stream detection hook (handled later by StreamParser)
        if (this.streamParser) {

            const stream = this.streamParser.tryParseStream(dict);

            if (stream) {
                return stream;
            }
        }

        return dict;
    }
	
	tokenizeStream(raw) {
    return this.lexer.tokenizer._tokenizeStream
        ? this.lexer.tokenizer._tokenizeStream(raw)
        : this._fallbackTokenize(raw);
}
}