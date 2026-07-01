/**
 * ByteStream.js
 *
 * Stream wrapper around BinaryReader.
 * Similar in role to PDF.js BaseStream.
 */

import { BinaryReader } from "./BinaryReader.js";

export class ByteStream {

    constructor(source) {

        if (source instanceof BinaryReader) {

            this.reader = source;

        } else if (source instanceof ArrayBuffer) {

            this.reader = new BinaryReader(source);

        } else {

            throw new Error(
                "ByteStream requires BinaryReader or ArrayBuffer."
            );
        }
    }

    /* =========================================================
       POSITION
    ========================================================= */

    get position() {
        return this.reader.getPosition();
    }

    set position(value) {
        this.reader.setPosition(value);
    }

    get length() {
        return this.reader.length;
    }

    eof() {
        return this.reader.eof();
    }

    remaining() {
        return this.reader.remaining();
    }

    /* =========================================================
       BYTE ACCESS
    ========================================================= */

    peekByte(offset = 0) {
        return this.reader.peekByte(offset);
    }

    readByte() {
        return this.reader.readByte();
    }

    readBytes(count) {
        return this.reader.readBytes(count);
    }

    unread(count = 1) {
        this.reader.rewind(count);
    }

    skip(count = 1) {
        this.reader.skip(count);
    }

    /* =========================================================
       LINE READING
    ========================================================= */

    readLine() {

        const bytes = [];

        while (!this.eof()) {

            const ch = this.readByte();

            if (ch === 0x0A) {
                break;
            }

            if (ch === 0x0D) {

                if (this.peekByte() === 0x0A) {
                    this.readByte();
                }

                break;
            }

            bytes.push(ch);
        }

        return new TextDecoder("latin1")
            .decode(new Uint8Array(bytes));
    }

    /* =========================================================
       WHITESPACE
    ========================================================= */

    skipWhiteSpace() {

        while (!this.eof()) {

            const b = this.peekByte();

            switch (b) {

                case 0x00:
                case 0x09:
                case 0x0A:
                case 0x0C:
                case 0x0D:
                case 0x20:

                    this.readByte();
                    break;

                default:
                    return;
            }
        }
    }

    /* =========================================================
       COMMENTS
    ========================================================= */

    skipComment() {

        if (this.peekByte() !== 0x25) {
            return;
        }

        while (!this.eof()) {

            const b = this.readByte();

            if (b === 0x0A || b === 0x0D) {
                break;
            }
        }
    }

    /* =========================================================
       PDF TOKEN HELPERS
    ========================================================= */

    readUntil(pattern) {

        const encoder = new TextEncoder();
        const bytes = encoder.encode(pattern);

        const out = [];

        while (!this.eof()) {

            if (this._match(bytes)) {
                break;
            }

            out.push(this.readByte());
        }

        return new TextDecoder("latin1")
            .decode(new Uint8Array(out));
    }

    _match(pattern) {

        for (let i = 0; i < pattern.length; i++) {

            if (this.peekByte(i) !== pattern[i]) {
                return false;
            }
        }

        return true;
    }

    /* =========================================================
       SEARCH
    ========================================================= */

    findString(text) {

        return this.reader.findString(
            text,
            this.position
        );
    }

    /* =========================================================
       SAVE / RESTORE
    ========================================================= */

    save() {
        return this.position;
    }

    restore(position) {
        this.position = position;
    }
}