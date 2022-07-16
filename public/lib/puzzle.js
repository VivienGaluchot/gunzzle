"use strict";
import * as Svg from './svg.js';
import * as Maths from './maths.js';
var Direction;
(function (Direction) {
    Direction[Direction["Top"] = 0] = "Top";
    Direction[Direction["Right"] = 1] = "Right";
    Direction[Direction["Bottom"] = 2] = "Bottom";
    Direction[Direction["Left"] = 3] = "Left";
})(Direction || (Direction = {}));
/**
 *       tl   tr
 *       --- ---
 *  rt |         | lt
 *          x
 *  rb |         | lb
 *       --- ---
 *       bl   br
 */
var FragmentId;
(function (FragmentId) {
    FragmentId[FragmentId["TopLeft"] = 0] = "TopLeft";
    FragmentId[FragmentId["TopRight"] = 1] = "TopRight";
    FragmentId[FragmentId["RightTop"] = 2] = "RightTop";
    FragmentId[FragmentId["RightBottom"] = 3] = "RightBottom";
    FragmentId[FragmentId["BottomRight"] = 4] = "BottomRight";
    FragmentId[FragmentId["BottomLeft"] = 5] = "BottomLeft";
    FragmentId[FragmentId["LeftBottom"] = 6] = "LeftBottom";
    FragmentId[FragmentId["LeftTop"] = 7] = "LeftTop";
})(FragmentId || (FragmentId = {}));
function increment(matrix, maxBound) {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            matrix[row][col]++;
            if (matrix[row][col] < maxBound) {
                // not an overflow
                return false;
            }
            else {
                // overflow
                matrix[row][col] = 0;
            }
        }
    }
    // done
    return true;
}
class Solution {
    constructor(rows, cols) {
        this.matrix = [];
        this.rows = rows;
        this.cols = cols;
        let mRow = 3 * rows + 1;
        for (let i = 0; i < mRow; i++) {
            let rowLen = 0;
            if ((i % 3) == 0) {
                rowLen = 2 * cols;
            }
            else {
                rowLen = 2 * cols + 1;
            }
            this.matrix.push(new Array(rowLen).fill(0));
        }
    }
    static fromObj(obj) {
        let instance = new Solution(obj.rows, obj.cols);
        instance.matrix = obj.matrix;
        return instance;
    }
    getFragment(row, col, index) {
        const MATRIX_LOOKUP = [
            // TopLeft
            { r: 0, c: 0 },
            // TopRight
            { r: 0, c: 1 },
            // RightTop
            { r: 1, c: 1 },
            // RightBottom
            { r: 2, c: 1 },
            // BottomRight
            { r: 3, c: 1 },
            // BottomLeft
            { r: 3, c: 0 },
            // LeftBottom
            { r: 2, c: 0 },
            // LeftTop
            { r: 1, c: 0 },
        ];
        return this.matrix[MATRIX_LOOKUP[index].r + (3 * row)][MATRIX_LOOKUP[index].c + col];
    }
    isUnique() {
        // TODO
        return true;
    }
    next(fragCount) {
        return increment(this.matrix, fragCount);
    }
    render() {
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
                let a = 10 / 3;
                let b = 10 / 3 * 2;
                let txtPos = [
                    new Maths.Vector(a, 1.5),
                    new Maths.Vector(b, 1.5),
                    new Maths.Vector(9, a),
                    new Maths.Vector(9, b),
                    new Maths.Vector(b, 9.5),
                    new Maths.Vector(a, 9.5),
                    new Maths.Vector(1, b),
                    new Maths.Vector(1, a)
                ];
                for (let id = FragmentId.TopLeft; id <= FragmentId.LeftTop; id++) {
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
function* generate(rows, cols, fragCount) {
    let sol = new Solution(rows, cols);
    let isDone = false;
    let count = 0;
    while (!isDone) {
        if (sol.isUnique()) {
            yield sol;
        }
        isDone = sol.next(fragCount);
        count++;
        if (count >= 100) {
            isDone = true;
        }
    }
}
export { generate, Solution };
