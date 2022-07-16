"use strict"

import * as Svg from './svg.js';
import * as Maths from './maths.js';
import { isDoStatement } from '../../node_modules/typescript/lib/typescript.js';

enum Direction {
    Top = 0,
    Right,
    Bottom,
    Left,
}

function matrixIncrement(matrix: number[], maxBound: number, pilots: (number | null)[]) {
    for (let idx = 0; idx < matrix.length; idx++) {
        if (pilots[idx] == null) {
            // non piloted fragment
            if (matrix[idx] == -1) {
                matrix[idx] = 1;
            } else {
                matrix[idx]++;
            }
            if (matrix[idx] < maxBound) {
                // not an overflow
                return false;
            } else {
                // overflow
                matrix[idx] = -1 * maxBound;
            }
        }
    }
    // done
    return true;
}

function* swappable(rows: number, cols: number) {
    // TODO make generic, output direction ?
    // return directly fragments with orientation normalized ?
    yield [[0, 0], [0, 1]];
    yield [[0, 0], [1, 0]];
    yield [[1, 1], [0, 1]];
    yield [[1, 1], [1, 0]];
}

class Solution {
    maxBound: number;
    rows: number;
    cols: number;
    matrix: number[];

    private colSize: number;
    private rowSize: number;
    private pilots: (number | null)[];

    static fromObj(obj: any) {
        let instance = new Solution(obj.rows, obj.cols, obj.maxBound);
        instance.matrix = obj.matrix;
        return instance;
    }

    constructor(rows: number, cols: number, maxBound: number) {
        this.maxBound = maxBound;
        this.rows = rows;
        this.cols = cols;

        this.colSize = 4;
        this.rowSize = this.cols * this.colSize;

        let len = this.rowSize * rows;
        this.matrix = new Array(len).fill(-1 * maxBound);
        this.pilots = new Array(len).fill(null);
        // H pilots
        for (let row = 0; row < this.rows; row++) {
            for (let col = 1; col < this.cols; col++) {
                this.pilots[row * this.rowSize + col * this.colSize + Direction.Left]
                    = row * this.rowSize + (col - 1) * this.colSize + Direction.Right;
            }
        }
        // V pilots
        for (let row = 1; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.pilots[row * this.rowSize + col * this.colSize + Direction.Top]
                    = (row - 1) * this.rowSize + col * this.colSize + Direction.Bottom;
            }
        }
        console.log(this.pilots);
    }

    getFragment(row: number, col: number, index: Direction) {
        return this.matrix[row * this.rowSize + col * this.colSize + index];
    }

    getFragments(row: number, col: number) {
        let colSize = 4;
        let rowSize = this.cols * colSize;
        let idx = row * rowSize + col * colSize;
        return this.matrix.slice(idx, idx + 4);
    }

    isValid(): boolean {
        // local validation
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                let frs = this.getFragments(row, col);
                if (frs[Direction.Top] == frs[Direction.Bottom]) {
                    return false;
                }
                if (frs[Direction.Left] == frs[Direction.Right]) {
                    return false;
                }
                if (frs[Direction.Bottom] == frs[Direction.Right]
                    && frs[Direction.Left] == frs[Direction.Top]) {
                    return false;
                }
                if (frs[Direction.Bottom] == frs[Direction.Left]
                    && frs[Direction.Right] == frs[Direction.Top]) {
                    return false;
                }
            }
        }
        // TODO pair validation
        // for (let pairs of swappable(this.rows, this.cols)) {
        //     let aRow = pairs[0][0];
        //     let aCol = pairs[0][1];
        //     let bRow = pairs[1][0];
        //     let bCol = pairs[1][1];
        // }
        return true;
    }

    next(): boolean {
        let isDone = matrixIncrement(this.matrix, this.maxBound, this.pilots);
        for (let idx = 0; idx < this.matrix.length; idx++) {
            let ref = this.pilots[idx];
            if (ref != null) {
                this.matrix[idx] = -1 * this.matrix[ref];
            }
        };
        return isDone;
    }

    render(): Element {
        let frame = new Svg.SvgFrame();
        frame.domEl.classList.add("puzzle-solution");
        let group = new Svg.Group();
        frame.appendChild(group);

        frame.safeView = new Maths.Rect(new Maths.Vector(0, 0), new Maths.Vector(this.cols * 10, this.rows * 10));
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                let piece = new Svg.Group();
                piece.domEl.classList.add("piece");
                piece.appendChild(new Svg.Rect(2, 2, 6, 6, { className: "piece-block" }));
                piece.appendChild(new Svg.Text(`${row}, ${col}`, 5, 5, { className: "piece-coord" }));

                let a = 5;
                let txtPos = [
                    new Maths.Vector(a, 1.5),
                    new Maths.Vector(9, a),
                    new Maths.Vector(a, 9.5),
                    new Maths.Vector(1, a)];
                for (let id = Direction.Top; id <= Direction.Left; id++) {
                    let fr = this.getFragment(row, col, id);
                    let pos = txtPos[id];
                    piece.appendChild(new Svg.Text(fr.toString(), pos.x, pos.y, { className: "fragment-label" }));
                }

                piece.translation = new Maths.Vector(col * 10, row * 10);
                group.appendChild(piece);
            }
        }
        return frame.domEl;
    }
}

function* generate(rows: number, cols: number, maxBound: number) {
    let sol: Solution | null = new Solution(rows, cols, maxBound);
    let isDone = false;
    let count = 0;
    while (!isDone) {
        if (sol.isValid()) {
            yield sol;
            count++;
        }
        isDone = sol.next();
        if (count >= 100) {
            isDone = true;
        }
    }
}

export { generate, Solution }