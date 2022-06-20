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

    render(): Svg.SvgNode {
        let group = new Svg.Group();
        let boxStyle = { fill: "transparent", stroke: "#FFF8", strokeW: ".1" };
        group.appendChild(new Svg.Rect(1, 1, 8, 8, boxStyle));
        let lineStyle = { stroke: "#FFF8", strokeW: ".1" };
        group.appendChild(new Svg.Line(5, 4, 5, 6, lineStyle));
        group.appendChild(new Svg.Line(4, 5, 6, 5, lineStyle));
        let txtStyle = { fill: "#FFF8", fontSize: "1" };
        group.appendChild(new Svg.Text("a", 3, 3, txtStyle));
        return group;
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
                let piece = this.pieces[r][c].render();
                piece.translation = new Maths.Vector(r * 10, c * 10);
                group.appendChild(piece);
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