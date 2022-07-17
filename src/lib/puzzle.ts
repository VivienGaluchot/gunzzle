"use strict"

import * as Svg from './svg.js';
import * as Maths from './maths.js';

enum Direction {
    Top = 0,
    Right,
    Bottom,
    Left,
}

interface Pos {
    row: number,
    col: number
}

interface Pair {
    first: Pos,
    second: Pos
}

function matrixIncrement(matrix: number[], maxBound: number, pilots: (number | null)[]) {
    // skip first fragment as the value is selected arbitrarily
    for (let idx = 1; idx < matrix.length; idx++) {
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
        for (let pair of this.hPairs()) {
            this.pilots[this.getFragmentIndex(pair.first, Direction.Right)]
                = this.getFragmentIndex(pair.second, Direction.Left);
        }
        // V pilots
        for (let pair of this.vPairs()) {
            this.pilots[this.getFragmentIndex(pair.first, Direction.Bottom)]
                = this.getFragmentIndex(pair.second, Direction.Top);
        }
    }

    // utils

    * eachPos(): Generator<Pos> {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                yield { row: row, col: col };
            }
        }
    }

    * hPairs(): Generator<Pair> {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 1; col < this.cols; col++) {
                yield { first: { row: row, col: col - 1 }, second: { row: row, col: col } };
            }
        }
    }

    * vPairs(): Generator<Pair> {
        for (let row = 1; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                yield { first: { row: row - 1, col: col }, second: { row: row, col: col } };
            }
        }
    }

    getFragmentIndex(pos: Pos, dir: Direction): number {
        return pos.row * this.rowSize + pos.col * this.colSize + dir;
    }

    getFragment(pos: Pos, dir: Direction): number {
        return this.matrix[this.getFragmentIndex(pos, dir)];
    }

    getFragments(pos: Pos): number[] {
        let colSize = 4;
        let rowSize = this.cols * colSize;
        let idx = pos.row * rowSize + pos.col * colSize;
        return this.matrix.slice(idx, idx + 4);
    }

    // puzzle logic

    isValid(): boolean {
        // local validation
        for (let pos of this.eachPos()) {
            let frs = this.getFragments(pos);
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
        // pair validation
        for (let pair of this.hPairs()) {
            let first = this.getFragments(pair.first);
            let second = this.getFragments(pair.second);
            if (first[Direction.Top] == second[Direction.Top]) {
                return false;
            }
            if (first[Direction.Bottom] == second[Direction.Bottom]) {
                return false;
            }
        }
        for (let pair of this.vPairs()) {
            let first = this.getFragments(pair.first);
            let second = this.getFragments(pair.second);
            if (first[Direction.Right] == second[Direction.Right]) {
                return false;
            }
            if (first[Direction.Left] == second[Direction.Left]) {
                return false;
            }
        }
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
        for (let pos of this.eachPos()) {
            let piece = new Svg.Group();
            piece.domEl.classList.add("piece");
            piece.appendChild(new Svg.Rect(2, 2, 6, 6, { className: "piece-block" }));
            piece.appendChild(new Svg.Text(`${pos.row}, ${pos.col}`, 5, 5, { className: "piece-coord" }));

            let a = 5;
            let txtPos = [
                new Maths.Vector(a, 1.5),
                new Maths.Vector(9, a),
                new Maths.Vector(a, 9.5),
                new Maths.Vector(1, a)];
            for (let id = Direction.Top; id <= Direction.Left; id++) {
                let fr = this.getFragment(pos, id);
                piece.appendChild(new Svg.Text(fr.toString(), txtPos[id].x, txtPos[id].y, { className: "fragment-label" }));
            }

            piece.translation = new Maths.Vector(pos.col * 10, pos.row * 10);
            group.appendChild(piece);
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