/**
 * PDFXRef.js
 *
 * Handles:
 *  - Cross-reference tables
 *  - Cross-reference streams
 *  - Trailer dictionary
 *  - Indirect object resolution
 */

export class PDFXRef {

    constructor(buffer) {

        this.buffer = buffer;
        this.bytes = new Uint8Array(buffer);

        this.trailer = null;

        this.xrefTable = new Map(); // "obj_gen" → offset
        this.objects = new Map();   // cached raw objects

        this.startXRef = 0;
    }

    /* =========================================================
       INIT ENTRY
    ========================================================= */

    parse(startXRef) {

        this.startXRef = startXRef;

        const text = this._readTextFrom(startXRef, 2048);

        if (text.includes("xref")) {
            this._parseXRefTable(startXRef);
        } else {
            this._parseXRefStream(startXRef);
        }

        this._parseTrailer(text);

        return this;
    }

    /* =========================================================
       XREF TABLE PARSER
    ========================================================= */

    _parseXRefTable(offset) {

        const text =
            this._readTextFrom(offset, 65536);

        const xrefMatch =
            text.match(/xref([\s\S]*?)trailer/);

        if (!xrefMatch) {
            throw new Error("Invalid xref table");
        }

        const body = xrefMatch[1];

        const lines =
            body.split(/\r?\n/);

        let currentObj = 0;

        for (const line of lines) {

            const nums = line.trim().split(" ");

            if (nums.length === 2) {
                currentObj = Number(nums[0]);
                continue;
            }

            if (nums.length < 3) continue;

            const offset = Number(nums[0]);
            const gen = Number(nums[1]);
            const inUse = nums[2];

            if (inUse === "n") {

                const key =
                    `${currentObj}_${gen}`;

                this.xrefTable.set(key, offset);
            }

            currentObj++;
        }
    }

    /* =========================================================
       XREF STREAM PARSER (SIMPLIFIED)
    ========================================================= */

    _parseXRefStream(offset) {

        const objText =
            this._readObjectAt(offset);

        const match =
            objText.match(/<<([\s\S]*?)>>/);

        if (!match) {
            throw new Error("Invalid XRef stream");
        }

        const dict = match[1];

        const wMatch =
            dict.match(/\/W\s*\[(.*?)\]/);

        const indexMatch =
            dict.match(/\/Index\s*\[(.*?)\]/);

        const sizeMatch =
            dict.match(/\/Size\s+(\d+)/);

        if (!sizeMatch) {
            throw new Error("Invalid XRef stream (Size missing)");
        }

        const size = Number(sizeMatch[1]);

        // NOTE: simplified parser (production engines decode stream bytes)
        for (let i = 0; i < size; i++) {

            this.xrefTable.set(
                `${i}_0`,
                offset + i * 10 // placeholder mapping
            );
        }
    }

    /* =========================================================
       TRAILER PARSER
    ========================================================= */

    _parseTrailer(text) {

        const match =
            text.match(/trailer\s*<<([\s\S]*?)>>/);

        if (!match) return;

        const raw = match[1];

        this.trailer = {
            raw,
            dict: this._parseDict(raw)
        };
    }

    _parseDict(text) {

        const dict = {};

        const root =
            text.match(/\/Root\s+(\d+\s+\d+\s+R)/);

        if (root) {
            dict.Root = this._parseRef(root[1]);
        }

        return dict;
    }

    _parseRef(str) {

        const parts = str.split(" ");

        return {
            objectNumber: Number(parts[0]),
            generation: Number(parts[1]),
            type: "reference"
        };
    }

    /* =========================================================
       OBJECT ACCESS
    ========================================================= */

    getObject(objNum, gen = 0) {

        const key = `${objNum}_${gen}`;

        if (this.objects.has(key)) {
            return this.objects.get(key);
        }

        const offset =
            this.xrefTable.get(key);

        if (offset == null) {
            return null;
        }

        const obj =
            this._readObjectAt(offset);

        this.objects.set(key, obj);

        return obj;
    }

    /* =========================================================
       REFERENCE RESOLUTION
    ========================================================= */

    resolveReference(ref) {

        if (!ref) return null;

        if (typeof ref === "object" &&
            ref.type === "reference") {

            return this.getObject(
                ref.objectNumber,
                ref.generation
            );
        }

        return ref;
    }

    /* =========================================================
       RAW OBJECT READER
    ========================================================= */

    _readObjectAt(offset) {

        const text =
            this._readTextFrom(offset, 4096);

        const match =
            text.match(/(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/);

        if (!match) {
            return null;
        }

        return {
            objectNumber: Number(match[1]),
            generation: Number(match[2]),
            content: match[3].trim()
        };
    }

    /* =========================================================
       BYTE READER
    ========================================================= */

    _readTextFrom(start, length) {

        const slice =
            this.bytes.slice(start, start + length);

        return new TextDecoder("utf-8").decode(slice);
    }
}