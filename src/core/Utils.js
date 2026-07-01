/**
 * Utils.js
 *
 * Common utility functions used throughout the PDF engine.
 *
 * ISO 32000-1 / ISO 32000-2
 */

export class Utils {

    /* =========================================================
       TYPE CHECKS
    ========================================================= */

    static isNumber(value) {

        return typeof value === "number" &&
               Number.isFinite(value);
    }

    static isInteger(value) {

        return Number.isInteger(value);
    }

    static isString(value) {

        return typeof value === "string";
    }

    static isBoolean(value) {

        return typeof value === "boolean";
    }

    static isArray(value) {

        return Array.isArray(value);
    }

    static isObject(value) {

        return value !== null &&
               typeof value === "object" &&
               !Array.isArray(value);
    }

    static isUint8Array(value) {

        return value instanceof Uint8Array;
    }

    /* =========================================================
       PDF OBJECT TYPES
    ========================================================= */

    static isReference(obj) {

        return obj &&
               obj.type === "reference";
    }

    static isDictionary(obj) {

        return obj &&
               obj.type === "dictionary";
    }

    static isStream(obj) {

        return obj &&
               obj.type === "stream";
    }

    static isName(obj) {

        return obj &&
               obj.type === "name";
    }

    /* =========================================================
       CLONE
    ========================================================= */

    static clone(value) {

        if (typeof structuredClone === "function") {
            return structuredClone(value);
        }

        return JSON.parse(
            JSON.stringify(value)
        );
    }

    /* =========================================================
       ARRAY HELPERS
    ========================================================= */

    static ensureArray(value) {

        if (value == null) {
            return [];
        }

        return Array.isArray(value)
            ? value
            : [value];
    }

    static flatten(array) {

        return array.flat(Infinity);
    }

    /* =========================================================
       NUMBER PARSING
    ========================================================= */

    static toNumber(value) {

        if (typeof value === "number") {
            return value;
        }

        const n = Number(value);

        return Number.isNaN(n)
            ? 0
            : n;
    }

    /* =========================================================
       STRING
    ========================================================= */

    static bytesToString(bytes) {

        return new TextDecoder(
            "latin1"
        ).decode(bytes);
    }

    static stringToBytes(text) {

        return new TextEncoder()
            .encode(text);
    }

    static hex(value) {

        return Number(value)
            .toString(16)
            .toUpperCase();
    }

    /* =========================================================
       PDF NAME
    ========================================================= */

    static normalizeName(name) {

        if (!name) {
            return "";
        }

        return String(name)
            .replace(/^\//, "");
    }

    /* =========================================================
       REFERENCE KEY
    ========================================================= */

    static refKey(objNum, gen = 0) {

        return `${objNum}_${gen}`;
    }

    /* =========================================================
       MATRIX
    ========================================================= */

    static identityMatrix() {

        return [1, 0, 0, 1, 0, 0];
    }

    /* =========================================================
       CLAMP
    ========================================================= */

    static clamp(value, min, max) {

        return Math.min(
            Math.max(value, min),
            max
        );
    }

    /* =========================================================
       ROUND
    ========================================================= */

    static round(value, decimals = 2) {

        const factor =
            Math.pow(10, decimals);

        return Math.round(
            value * factor
        ) / factor;
    }

    /* =========================================================
       ESCAPE PDF STRING
    ========================================================= */

    static unescapePDFString(text) {

        return text

            .replace(/\\\\/g, "\\")

            .replace(/\\n/g, "\n")

            .replace(/\\r/g, "\r")

            .replace(/\\t/g, "\t")

            .replace(/\\b/g, "\b")

            .replace(/\\f/g, "\f")

            .replace(/\\\(/g, "(")

            .replace(/\\\)/g, ")");
    }

    /* =========================================================
       DEBUG
    ========================================================= */

    static dump(obj) {

        console.log(
            JSON.stringify(
                obj,
                null,
                2
            )
        );
    }
}