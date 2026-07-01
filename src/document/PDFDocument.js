/**
 * PDFDocument.js
 *
 * High-level document interface (PDF.js-like).
 * Connects parser + xref + object system + pages.
 */

export class PDFDocument {

    constructor(buffer, loader, parser, objectParser) {

        if (!buffer) {
            throw new Error("PDFDocument requires buffer");
        }

        this.buffer = buffer;

        this.loader = loader;               // XRef / raw access
        this.parser = parser;               // PDFParser
        this.objectParser = objectParser;   // PDFObjectParser

        this.objects = new Map();

        this.catalog = null;
        this.pageTree = null;
        this.pageList = [];
    }

    /* =========================================================
       LOAD ENTRY
    ========================================================= */

    load() {

        if (!this.loader) {
            throw new Error("Missing loader (XRef layer)");
        }

        this._loadCatalog();
        this._buildPages();

        return this;
    }

    /* =========================================================
       OBJECT RESOLUTION
    ========================================================= */

    getObject(objNum, gen = 0) {

        const key = `${objNum}_${gen}`;

        if (this.objects.has(key)) {
            return this.objects.get(key);
        }

        const raw =
            this.loader.getObject(objNum, gen);

        if (!raw) return null;

        const parsed =
            this.objectParser.parseObject(raw);

        this.objects.set(key, parsed);

        return parsed;
    }

    /* =========================================================
       CATALOG
    ========================================================= */

    _loadCatalog() {

        const trailer = this.loader.trailer;

        if (!trailer) {
            throw new Error("Missing trailer");
        }

        const rootRef =
            this._extractRoot(trailer.raw);

        if (!rootRef) {
            throw new Error("Missing /Root reference");
        }

        const catalogRaw =
            this.loader.resolveReference(rootRef);

        if (!catalogRaw) {
            throw new Error("Cannot resolve catalog");
        }

        this.catalog =
            this.objectParser.parseObject(catalogRaw);
    }

    _extractRoot(text) {

        const match =
            text.match(/\/Root\s+(\d+\s+\d+\s+R)/);

        return match ? match[1] : null;
    }

    /* =========================================================
       PAGE TREE
    ========================================================= */

    _buildPages() {

        if (!this.catalog) {
            throw new Error("Missing catalog");
        }

        const pagesRef =
            this.catalog.content?.dictionary?.Pages;

        if (!pagesRef) {
            throw new Error("Missing /Pages reference");
        }

        const root =
            this._resolve(pagesRef);

        this._walkPages(root);
    }

    _walkPages(node) {

        if (!node) return;

        const dict =
            node.content?.dictionary || {};

        const type =
            dict.Type;

        // --------------------------
        // PAGE NODE
        // --------------------------
        if (type === "/Page") {

            this.pageList.push(node);
            return;
        }

        // --------------------------
        // PAGES NODE
        // --------------------------
        let kids = dict.Kids || dict["Kids"];

        if (!kids) return;

        if (!Array.isArray(kids)) {
            kids = [kids];
        }

        for (const kid of kids) {

            const resolved =
                this._resolve(kid);

            if (!resolved) continue;

            const parsed =
                resolved.content
                    ? resolved
                    : this.objectParser.parseObject(resolved);

            this._walkPages(parsed);
        }
    }

    /* =========================================================
       RESOLVE REFERENCES
    ========================================================= */

    _resolve(ref) {

        if (!ref) return null;

        if (ref.type === "reference") {

            return this.getObject(
                ref.objectNumber,
                ref.generation
            );
        }

        return ref;
    }

    /* =========================================================
       PAGE API
    ========================================================= */

    getPageCount() {
        return this.pageList.length;
    }

    getPage(index) {
        return this.pageList[index - 1] || null;
    }

    /* =========================================================
       DEBUG
    ========================================================= */

    dump() {

        return {
            pages: this.pageList.length,
            objects: this.objects.size,
            hasCatalog: !!this.catalog
        };
    }
}