"use strict"

import * as Svg from './svg.js';
import * as Maths from './maths.js';

enum Direction {
    Top = 0,
    Right,
    Bottom,
    Left,
}

/**
 *       tl   tr
 *       --- ---
 *  rt |         | lt
 *          x
 *  rb |         | lb
 *       --- ---
 *       bl   br
 */
enum FragmentPosition {
    TopLeft = 0,
    TopRight,
    RightTop,
    RightBottom,
    BottomRight,
    BottomLeft,
    LeftBottom,
    LeftTop,
}

type Fragment = number;
type FragmentArray = {
    [D in FragmentPosition]: Fragment;
}

class Piece {
    fragments: FragmentArray;

    constructor() {
        this.fragments = [0, 0, 0, 0, 0, 0, 0, 0];
    }

    clone(): Piece {
        let copy = new Piece();
        for (let id = FragmentPosition.TopLeft; id <= FragmentPosition.LeftTop; id++) {
            copy.fragments[id] = this.fragments[id];
        }
        return copy;
    }

    render(): Svg.SvgNode {
        let group = new Svg.Group();
        group.domEl.classList.add("piece");
        group.appendChild(new Svg.Rect(2, 2, 6, 6, { className: "piece-block" }));

        let a = 10 / 3;
        let b = 10 / 3 * 2
        let txtPos = [
            new Maths.Vector(a, 1.5),
            new Maths.Vector(b, 1.5),
            new Maths.Vector(9, a),
            new Maths.Vector(9, b),
            new Maths.Vector(a, 9.5),
            new Maths.Vector(b, 9.5),
            new Maths.Vector(1, a),
            new Maths.Vector(1, b)];
        for (let id = FragmentPosition.TopLeft; id <= FragmentPosition.LeftTop; id++) {
            let fr = this.fragments[id];
            let pos = txtPos[id];
            group.appendChild(new Svg.Text(fr.toString(), pos.x, pos.y, { className: "fragment-label" }));
        }
        return group;
    }

    isFitting(other: Piece, dir: Direction): boolean {
        if (dir == Direction.Bottom) {
            return this.fragments[FragmentPosition.BottomLeft] == other.fragments[FragmentPosition.TopLeft]
                && this.fragments[FragmentPosition.BottomRight] == other.fragments[FragmentPosition.TopRight];
        } else if (dir == Direction.Right) {
            return this.fragments[FragmentPosition.RightTop] == other.fragments[FragmentPosition.LeftTop]
                && this.fragments[FragmentPosition.RightBottom] == other.fragments[FragmentPosition.LeftBottom];
        } else {
            throw new Error("not implemented");
        }
    }

    next(fragCount: number): boolean {
        for (let id = FragmentPosition.TopLeft; id <= FragmentPosition.LeftTop; id++) {
            this.fragments[id]++;
            if (this.fragments[id] < fragCount) {
                // not an overflow
                return false;
            } else {
                // overflow
                this.fragments[id] = 0;
            }
        }
        return true;
    }
}

class Solution {
    pieces: Piece[][];
    rows: number;
    cols: number;

    constructor(rows: number, cols: number) {
        this.pieces = [];
        this.rows = rows;
        this.cols = cols;
        for (let r = 0; r < rows; r++) {
            let row = [];
            for (let c = 0; c < cols; c++) {
                row.push(new Piece());
            }
            this.pieces.push(row);
        }
    }

    isValid() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (r < (this.rows - 1)) {
                    let a = this.pieces[r][c];
                    let b = this.pieces[r + 1][c];
                    if (!a.isFitting(b, Direction.Right)) {
                        return false;
                    }
                }
                if (c < (this.cols - 1)) {
                    let a = this.pieces[r][c];
                    let b = this.pieces[r][c + 1];
                    if (!a.isFitting(b, Direction.Bottom)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    isUnique(): boolean {
        // TODO
        return true;
    }

    * allPieces() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                yield this.pieces[r][c];
            }
        }
    }

    next(fragCount: number): boolean {
        for (let piece of this.allPieces()) {
            let isOverflow = piece.next(fragCount);
            if (!isOverflow) {
                return false;
            }
        }
        return true;
    }

    clone(): Solution {
        let sol = new Solution(this.rows, this.cols);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                sol.pieces[r][c] = this.pieces[r][c].clone();
            }
        }
        return sol;
    }

    render(): Element {
        let frame = new Svg.SvgFrame();
        frame.domEl.classList.add("puzzle-solution");
        let group = new Svg.Group();
        frame.appendChild(group);

        frame.safeView = new Maths.Rect(new Maths.Vector(0, 0), new Maths.Vector(this.rows * 10, this.cols * 10));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let piece = this.pieces[r][c].render();
                piece.translation = new Maths.Vector(r * 10, c * 10);
                group.appendChild(piece);
                group.appendChild(new Svg.Text(`${r}, ${c}`, r * 10 + 5, c * 10 + 5, { className: "piece-coord" }));
            }
        }
        return frame.domEl;
    }
}

async function generate(rows: number, cols: number, fragCount: number): Promise<Solution[]> {
    // TODO run in workers
    // show solution when found
    // enable to stop execution
    let solutions = [];
    let sol: Solution | null = new Solution(rows, cols);
    let isDone = false;
    while (!isDone) {
        if (sol.isValid() && sol.isUnique()) {
            solutions.push(sol.clone());
        }
        isDone = sol.next(fragCount);
    }
    return solutions;
}

export { generate }