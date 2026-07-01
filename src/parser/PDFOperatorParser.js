/**
 * PDFOperatorParser.js
 *
 * Converts PDF content stream tokens
 * into executable operator instructions.
 */

export class PDFOperatorParser {

    constructor() {

        this.operators = [];
        this.stack = [];
    }

    /* =========================================================
       ENTRY
    ========================================================= */

    parse(tokens) {

        this.operators = [];
        this.stack = [];

        for (let i = 0; i < tokens.length; i++) {

            const t = tokens[i];

            if (this._isOperator(t)) {

                this._emit(t);
                continue;
            }

            this.stack.push(t);
        }

        return this.operators;
    }

    /* =========================================================
       OPERATOR DETECTION
    ========================================================= */

    _isOperator(token) {

        if (!token) return false;

        if (typeof token === "string") return true;

        if (token.type === "OPERATOR") return true;

        return false;
    }

    /* =========================================================
       EMIT OPERATOR
    ========================================================= */

    _emit(op) {

        const operator =
            typeof op === "string"
                ? op
                : op.value;

        const args = this._flushStack();

        this.operators.push({
            operator,
            args
        });
    }

    /* =========================================================
       STACK FLUSH
    ========================================================= */

    _flushStack() {

        const args = [];

        for (const item of this.stack) {

            args.push(this._normalize(item));
        }

        this.stack = [];

        return args;
    }

    /* =========================================================
       VALUE NORMALIZATION
    ========================================================= */

    _normalize(item) {

        if (!item) return null;

        // PDF token object
        if (item.type) {

            switch (item.type) {

                case "NUMBER":
                    return Number(item.value);

                case "STRING":
                    return String(item.value);

                case "NAME":
                    return "/" + item.value;

                case "REFERENCE":
                    return {
                        type: "ref",
                        obj: item.value.objectNumber,
                        gen: item.value.generation
                    };

                default:
                    return item.value;
            }
        }

        return item;
    }
}