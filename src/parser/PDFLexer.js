/**
 * PDFLexer.js
 *
 * Converts raw tokens → structured token stream.
 * Adds lookahead + normalization for parser stage.
 */

import { PDFTokenType, PDFToken } from "./PDFToken.js";

export class PDFLexer {

    constructor(tokenizer) {

        this.tokenizer = tokenizer;

        this.current = null;
        this.next = null;

        this._init();
    }

    /* =========================================================
       INIT
    ========================================================= */

    _init() {
        this.current = this.tokenizer.getNextToken();
        this.next = this.tokenizer.getNextToken();
    }

    /* =========================================================
       ADVANCE
    ========================================================= */

    advance() {

        this.current = this.next;
        this.next = this.tokenizer.getNextToken();

        return this.current;
    }

    peek() {
        return this.current;
    }

    peekNext() {
        return this.next;
    }

    eof() {
        return this.current?.type === PDFTokenType.EOF;
    }

    /* =========================================================
       HIGH LEVEL HELPERS
    ========================================================= */

    is(type) {
        return this.current?.type === type;
    }

    match(type, value = null) {

        if (!this.current) return false;

        if (this.current.type !== type) {
            return false;
        }

        if (value !== null &&
            this.current.value !== value) {
            return false;
        }

        return true;
    }

    consume(type, value = null) {

        if (!this.match(type, value)) {
            return false;
        }

        this.advance();
        return true;
    }

    /* =========================================================
       INDIRECT REFERENCE DETECTION
    ========================================================= */

    isReferencePattern() {

        return (
            this.current?.type === PDFTokenType.NUMBER &&
            this.next?.type === PDFTokenType.NUMBER &&
            this._peekAheadIsR()
        );
    }

    _peekAheadIsR() {

        const t3 = this.tokenizer.getNextToken();

        // restore naive lookahead (safe approach)
        // NOTE: in full engine this is replaced by buffered stream
        return t3?.value === "R";
    }

    /* =========================================================
       READ REFERENCE
    ========================================================= */

    readReference() {

        const objNum = this.current.value;
        this.advance();

        const gen = this.current.value;
        this.advance();

        // consume R
        this.advance();

        return new PDFToken(
            PDFTokenType.REFERENCE,
            {
                objectNumber: objNum,
                generation: gen
            }
        );
    }

    /* =========================================================
       OBJECT BLOCK HELPERS
    ========================================================= */

    isObjectStart() {
        return (
            this.current?.type === PDFTokenType.NUMBER &&
            this.next?.type === PDFTokenType.NUMBER
        );
    }

    isEndObject() {
        return this.match(PDFTokenType.OPERATOR, "endobj");
    }

    isStreamStart() {
        return this.match(PDFTokenType.OPERATOR, "stream");
    }

    isStreamEnd() {
        return this.match(PDFTokenType.OPERATOR, "endstream");
    }

    /* =========================================================
       DEBUG
    ========================================================= */

    dumpState() {

        return {
            current: this.current,
            next: this.next
        };
    }
}