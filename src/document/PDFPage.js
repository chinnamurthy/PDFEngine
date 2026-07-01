/**
 * PDFPage.js
 *
 * Represents a single PDF page.
 * Connects document → content stream → operators.
 */

export class PDFPage {

    constructor(doc, pageRef) {

        this.doc = doc;
        this.pageRef = pageRef;

        this.dict = null;
        this.operators = null;
    }

    /* =========================================================
       INIT
    ========================================================= */

    load() {

        const obj =
            this.doc._resolve(this.pageRef);

        if (!obj) {
            throw new Error("Invalid page reference");
        }

        this.dict =
            obj.content?.dictionary || {};

        return this;
    }

    /* =========================================================
       CONTENT STREAMS
    ========================================================= */

    getOps() {

        if (this.operators) {
            return this.operators;
        }

        const contents =
            this.dict["/Contents"];

        if (!contents) {
            return [];
        }

        const streams =
            Array.isArray(contents)
                ? contents
                : [contents];

        const fullOps = [];

        for (const ref of streams) {

            const streamObj =
                this.doc._resolve(ref);

            if (!streamObj) continue;

            const ops =
                this._parseStream(streamObj);

            fullOps.push(...ops);
        }

        this.operators = fullOps;

        return fullOps;
    }

    /* =========================================================
       STREAM PARSING
    ========================================================= */

    _parseStream(streamObj) {

        const raw =
            streamObj.content?.stream ||
            streamObj.stream;

        if (!raw) return [];

        const tokens =
            this.doc.parser
                .tokenizeStream(raw);

        return this.doc.operatorParser.parse(tokens);
    }

    /* =========================================================
       DEBUG
    ========================================================= */

    dump() {

        return {
            hasDict: !!this.dict,
            ops: this.operators?.length || 0
        };
    }
}