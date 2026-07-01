/**
 * BinaryReader.js
 *
 * Low-level binary reader for PDF files.
 * Similar in purpose to PDF.js Stream classes.
 */

export class BinaryReader {

    constructor(buffer) {

        if (!(buffer instanceof ArrayBuffer)) {
            throw new Error("BinaryReader requires an ArrayBuffer.");
        }

        this.buffer = buffer;
        this.bytes = new Uint8Array(buffer);

        this.position = 0;
        this.length = this.bytes.length;
    }

    /* =========================================================
       POSITION
    ========================================================= */

    getPosition() {
        return this.position;
    }

    setPosition(position) {

        if (position < 0 || position > this.length) {
            throw new RangeError("Position out of range.");
        }

        this.position = position;
    }

    skip(count = 1) {
        this.setPosition(this.position + count);
    }

    rewind(count = 1) {
        this.setPosition(this.position - count);
    }

    eof() {
        return this.position >= this.length;
    }

    remaining() {
        return this.length - this.position;
    }

    /* =========================================================
       BYTE ACCESS
    ========================================================= */

    peekByte(offset = 0) {

        const index = this.position + offset;

        if (index >= this.length) {
            return -1;
        }

        return this.bytes[index];
    }

    readByte() {

        if (this.eof()) {
            return -1;
        }

        return this.bytes[this.position++];
    }

    readBytes(count) {

        if (count <= 0) {
            return new Uint8Array();
        }

        const end = Math.min(
            this.position + count,
            this.length
        );

        const slice =
            this.bytes.slice(
                this.position,
                end
            );

        this.position = end;

        return slice;
    }

    /* =========================================================
       SEARCH
    ========================================================= */

    findByte(value, start = this.position) {

        for (let i = start; i < this.length; i++) {

            if (this.bytes[i] === value) {
                return i;
            }
        }

        return -1;
    }

    findString(text, start = this.position) {

        const pattern =
            new TextEncoder().encode(text);

        outer:

        for (let i = start; i <= this.length - pattern.length; i++) {

            for (let j = 0; j < pattern.length; j++) {

                if (this.bytes[i + j] !== pattern[j]) {
                    continue outer;
                }
            }

            return i;
        }

        return -1;
    }

    /* =========================================================
       SLICES
    ========================================================= */

    slice(start, end) {

        return this.bytes.slice(start, end);
    }

    sliceBuffer(start, end) {

        return this.buffer.slice(start, end);
    }

    /* =========================================================
       TEXT
    ========================================================= */

    readString(length) {

        const bytes =
            this.readBytes(length);

        return new TextDecoder(
            "latin1"
        ).decode(bytes);
    }

    readRemainingAsString() {

        return this.readString(
            this.remaining()
        );
    }

    /* =========================================================
       DEBUG
    ========================================================= */

    dump(start = 0, length = 64) {

        return Array.from(
            this.bytes.slice(
                start,
                start + length
            )
        )
        .map(v => v.toString(16).padStart(2, "0"))
        .join(" ");
    }
}