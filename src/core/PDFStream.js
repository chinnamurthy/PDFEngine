/**
 * PDFStream.js
 *
 * Represents a decoded PDF stream.
 * Handles chained filters and exposes decoded bytes.
 *
 * ISO 32000-1 / ISO 32000-2
 */

import { FlateDecode } from "../filters/FlateDecode.js";
import { LZWDecode } from "../filters/LZWDecode.js";
import { ASCII85Decode } from "../filters/ASCII85Decode.js";
import { ASCIIHexDecode } from "../filters/ASCIIHexDecode.js";

export class PDFStream {

    constructor(dictionary = {}, data = new Uint8Array()) {

        this.dictionary = dictionary;

        this.rawData =
            data instanceof Uint8Array
                ? data
                : new Uint8Array(data);

        this.decodedData = null;
    }

    /* =========================================================
       BASIC
    ========================================================= */

    getDictionary() {
        return this.dictionary;
    }

    getRawData() {
        return this.rawData;
    }

    getLength() {

        return this.rawData.length;
    }

    /* =========================================================
       DECODE
    ========================================================= */

    decode() {

        if (this.decodedData) {
            return this.decodedData;
        }

        let data = this.rawData;

        let filters =
            this.dictionary.Filter;

        let parms =
            this.dictionary.DecodeParms;

        if (!filters) {

            this.decodedData = data;

            return data;
        }

        if (!Array.isArray(filters)) {
            filters = [filters];
        }

        if (!Array.isArray(parms)) {
            parms = filters.map(() => parms || null);
        }

        for (let i = 0; i < filters.length; i++) {

            data =
                this._decodeFilter(
                    filters[i],
                    data,
                    parms[i]
                );
        }

        this.decodedData = data;

        return data;
    }

    /* =========================================================
       FILTER DISPATCH
    ========================================================= */

    _decodeFilter(
        filter,
        data,
        decodeParms
    ) {

        const name =
            this._normalizeFilter(filter);

        switch (name) {

            case "FlateDecode":

                return FlateDecode.decode(
                    data,
                    decodeParms
                );

            case "LZWDecode":

                return LZWDecode.decode(
                    data,
                    decodeParms
                );

            case "ASCII85Decode":

                return ASCII85Decode.decode(
                    data
                );

            case "ASCIIHexDecode":

                return ASCIIHexDecode.decode(
                    data
                );

            default:

                throw new Error(
                    `Unsupported stream filter: ${name}`
                );
        }
    }

    /* =========================================================
       FILTER NAME NORMALIZATION
    ========================================================= */

    _normalizeFilter(filter) {

        if (!filter) {
            return "";
        }

        if (typeof filter === "string") {

            return filter.replace("/", "");
        }

        if (filter.name) {

            return String(filter.name)
                .replace("/", "");
        }

        return String(filter)
            .replace("/", "");
    }

    /* =========================================================
       TEXT
    ========================================================= */

    getDecodedString() {

        return new TextDecoder(
            "latin1"
        ).decode(
            this.decode()
        );
    }

    /* =========================================================
       RESET
    ========================================================= */

    clearCache() {

        this.decodedData = null;
    }

    /* =========================================================
       DEBUG
    ========================================================= */

    dump() {

        return {

            length:
                this.rawData.length,

            decodedLength:
                this.decode().length,

            filters:
                this.dictionary.Filter || null
        };
    }
}