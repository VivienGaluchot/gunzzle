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
function matrixIncrement(matrix, maxBound) {
    for (let idx = 0; idx < matrix.length; idx++) {
        if (matrix[idx] == -1) {
            matrix[idx] = 1;
        }
        else {
            matrix[idx]++;
        }
        if (matrix[idx] < maxBound) {
            // not an overflow
            return false;
        }
        else {
            // overflow
            matrix[idx] = -1 * maxBound;
        }
    }
    // done
    return true;
}
function* swappable(rows, cols) {
    // TODO make generic, output direction ?
    // return directly fragments with orientation normalized ?
    yield [[0, 0], [0, 1]];
    yield [[0, 0], [1, 0]];
    yield [[1, 1], [0, 1]];
    yield [[1, 1], [1, 0]];
}
class Solution {
    constructor(rows, cols, maxBound) {
        this.maxBound = maxBound;
        this.rows = rows;
        this.cols = cols;
        let len = 4 * rows * cols;
        this.matrix = new Array(len).fill(-1 * maxBound);
    }
    static fromObj(obj) {
        let instance = new Solution(obj.rows, obj.cols, obj.maxBound);
        instance.matrix = obj.matrix;
        return instance;
    }
    getFragment(row, col, index) {
        let colSize = 4;
        let rowSize = this.cols * colSize;
        return this.matrix[row * rowSize + col * colSize + index];
    }
    getFragments(row, col) {
        let colSize = 4;
        let rowSize = this.cols * colSize;
        let idx = row * rowSize + col * colSize;
        return this.matrix.slice(idx, idx + 4);
    }
    isValid() {
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
        // H match check
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols - 1; col++) {
                if (this.getFragment(row, col, Direction.Right)
                    != -1 * this.getFragment(row, col + 1, Direction.Left)) {
                    return false;
                }
            }
        }
        // V match check
        for (let row = 0; row < this.rows - 1; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.getFragment(row, col, Direction.Bottom)
                    != -1 * this.getFragment(row + 1, col, Direction.Top)) {
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
    next() {
        return matrixIncrement(this.matrix, this.maxBound);
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
                let a = 5;
                let txtPos = [
                    new Maths.Vector(a, 1.5),
                    new Maths.Vector(9, a),
                    new Maths.Vector(a, 9.5),
                    new Maths.Vector(1, a)
                ];
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
function* generate(rows, cols, maxBound) {
    let sol = new Solution(rows, cols, maxBound);
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
export { generate, Solution };
