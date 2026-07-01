/**
 * PDFRenderingEngine.js
 *
 * Executes PDF content stream operators
 * and renders onto Canvas 2D context.
 */

export class PDFRenderingEngine {

    constructor(document) {

        this.doc = document;

        this.ctx = null;

        this.stateStack = [];
        this.state = this._createState();
    }

    /* =========================================================
       PUBLIC API
    ========================================================= */

    renderPage(pageIndex, ctx) {

        this.ctx = ctx;

        const page =
            this.doc.getPage(pageIndex);

        if (!page) {
            throw new Error("Invalid page index");
        }

        const ops =
            this._getOperators(page);

        this._resetState();

        for (const op of ops) {
            this._execute(op);
        }
    }

    /* =========================================================
       OPERATORS ENTRY
    ========================================================= */

    _getOperators(page) {

        if (typeof page.getOps === "function") {
            return page.getOps();
        }

        if (page.ops) {
            return page.ops;
        }

        return [];
    }

    /* =========================================================
       EXECUTOR
    ========================================================= */

    _execute(op) {

        const fn = op.operator;
        const args = op.args || [];

        switch (fn) {

            /* -------------------------
               PATH OPERATORS
            ------------------------- */

            case "m":
                this._moveTo(args);
                break;

            case "l":
                this._lineTo(args);
                break;

            case "re":
                this._rect(args);
                break;

            case "h":
                this._closePath();
                break;

            case "S":
                this._stroke();
                break;

            case "f":
            case "f*":
                this._fill();
                break;

            /* -------------------------
               TEXT OPERATORS
            ------------------------- */

            case "BT":
                this._beginText();
                break;

            case "ET":
                this._endText();
                break;

            case "Tf":
                this._setFont(args);
                break;

            case "Tj":
                this._showText(args);
                break;

            case "Td":
                this._moveText(args);
                break;

            case "Tm":
                this._setTextMatrix(args);
                break;

            /* -------------------------
               GRAPHICS STATE
            ------------------------- */

            case "q":
                this._save();
                break;

            case "Q":
                this._restore();
                break;

            case "w":
                this.ctx.lineWidth = args[0];
                break;

            case "RG":
                this.ctx.strokeStyle =
                    `rgb(${args[0]*255},${args[1]*255},${args[2]*255})`;
                break;

            case "rg":
                this.ctx.fillStyle =
                    `rgb(${args[0]*255},${args[1]*255},${args[2]*255})`;
                break;

            default:
                // ignore unsupported ops
                break;
        }
    }

    /* =========================================================
       PATH OPERATIONS
    ========================================================= */

    _moveTo(args) {
        this.ctx.beginPath();
        this.ctx.moveTo(args[0], args[1]);
    }

    _lineTo(args) {
        this.ctx.lineTo(args[0], args[1]);
    }

    _rect(args) {
        this.ctx.rect(args[0], args[1], args[2], args[3]);
    }

    _closePath() {
        this.ctx.closePath();
    }

    _stroke() {
        this.ctx.stroke();
    }

    _fill() {
        this.ctx.fill();
    }

    /* =========================================================
       TEXT OPERATIONS
    ========================================================= */

    _beginText() {
        this.state.text = {
            x: 0,
            y: 0
        };
    }

    _endText() {
        this.state.text = null;
    }

    _setFont(args) {

        const fontName = args[0];
        const size = args[1];

        this.ctx.font = `${size}px ${fontName.replace("/", "")}`;
    }

    _showText(args) {

        const text = args[0];

        if (this.state.text) {

            this.ctx.fillText(
                text,
                this.state.text.x,
                this.state.text.y
            );

            this.state.text.x += 10;
        }
    }

    _moveText(args) {

        if (!this.state.text) return;

        this.state.text.x += args[0];
        this.state.text.y += args[1];
    }

    _setTextMatrix(args) {

        if (!this.state.text) return;

        this.state.text.x = args[4];
        this.state.text.y = args[5];
    }

    /* =========================================================
       GRAPHICS STATE
    ========================================================= */

    _save() {
        this.ctx.save();
        this.stateStack.push({ ...this.state });
    }

    _restore() {
        this.ctx.restore();
        this.state = this.stateStack.pop() || this._createState();
    }

    _resetState() {
        this.stateStack = [];
        this.state = this._createState();

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    _createState() {

        return {
            text: null
        };
    }
}