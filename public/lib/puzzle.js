"use strict";
import * as Svg from './svg.js';
import * as Maths from './maths.js';
function assert(isOk, ...message) {
    if (!isOk) {
        console.error("Assert failed:", ...message);
        throw new Error("Assert failed");
    }
}
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
function arrayIncrement(array, maxBound) {
    for (let idx = 0; idx < array.length; idx++) {
        array[idx]++;
        if (array[idx] < maxBound) {
            // not an overflow
            return false;
        }
        else {
            // overflow
            array[idx] = 0;
        }
    }
    // done
    return true;
}
function* arrayIncrementGen(array, maxBound) {
    let isDone = false;
    while (!isDone) {
        yield null;
        isDone = arrayIncrement(array, maxBound);
    }
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
const ROTATION_R_COUNT = DIRECTION_COUNT * 2;
///      non flip | flip
/// r: [0, 1, 2, 3, 4, 5, 6, 7]
function rotate(dir, r) {
    assert(dir >= 0 && dir < DIRECTION_COUNT, "invalid direction", dir);
    assert(r >= 0 && r < ROTATION_R_COUNT, "invalid rotation", r);
    let rotated = (dir + r) % DIRECTION_COUNT;
    if (r < DIRECTION_COUNT) {
        return rotated;
    }
    else if (rotated == Direction.Right) {
        return Direction.Left;
    }
    else if (rotated == Direction.Left) {
        return Direction.Right;
    }
    else {
        return rotated;
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
        this.hPairs = [];
        for (let pair of this.hPairsGen()) {
            this.hPairs.push(pair);
        }
        this.vPairs = [];
        for (let pair of this.vPairsGen()) {
            this.vPairs.push(pair);
        }
    }
    get length() {
        return this.array.length;
    }
    // fragments
    getFrIndex(pos, dir) {
        assert(dir >= 0 && dir < DIRECTION_COUNT, "invalid direction", dir);
        assert(pos.row >= 0 && pos.row < this.rows, "invalid row", pos);
        assert(pos.col >= 0 && pos.col < this.cols, "invalid col", pos);
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
    // brute force
    *swipe(maxBound) {
        let isDone = false;
        yield null;
        while (!isDone) {
            isDone = matrixIncrement(this.array, maxBound);
            yield null;
        }
    }
    // internal
    *hPairsGen() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 1; col < this.cols; col++) {
                yield { first: { row: row, col: col - 1 }, second: { row: row, col: col } };
            }
        }
    }
    *vPairsGen() {
        for (let row = 1; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                yield { first: { row: row - 1, col: col }, second: { row: row, col: col } };
            }
        }
    }
}
class Lookup {
    constructor(matrix) {
        this.matrix = matrix;
        this.array = new Array(matrix.rows * matrix.cols * DIRECTION_COUNT).fill(null);
        for (let pos of this.matrix.everyPos()) {
            for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
                this.array[this.lookIndex(pos, dir)] = this.matrix.getFrIndex(pos, dir);
            }
        }
        for (let el of this.array) {
            assert(el != null, "unset array pos", this.array);
        }
    }
    applyTransform(callback) {
        let initial = [...this.array];
        for (let pos of this.matrix.everyPos()) {
            for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
                let target = callback(pos, dir);
                this.array[this.lookIndex(pos, dir)] = initial[this.lookIndex(target.pos, target.dir)];
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
    constructor(matrix) {
        this.minCount = 1000;
        this.matrix = matrix;
        this.lookups = [];
        console.debug("Build transforms");
        for (let tr of this.swipeTransforms()) {
            let lookup = new Lookup(matrix);
            lookup.applyTransform(tr);
            this.lookups.push(lookup);
        }
        console.debug("Done, number of lookups", this.lookups.length);
    }
    isUnique(data) {
        let count = 0;
        for (let transform of this.lookups) {
            if (this.isValid(transform)) {
                count++;
            }
            if (count >= this.minCount) {
                break;
            }
        }
        data.swapCount = count;
        if (count < this.minCount) {
            console.debug("Valid transformation count", count);
            this.minCount = count;
            return true;
        }
        return false;
    }
    // internal
    isValid(transform) {
        // validation
        for (let { first, second } of this.matrix.hPairs) {
            if (transform.at(first, Direction.Right) !=
                -1 * transform.at(second, Direction.Left)) {
                return false;
            }
        }
        for (let { first, second } of this.matrix.vPairs) {
            if (transform.at(first, Direction.Bottom) !=
                -1 * transform.at(second, Direction.Top)) {
                return false;
            }
        }
        return true;
    }
    *swipeTransforms() {
        let baseIndex = [];
        for (let row = 0; row < this.matrix.rows; row++) {
            for (let col = 0; col < this.matrix.cols; col++) {
                baseIndex.push(row * this.matrix.cols + col);
            }
        }
        for (let permuted of permutations(baseIndex)) {
            let rotMatrix = new Array(this.matrix.rows * this.matrix.cols).fill(0);
            for (let _ of arrayIncrementGen(rotMatrix, ROTATION_R_COUNT)) {
                yield (pos, dir) => {
                    let posIndex = pos.row * this.matrix.cols + pos.col;
                    let index = permuted[posIndex];
                    let col = index % this.matrix.cols;
                    let row = (index - col) / this.matrix.cols;
                    let rot = rotMatrix[posIndex];
                    let oDir = rotate(dir, rot);
                    return {
                        pos: { row, col }, dir: oDir
                    };
                };
            }
        }
    }
}
class WorkerSolution {
    constructor(rows, cols, maxBound) {
        this.maxBound = maxBound;
        this.matrix = new FragmentMatrix(rows, cols, -1 * maxBound);
        this.lookup = new Lookup(this.matrix);
        this.transform = new Transform(this.matrix);
        this.stats = { swapCount: 0 };
    }
    serialize() {
        return {
            rows: this.matrix.rows,
            cols: this.matrix.cols,
            array: this.matrix.array,
            maxBound: this.maxBound,
            stats: this.stats,
        };
    }
    // puzzle logic
    isUnique() {
        // Heuristics will reduce the number of possibility to find
        // a perfect unique solution faster.
        // May skip some good but not perfect solutions.
        // // local validation heuristic
        // for (let pos of this.matrix.everyPos()) {
        //     if (this.lookup.at(pos, Direction.Top) ==
        //         this.lookup.at(pos, Direction.Bottom)) {
        //         return false;
        //     }
        //     if (this.lookup.at(pos, Direction.Left) ==
        //         this.lookup.at(pos, Direction.Right)) {
        //         return false;
        //     }
        //     if (this.lookup.at(pos, Direction.Bottom) ==
        //         this.lookup.at(pos, Direction.Right) &&
        //         this.lookup.at(pos, Direction.Left) ==
        //         this.lookup.at(pos, Direction.Top)) {
        //         return false;
        //     }
        //     if (this.lookup.at(pos, Direction.Bottom) ==
        //         this.lookup.at(pos, Direction.Left) &&
        //         this.lookup.at(pos, Direction.Right) ==
        //         this.lookup.at(pos, Direction.Top)) {
        //         return false;
        //     }
        // }
        // // pair validation heuristic
        // for (let { first, second } of this.matrix.hPairs) {
        //     if (this.lookup.at(first, Direction.Top) ==
        //         this.lookup.at(second, Direction.Top)) {
        //         return false;
        //     }
        //     if (this.lookup.at(first, Direction.Bottom) ==
        //         this.lookup.at(second, Direction.Bottom)) {
        //         return false;
        //     }
        // }
        // for (let { first, second } of this.matrix.vPairs) {
        //     if (this.lookup.at(first, Direction.Right) ==
        //         this.lookup.at(second, Direction.Right)) {
        //         return false;
        //     }
        //     if (this.lookup.at(first, Direction.Left) ==
        //         this.lookup.at(second, Direction.Left)) {
        //         return false;
        //     }
        // }
        return this.transform.isUnique(this.stats);
    }
    // brute force
    *swipe() {
        for (let _ of this.matrix.swipe(this.maxBound)) {
            yield null;
        }
    }
}
class Solution {
    constructor(rows, cols, maxBound) {
        this.matrix = new FragmentMatrix(rows, cols, -1 * maxBound);
        this.stats = { swapCount: 0 };
    }
    static deserialize(obj) {
        let instance = new Solution(obj.rows, obj.cols, obj.maxBound);
        for (let id = 0; id < instance.matrix.array.length; id++) {
            instance.matrix.array[id] = obj.array[id];
        }
        instance.stats = obj.stats;
        return instance;
    }
    // display
    render() {
        let frame = new Svg.SvgFrame();
        frame.domEl.classList.add("puzzle-solution");
        let group = new Svg.Group();
        frame.appendChild(group);
        frame.safeView = new Maths.Rect(new Maths.Vector(-2, -2), new Maths.Vector(2 + this.matrix.cols * 10, 2 + this.matrix.rows * 10));
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
        group.appendChild(new Svg.Text(this.stats.swapCount.toString(), 0, 0, { className: "swap-count-label" }));
        return frame.domEl;
    }
}
function* generate(rows, cols, maxBound) {
    let yieldCount = 0;
    let timeWindowCount = 0;
    let totalCount = 0;
    let timeWindowStart = Date.now();
    let sol = new WorkerSolution(rows, cols, maxBound);
    for (let _ of sol.swipe()) {
        if (sol.isUnique()) {
            yield sol.serialize();
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
