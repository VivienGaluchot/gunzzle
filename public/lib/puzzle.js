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
function fragmentNext(fragment, maxBound, offset) {
    let normalizedOffset = offset % (maxBound * 2);
    let next = fragment + normalizedOffset;
    if (next == 0) {
        return 1;
    }
    else if (next > maxBound) {
        return next - (2 * maxBound + 1);
    }
    else {
        return next;
    }
}
function matrixIncrement(matrix, maxBound) {
    // skip first fragment as the value is selected arbitrarily
    for (let idx = 1; idx < matrix.length; idx++) {
        if (matrix[idx] == -1) {
            matrix[idx] = 1;
        }
        else {
            matrix[idx]++;
        }
        if (matrix[idx] <= maxBound) {
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
function matrixIncrementLength(matrix, maxBound) {
    return Math.pow((maxBound * 2), (matrix.length - 1));
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
        for (let pair of this.hPairsGen(2)) {
            this.hPairs.push({ first: pair[0], second: pair[1] });
        }
        this.vPairs = [];
        for (let pair of this.vPairsGen(2)) {
            this.vPairs.push({ first: pair[0], second: pair[1] });
        }
        this.hTriplets = [];
        for (let pair of this.hPairsGen(3)) {
            this.hTriplets.push({ first: pair[0], second: pair[1], third: pair[2] });
        }
        this.vTriplets = [];
        for (let pair of this.vPairsGen(3)) {
            this.vTriplets.push({ first: pair[0], second: pair[1], third: pair[2] });
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
    swipeLength(maxBound) {
        return 1 + matrixIncrementLength(this.array, maxBound);
    }
    *swipe(maxBound) {
        let isDone = false;
        yield null;
        while (!isDone) {
            isDone = matrixIncrement(this.array, maxBound);
            yield null;
        }
    }
    // generic
    randomize(maxBound) {
        for (let idx = 0; idx < this.array.length; idx++) {
            let x = Maths.getRandomInt(0, maxBound * 2);
            if (x < maxBound) {
                // -maxBound .. -1
                this.array[idx] = -1 * maxBound + x;
            }
            else {
                // 1 .. maxBound
                this.array[idx] = x - maxBound + 1;
            }
        }
    }
    *localEvolutions(maxBound) {
        for (let off = 1; off < (maxBound * 2); off++) {
            console.log("evolution offset", off);
            for (let idx = 1; idx < this.array.length; idx++) {
                let initial = this.array[idx];
                this.array[idx] = fragmentNext(this.array[idx], maxBound, off);
                yield { idx: idx, value: this.array[idx], initial: initial };
                this.array[idx] = initial;
            }
        }
    }
    selectEvolution(evolution) {
        this.array[evolution.idx] = evolution.value;
    }
    // internal
    *hPairsGen(count) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols - (count - 1); col++) {
                let arr = [];
                for (let i = 0; i < count; i++) {
                    arr.push({ row: row, col: col + i });
                }
                yield arr;
            }
        }
    }
    *vPairsGen(count) {
        for (let row = 0; row < this.rows - (count - 1); row++) {
            for (let col = 0; col < this.cols; col++) {
                let arr = [];
                for (let i = 0; i < count; i++) {
                    arr.push({ row: row + i, col: col });
                }
                yield arr;
            }
        }
    }
}
class Lookup {
    constructor(matrix) {
        this.matrix = matrix;
        this.origin = new Array(matrix.rows * matrix.cols * DIRECTION_COUNT).fill(null);
        for (let pos of this.matrix.everyPos()) {
            for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
                this.origin[this.lookIndex(pos, dir)] = this.matrix.getFrIndex(pos, dir);
            }
        }
        for (let el of this.origin) {
            assert(el != null, "unset array pos", this.origin);
        }
        this.active = [...this.origin];
    }
    setTransform(from, to, r) {
        for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
            this.active[this.lookIndex(to, rotate(dir, r))] = this.origin[this.lookIndex(from, dir)];
        }
    }
    lookIndex(pos, dir) {
        return pos.row * this.matrix.cols * 4 + pos.col * 4 + dir;
    }
    at(pos, dir) {
        let frIndex = this.active[this.lookIndex(pos, dir)];
        return this.matrix.array[frIndex.idx] * frIndex.sign;
    }
}
class Transform {
    constructor(matrix, validCountCutoff) {
        this.minAlmostCount = -1;
        this.matrix = matrix;
        this.lookup = new Lookup(matrix);
        this.maxCount = validCountCutoff;
    }
    isNewBest() {
        let pieces = [];
        for (let pos of this.matrix.everyPos()) {
            pieces.push(pos);
        }
        let input = {
            maxValidCount: this.maxCount,
        };
        let output = this.trCompute(input);
        if (!output.aborted) {
            assert(output.validCount % ROTATION_R_COUNT == 0, "unexpected output", output);
            if (output.validCount < this.maxCount) {
                console.debug("New max valid count", output);
                this.maxCount = output.validCount;
                this.minAlmostCount = 0;
            }
            if (output.almostValidCount > this.minAlmostCount) {
                console.debug("New min almost valid count", output);
                this.minAlmostCount = output.almostValidCount;
            }
            else {
                // drop
                output.aborted = true;
            }
        }
        return output;
    }
    trCompute(input) {
        let pieces = [];
        for (let pos of this.matrix.everyPos()) {
            pieces.push(pos);
        }
        let output = {
            aborted: false,
            validCount: 0,
            almostValidCount: 0
        };
        this.recConstruct({ row: 0, col: 0 }, pieces, input, output);
        return output;
    }
    // internal
    // fixedCount: [0; rows * cols] number of pieces with defined
    // remaining: set of pieces not placed yet
    // return true when at least one solution have been found
    recConstruct(pos, remaining, input, output) {
        if (remaining.length == 0) {
            output.validCount++;
            return true;
        }
        else {
            let left = null;
            if (pos.col > 0) {
                left = -1 * this.lookup.at({ row: pos.row, col: pos.col - 1 }, Direction.Right);
            }
            let top = null;
            if (pos.row > 0) {
                top = -1 * this.lookup.at({ row: pos.row - 1, col: pos.col }, Direction.Bottom);
            }
            let hasFound = false;
            // add one piece amongst remaining
            for (let idx = 0; idx < remaining.length; idx++) {
                let subPieces = [...remaining];
                let selected = subPieces.splice(idx, 1);
                // rotate it
                for (let r = 0; r < ROTATION_R_COUNT; r++) {
                    this.lookup.setTransform(selected[0], pos, r);
                    // check new piece compatibility
                    if (left != null && left != this.lookup.at(pos, Direction.Left)) {
                        // not compatible
                    }
                    else if (top != null && top != this.lookup.at(pos, Direction.Top)) {
                        // not compatible
                    }
                    else {
                        // continue with the next piece
                        let subPos = { ...pos };
                        subPos.col++;
                        if (subPos.col == this.matrix.cols) {
                            subPos.col = 0;
                            subPos.row++;
                        }
                        hasFound = this.recConstruct(subPos, subPieces, input, output) || hasFound;
                        if (output.validCount > input.maxValidCount) {
                            output.aborted = true;
                            return false;
                        }
                    }
                }
            }
            // no valid piece found for the last one
            if (!hasFound && remaining.length == 1) {
                output.almostValidCount++;
            }
            return hasFound;
        }
    }
}
class WorkerSolution {
    constructor(rows, cols, maxBound, validCountCutoff) {
        this.maxBound = maxBound;
        this.matrix = new FragmentMatrix(rows, cols, -1 * maxBound);
        this.lookup = new Lookup(this.matrix);
        this.transform = new Transform(this.matrix, validCountCutoff);
        this.stats = {
            validCount: 0,
            almostValidCount: 0
        };
    }
    serialize() {
        return {
            rows: this.matrix.rows,
            cols: this.matrix.cols,
            array: this.matrix.array,
            stats: this.stats,
        };
    }
    // puzzle logic
    isNewBest(targetUnique) {
        // Heuristics to reduce the number of possibility to find
        // a perfect unique solution faster.
        // May skip some good but not perfect solutions.
        if (targetUnique) {
            // local validation
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
            // pair validation
            for (let { first, second } of this.matrix.hPairs) {
                if (this.lookup.at(first, Direction.Top) ==
                    this.lookup.at(second, Direction.Top)) {
                    return false;
                }
                if (this.lookup.at(first, Direction.Bottom) ==
                    this.lookup.at(second, Direction.Bottom)) {
                    return false;
                }
            }
            for (let { first, second } of this.matrix.vPairs) {
                if (this.lookup.at(first, Direction.Right) ==
                    this.lookup.at(second, Direction.Right)) {
                    return false;
                }
                if (this.lookup.at(first, Direction.Left) ==
                    this.lookup.at(second, Direction.Left)) {
                    return false;
                }
            }
            // triplet validation
            for (let { first, third } of this.matrix.hTriplets) {
                if (this.lookup.at(first, Direction.Top) ==
                    this.lookup.at(third, Direction.Top)) {
                    return false;
                }
                if (this.lookup.at(first, Direction.Bottom) ==
                    this.lookup.at(third, Direction.Bottom)) {
                    return false;
                }
            }
            for (let { first, third } of this.matrix.vTriplets) {
                if (this.lookup.at(first, Direction.Right) ==
                    this.lookup.at(third, Direction.Right)) {
                    return false;
                }
                if (this.lookup.at(first, Direction.Left) ==
                    this.lookup.at(third, Direction.Left)) {
                    return false;
                }
            }
        }
        let out = this.transform.isNewBest();
        this.stats = out;
        return !out.aborted;
    }
    // brute force
    swipeLength() {
        return this.matrix.swipeLength(this.maxBound);
    }
    *swipe() {
        for (let _ of this.matrix.swipe(this.maxBound)) {
            yield null;
        }
    }
    // generic
    randomize(initialCutoff) {
        let trInput = { maxValidCount: initialCutoff };
        while (true) {
            this.matrix.randomize(this.maxBound);
            let output = this.trCompute(trInput);
            if (!output.aborted) {
                return;
            }
            else {
                console.log("Randomization retry");
            }
        }
    }
    *evolve() {
        // TODO
        // - tilt to escape local minima
        // - auto randomize and retry
        let trInput = { maxValidCount: Infinity };
        let bestOutput = null;
        while (true) {
            let next = null;
            for (let evolution of this.matrix.localEvolutions(this.maxBound)) {
                let output = this.trCompute(trInput);
                if (!output.aborted) {
                    console.log("evolve", evolution, "->", output);
                    if (bestOutput == null
                        || (output.validCount < bestOutput.validCount)
                        || (output.validCount == bestOutput.validCount && output.almostValidCount > bestOutput.almostValidCount)) {
                        next = evolution;
                        bestOutput = output;
                        trInput.maxValidCount = bestOutput.validCount;
                        break;
                    }
                }
            }
            if (next) {
                console.log("Evolution step", bestOutput);
                this.matrix.selectEvolution(next);
                this.stats = bestOutput;
                yield null;
            }
            else {
                console.log("Local minima reached");
                return;
            }
        }
    }
    // wrapper
    trCompute(input) {
        let output = this.transform.trCompute(input);
        if (!output.aborted) {
            this.stats = output;
        }
        return output;
    }
}
class Solution {
    constructor(rows, cols, stats) {
        this.matrix = new FragmentMatrix(rows, cols, 0);
        this.stats = stats;
    }
    static deserialize(obj) {
        let instance = new Solution(obj.rows, obj.cols, obj.stats);
        for (let id = 0; id < instance.matrix.array.length; id++) {
            instance.matrix.array[id] = obj.array[id];
        }
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
        group.appendChild(new Svg.Text(statsToString(this.stats), this.matrix.cols * 5, 0, { className: "stat-label" }));
        return frame.domEl;
    }
}
function statsToString(stats) {
    let validCount = stats.validCount / ROTATION_R_COUNT;
    let almostRate = stats.almostValidCount / stats.validCount;
    return `${validCount} x${almostRate.toFixed(1)}`;
}
var GenMode;
(function (GenMode) {
    GenMode[GenMode["BruteForce"] = 0] = "BruteForce";
    GenMode[GenMode["Genetic"] = 1] = "Genetic";
})(GenMode || (GenMode = {}));
function* derive(input, sol) {
    if (input.mode == GenMode.BruteForce) {
        for (let _ of sol.swipe()) {
            if (sol.isNewBest(input.targetUnique)) {
                yield sol.serialize();
            }
            else {
                yield null;
            }
        }
    }
    if (input.mode == GenMode.Genetic) {
        sol.randomize(input.validCountCutoff);
        yield sol.serialize();
        for (let _ of sol.evolve()) {
            yield sol.serialize();
        }
    }
}
function* generate(input) {
    let timeWindowCount = 0;
    let iterCount = 0;
    input.validCountCutoff = input.validCountCutoff * ROTATION_R_COUNT;
    let timeWindowStart = Date.now();
    let swipeIndex = 0;
    let sol = new WorkerSolution(input.rows, input.cols, input.links, input.validCountCutoff);
    let swipeLength = null;
    if (input.mode == GenMode.BruteForce) {
        swipeLength = sol.swipeLength();
    }
    for (let derived of derive(input, sol)) {
        if (derived) {
            yield {
                sol: derived,
                iterCount: iterCount
            };
        }
        iterCount++;
        timeWindowCount++;
        swipeIndex++;
        let timeInMs = Date.now();
        if (timeInMs - timeWindowStart > 500) {
            yield {
                rate: timeWindowCount * (1000 / 500),
                progress: swipeLength ? swipeIndex / swipeLength : undefined,
                iterCount: iterCount
            };
            timeWindowCount = 0;
            timeWindowStart = timeInMs;
        }
    }
    console.log("Total try", iterCount);
    assert(swipeLength == null || iterCount == swipeLength, "Wrong swipe length", swipeLength);
}
export { generate, Solution, GenMode, statsToString };
