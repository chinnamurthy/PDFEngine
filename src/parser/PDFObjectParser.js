/**
 * PDFObjectParser.js
 *
 * Normalizes raw parser output into stable PDF objects.
 * Bridge between Parser → Document layer.
 */

export class PDFObjectParser {

    constructor() {}

    /* =========================================================
       MAIN ENTRY
    ========================================================= */

    parseObject(raw) {

        if (!raw) return null;

        // INDIRECT OBJECT
        if (raw.type === "indirect") {

            return {
                objectNumber: raw.objectNumber,
                generation: raw.generation,

                type: this._detectType(raw.value),

                content: this._normalize(raw.value)
            };
        }

        // DIRECT VALUE
        return {
            objectNumber: null,
            generation: null,

            type: this._detectType(raw),

            content: this._normalize(raw)
        };
    }

    /* =========================================================
       TYPE DETECTION
    ========================================================= */

    _detectType(value) {

        if (!value) return "null";

        if (Array.isArray(value)) {
            return "array";
        }

        if (typeof value === "object") {

            if (value.stream) return "stream";

            if (this._isDictionary(value)) return "dictionary";
        }

        if (typeof value === "number") return "number";

        if (typeof value === "string") return "string";

        return typeof value;
    }

    /* =========================================================
       DICTIONARY CHECK
    ========================================================= */

    _isDictionary(obj) {

        return obj && typeof obj === "object" && !Array.isArray(obj);
    }

    /* =========================================================
       NORMALIZATION
    ========================================================= */

    _normalize(value) {

        if (value == null) return null;

        if (Array.isArray(value)) {

            return value.map(v => this._normalize(v));
        }

        if (typeof value === "object") {

            // stream object
            if (value.stream) {

                return {
                    dictionary: value.dictionary || value,
                    stream: value.stream
                };
            }

            // reference object
            if (value.type === "reference") {

                return {
                    type: "reference",
                    objectNumber: value.objectNumber,
                    generation: value.generation
                };
            }

            // dictionary
            const dict = {};

            for (const key in value) {
                dict[key] = this._normalize(value[key]);
            }

            return {
                dictionary: dict
            };
        }

        return value;
    }

    /* =========================================================
       STREAM DETECTION HELPERS
    ========================================================= */

    isStreamObject(obj) {

        return obj &&
               obj.dictionary &&
               obj.stream;
    }

    isDictionaryObject(obj) {

        return obj &&
               obj.dictionary &&
               !obj.stream;
    }

    isReference(obj) {

        return obj &&
               obj.type === "reference";
    }
}