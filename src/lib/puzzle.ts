"use strict"

import * as Svg from './svg.js';
import * as Maths from './maths.js';

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

    render(): Element {
        let frame = new Svg.SvgFrame();
        frame.domEl.classList.add("puzzle-solution");
        let group = new Svg.Group();
        frame.appendChild(group);

        frame.safeView = new Maths.Rect(new Maths.Vector(0, 0), new Maths.Vector(this.rows * 10, this.cols * 10));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let p = this.pieces[r][c];
                let rect = new Svg.Rect(10 * r + 1, 10 * c + 1, 8, 8, { fill: "transparent", stroke: "#FFF8", strokeW: ".1" });
                group.appendChild(rect);
            }
        }
        return frame.domEl;
    }
}

async function generate(rows: number, cols: number, fragments: number): Promise<Solution[]> {
    await new Promise(r => setTimeout(r, 500));
    return [new Solution(rows, cols), new Solution(rows, cols), new Solution(rows, cols)];
}

export { generate }