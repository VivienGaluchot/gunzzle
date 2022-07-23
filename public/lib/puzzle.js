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
const DIRECTION_COUNT = 4;
function matrixIncrement(matrix, maxBound) {
    // skip first fragment as the value is selected arbitrarily
    for (let idx = 1; idx < matrix.length; idx++) {
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
function* permutations(values) {
    if (values.length == 0) {
        yield [];
    }
    else if (values.length == 1) {
        yield values;
    }
    else {
        for (let id = 0; id < values.length; id++) {
            let local = [...values];
            let deleted = local.splice(id, 1);
            for (let perms of permutations(local)) {
                yield deleted.concat(perms);
            }
        }
    }
}
class FragmentMatrix {
    constructor(rows, cols, initial) {
        this.rows = rows;
        this.cols = cols;
        this.colSize = 2;
        this.rowSize = this.cols * this.colSize;
        let len = this.rows * this.cols * 2 + this.rows + this.cols;
        this.array = new Array(len).fill(initial);
    }
    static fromObj(obj) {
        let instance = new FragmentMatrix(obj.rows, obj.cols, 0);
        instance.array = obj.array;
        return instance;
    }
    get length() {
        return this.array.length;
    }
    // fragments
    getFrIndex(pos, dir) {
        let idx = 0;
        let sign = 1;
        if (pos.row == 0 && dir == Direction.Top) {
            idx = pos.col;
        }
        else if (pos.col == 0 && dir == Direction.Left) {
            idx = this.rows + pos.row;
        }
        else if (dir == Direction.Top) {
            idx = this.rows + this.cols +
                (pos.row - 1) * this.rowSize + pos.col * this.colSize + Direction.Bottom - 1;
            sign = -1;
        }
        else if (dir == Direction.Left) {
            idx = this.rows + this.cols +
                pos.row * this.rowSize + (pos.col - 1) * this.colSize + Direction.Right - 1;
            sign = -1;
        }
        else {
            idx = this.rows + this.cols +
                pos.row * this.rowSize + pos.col * this.colSize + dir - 1;
        }
        return { idx, sign };
    }
    at(pos, dir) {
        let index = this.getFrIndex(pos, dir);
        return this.array[index.idx] * index.sign;
    }
    // cells
    *everyPos() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                yield { row: row, col: col };
            }
        }
    }
    *hPairs() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 1; col < this.cols; col++) {
                yield { first: { row: row, col: col - 1 }, second: { row: row, col: col } };
            }
        }
    }
    *vPairs() {
        for (let row = 1; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                yield { first: { row: row - 1, col: col }, second: { row: row, col: col } };
            }
        }
    }
    // brute force
    *swipe(maxBound) {
        let isDone = false;
        yield this;
        while (!isDone) {
            isDone = matrixIncrement(this.array, maxBound);
            yield this;
        }
    }
}
class Lookup {
    constructor(matrix) {
        this.matrix = matrix;
        this.array = new Array(matrix.rows * matrix.cols * DIRECTION_COUNT).fill(0);
        for (let pos of this.matrix.everyPos()) {
            for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
                this.array[this.lookIndex(pos, dir)] = this.matrix.getFrIndex(pos, dir);
            }
        }
    }
    lookIndex(pos, dir) {
        return pos.row * this.matrix.cols * 4 + pos.col * 4 + dir;
    }
    at(pos, dir) {
        let frIndex = this.array[this.lookIndex(pos, dir)];
        return this.matrix.array[frIndex.idx] * frIndex.sign;
    }
}
class Transform {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.colSize = 4;
        this.rowSize = this.cols * this.colSize;
        let len = this.rowSize * rows;
        this.matrix = new Array(len).fill(0);
    }
    *all() {
        // TODO
    }
}
class Solution {
    constructor(rows, cols, maxBound) {
        this.maxBound = maxBound;
        this.matrix = new FragmentMatrix(rows, cols, -1 * maxBound);
        this.lookup = new Lookup(this.matrix);
    }
    static fromObj(obj) {
        let instance = new Solution(obj.matrix.rows, obj.matrix.cols, obj.maxBound);
        instance.matrix = FragmentMatrix.fromObj(obj.matrix);
        instance.lookup = new Lookup(instance.matrix);
        return instance;
    }
    // puzzle logic
    isUnique() {
        // local validation heuristic
        for (let pos of this.matrix.everyPos()) {
            if (this.lookup.at(pos, Direction.Top) ==
                this.lookup.at(pos, Direction.Bottom)) {
                return false;
            }
            if (this.lookup.at(pos, Direction.Left) ==
                this.lookup.at(pos, Direction.Right)) {
                return false;
            }
            if (this.lookup.at(pos, Direction.Bottom) ==
                this.lookup.at(pos, Direction.Right) &&
                this.lookup.at(pos, Direction.Left) ==
                    this.lookup.at(pos, Direction.Top)) {
                return false;
            }
            if (this.lookup.at(pos, Direction.Bottom) ==
                this.lookup.at(pos, Direction.Left) &&
                this.lookup.at(pos, Direction.Right) ==
                    this.lookup.at(pos, Direction.Top)) {
                return false;
            }
        }
        return true;
    }
    // brute force
    *swipe() {
        for (let _ of this.matrix.swipe(this.maxBound)) {
            yield null;
        }
    }
    // display
    render() {
        let frame = new Svg.SvgFrame();
        frame.domEl.classList.add("puzzle-solution");
        let group = new Svg.Group();
        frame.appendChild(group);
        frame.safeView = new Maths.Rect(new Maths.Vector(0, 0), new Maths.Vector(this.matrix.cols * 10, this.matrix.rows * 10));
        for (let pos of this.matrix.everyPos()) {
            let piece = new Svg.Group();
            piece.domEl.classList.add("piece");
            piece.appendChild(new Svg.Rect(2, 2, 6, 6, { className: "piece-block" }));
            piece.appendChild(new Svg.Text(`${pos.row}, ${pos.col}`, 5, 5, { className: "piece-coord" }));
            let a = 5;
            let txtPos = [
                new Maths.Vector(a, 1.5),
                new Maths.Vector(9, a),
                new Maths.Vector(a, 9.5),
                new Maths.Vector(1, a)
            ];
            for (let id = Direction.Top; id <= Direction.Left; id++) {
                let fr = this.matrix.at(pos, id);
                piece.appendChild(new Svg.Text(fr.toString(), txtPos[id].x, txtPos[id].y, { className: "fragment-label" }));
            }
            piece.translation = new Maths.Vector(pos.col * 10, pos.row * 10);
            group.appendChild(piece);
        }
        return frame.domEl;
    }
}
function* generate(rows, cols, maxBound) {
    let yieldCount = 0;
    let timeWindowCount = 0;
    let totalCount = 0;
    let timeWindowStart = Date.now();
    let sol = new Solution(rows, cols, maxBound);
    for (let _ of sol.swipe()) {
        if (sol.isUnique()) {
            yield sol;
            yieldCount++;
        }
        totalCount++;
        timeWindowCount++;
        let timeInMs = Date.now();
        if (timeInMs - timeWindowStart > 1000) {
            console.log("Rate", timeWindowCount, "/ sec");
            timeWindowCount = 0;
            timeWindowStart += 1000;
        }
        if (yieldCount >= 20) {
            break;
        }
    }
    console.log("Total try", totalCount);
}
export { generate, Solution };
