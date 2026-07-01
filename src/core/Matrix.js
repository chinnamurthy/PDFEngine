/**
 * Matrix.js
 *
 * 3x3 affine transformation matrix for PDF graphics.
 *
 * PDF uses 6-value arrays:
 * [a, b, c, d, e, f]
 *
 * Represents:
 * | a c e |
 * | b d f |
 * | 0 0 1 |
 */

export class Matrix {

    constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {

        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
    }

    /* =========================================================
       FROM ARRAY
    ========================================================= */

    static fromArray(arr) {

        return new Matrix(
            arr?.[0] ?? 1,
            arr?.[1] ?? 0,
            arr?.[2] ?? 0,
            arr?.[3] ?? 1,
            arr?.[4] ?? 0,
            arr?.[5] ?? 0
        );
    }

    /* =========================================================
       TO ARRAY
    ========================================================= */

    toArray() {

        return [
            this.a,
            this.b,
            this.c,
            this.d,
            this.e,
            this.f
        ];
    }

    /* =========================================================
       MULTIPLY
    ========================================================= */

    multiply(m) {

        return new Matrix(

            this.a * m.a + this.c * m.b,
            this.b * m.a + this.d * m.b,

            this.a * m.c + this.c * m.d,
            this.b * m.c + this.d * m.d,

            this.a * m.e + this.c * m.f + this.e,
            this.b * m.e + this.d * m.f + this.f
        );
    }

    /* =========================================================
       APPLY TO POINT
    ========================================================= */

    transformPoint(x, y) {

        return {
            x: x * this.a + y * this.c + this.e,
            y: x * this.b + y * this.d + this.f
        };
    }

    /* =========================================================
       TRANSLATION
    ========================================================= */

    translate(tx, ty) {

        return this.multiply(
            new Matrix(1, 0, 0, 1, tx, ty)
        );
    }

    /* =========================================================
       SCALE
    ========================================================= */

    scale(sx, sy = sx) {

        return this.multiply(
            new Matrix(sx, 0, 0, sy, 0, 0)
        );
    }

    /* =========================================================
       ROTATION
    ========================================================= */

    rotate(angle) {

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return this.multiply(
            new Matrix(cos, sin, -sin, cos, 0, 0)
        );
    }

    /* =========================================================
       INVERT
    ========================================================= */

    invert() {

        const det =
            this.a * this.d - this.b * this.c;

        if (!det) {
            throw new Error("Non-invertible matrix");
        }

        const invDet = 1 / det;

        return new Matrix(

            this.d * invDet,
            -this.b * invDet,
            -this.c * invDet,
            this.a * invDet,

            (this.c * this.f - this.d * this.e) * invDet,
            (this.b * this.e - this.a * this.f) * invDet
        );
    }

    /* =========================================================
       CANVAS APPLY
    ========================================================= */

    applyToCanvas(ctx) {

        ctx.setTransform(
            this.a,
            this.b,
            this.c,
            this.d,
            this.e,
            this.f
        );
    }

    /* =========================================================
       IDENTITY
    ========================================================= */

    static identity() {
        return new Matrix();
    }

    /* =========================================================
       DEBUG
    ========================================================= */

    toString() {

        return `Matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
    }
}