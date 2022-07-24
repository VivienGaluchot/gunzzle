"use strict"

import * as Svg from './svg.js';
import * as Maths from './maths.js';

function assert(isOk: boolean, ...message: any[]) {
    if (!isOk) {
        console.error("Assert failed:", ...message);
        throw new Error("Assert failed");
    }
}

enum Direction {
    Top = 0,
    Right,
    Bottom,
    Left,
}

const DIRECTION_COUNT = 4;

interface Pos {
    row: number,
    col: number
}

interface Pair {
    first: Pos,
    second: Pos
}

interface FragmentIndex {
    idx: number, sign: number
}

function matrixIncrement(matrix: number[], maxBound: number) {
    // skip first fragment as the value is selected arbitrarily
    for (let idx = 1; idx < matrix.length; idx++) {
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
    // done
    return true;
}

function arrayIncrement(array: number[], maxBound: number) {
    for (let idx = 0; idx < array.length; idx++) {
        array[idx]++;
        if (array[idx] < maxBound) {
            // not an overflow
            return false;
        } else {
            // overflow
            array[idx] = 0;
        }
    }
    // done
    return true;
}

const ROTATION_R_COUNT = DIRECTION_COUNT * 2;

///      non flip | flip
/// r: [0, 1, 2, 3, 4, 5, 6, 7]
function rotate(dir: Direction, r: number): Direction {
    assert(dir >= 0 && dir < DIRECTION_COUNT, "invalid direction", dir);
    assert(r >= 0 && r < ROTATION_R_COUNT, "invalid rotation", r);

    let rotated = (dir + r) % DIRECTION_COUNT;
    if (r < DIRECTION_COUNT) {
        return rotated;
    } else if (rotated == Direction.Right) {
        return Direction.Left
    } else if (rotated == Direction.Left) {
        return Direction.Right
    } else {
        return rotated;
    }
}


class FragmentMatrix {
    readonly rows: number;
    readonly cols: number;

    // Storage order
    // [rows] + [cols] + [rows * cols * 2]
    readonly array: number[];

    readonly hPairs: Pair[];
    readonly vPairs: Pair[];

    private readonly colSize: number;
    private readonly rowSize: number;

    constructor(rows: number, cols: number, initial: number) {
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

    getFrIndex(pos: Pos, dir: Direction): FragmentIndex {
        assert(dir >= 0 && dir < DIRECTION_COUNT, "invalid direction", dir);
        assert(pos.row >= 0 && pos.row < this.rows, "invalid row", pos);
        assert(pos.col >= 0 && pos.col < this.cols, "invalid col", pos);
        let idx = 0;
        let sign = 1;
        if (pos.row == 0 && dir == Direction.Top) {
            idx = pos.col;
        } else if (pos.col == 0 && dir == Direction.Left) {
            idx = this.rows + pos.row;
        } else if (dir == Direction.Top) {
            idx = this.rows + this.cols +
                (pos.row - 1) * this.rowSize + pos.col * this.colSize + Direction.Bottom - 1;
            sign = -1;
        } else if (dir == Direction.Left) {
            idx = this.rows + this.cols +
                pos.row * this.rowSize + (pos.col - 1) * this.colSize + Direction.Right - 1;
            sign = -1;
        } else {
            idx = this.rows + this.cols +
                pos.row * this.rowSize + pos.col * this.colSize + dir - 1;
        }
        return { idx, sign };
    }

    at(pos: Pos, dir: Direction): number {
        let index = this.getFrIndex(pos, dir);
        return this.array[index.idx] * index.sign;
    }

    // cells

    * everyPos(): Generator<Pos> {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                yield { row: row, col: col };
            }
        }
    }

    // brute force

    * swipe(maxBound: number): Generator<null> {
        let isDone = false;
        yield null;
        while (!isDone) {
            isDone = matrixIncrement(this.array, maxBound);
            yield null;
        }
    }

    // internal

    private * hPairsGen(): Generator<Pair> {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 1; col < this.cols; col++) {
                yield { first: { row: row, col: col - 1 }, second: { row: row, col: col } };
            }
        }
    }

    private * vPairsGen(): Generator<Pair> {
        for (let row = 1; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                yield { first: { row: row - 1, col: col }, second: { row: row, col: col } };
            }
        }
    }
}

class Lookup {
    readonly matrix: FragmentMatrix;
    readonly origin: FragmentIndex[];
    readonly active: FragmentIndex[];

    constructor(matrix: FragmentMatrix) {
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

    setTransform(from: Pos, to: Pos, r: number) {
        for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
            this.active[this.lookIndex(to, rotate(dir, r))] = this.origin[this.lookIndex(from, dir)];
        }
    }

    lookIndex(pos: Pos, dir: Direction) {
        return pos.row * this.matrix.cols * 4 + pos.col * 4 + dir;
    }

    at(pos: Pos, dir: Direction) {
        let frIndex = this.active[this.lookIndex(pos, dir)];
        return this.matrix.array[frIndex.idx] * frIndex.sign;
    }
}

interface ConstructInputInfo {
    maxValidCount: number;
}

interface ConstructOutputInfo {
    aborted: boolean;
    validCount: number;
    almostValidCount: number;
}

class Transform {
    readonly matrix: FragmentMatrix;
    readonly lookup: Lookup;

    private maxCount = 10000000;
    private minAlmostCount = 0;

    constructor(matrix: FragmentMatrix) {
        this.matrix = matrix;
        this.lookup = new Lookup(matrix);
    }

    isUnique(): ConstructOutputInfo {
        let pieces: Pos[] = [];
        for (let pos of this.matrix.everyPos()) {
            pieces.push(pos);
        }

        let input = {
            maxValidCount: this.maxCount,
        };
        let output = {
            aborted: false,
            validCount: 0,
            almostValidCount: 0
        };
        this.recConstruct({ row: 0, col: 0 }, pieces, input, output);

        if (!output.aborted) {
            if (output.validCount < this.maxCount) {
                console.debug("New max valid count", output);
                this.maxCount = output.validCount;
                this.minAlmostCount = 0;
            }
            if (output.almostValidCount > this.minAlmostCount) {
                console.debug("New min almost valid count", output);
                this.minAlmostCount = output.almostValidCount;
            } else {
                // drop
                output.aborted = true;
            }
        }
        return output;
    }

    // internal

    // fixedCount: [0; rows * cols] number of pieces with defined
    // remaining: set of pieces not placed yet
    private recConstruct(pos: Pos, remaining: Pos[], input: ConstructInputInfo, output: ConstructOutputInfo) {
        if (remaining.length == 0) {
            output.validCount++;
        } else {
            let left = null;
            if (pos.col > 0) {
                left = -1 * this.lookup.at({ row: pos.row, col: pos.col - 1 }, Direction.Right);
            }
            let top = null;
            if (pos.row > 0) {
                top = -1 * this.lookup.at({ row: pos.row - 1, col: pos.col }, Direction.Bottom);
            }

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
                        if (subPieces.length == 0) {
                            output.almostValidCount++;
                        }
                    } else if (top != null && top != this.lookup.at(pos, Direction.Top)) {
                        // not compatible
                        if (subPieces.length == 0) {
                            output.almostValidCount++;
                        }
                    } else {
                        // continue with the next piece
                        let subPos = { ...pos };
                        subPos.col++;
                        if (subPos.col == this.matrix.cols) {
                            subPos.col = 0;
                            subPos.row++;
                        }
                        this.recConstruct(subPos, subPieces, input, output);
                        if (output.validCount > input.maxValidCount) {
                            output.aborted = true;
                            return;
                        }
                    }
                }
            }
        }
    }
}


class WorkerSolution {
    readonly maxBound: number;
    readonly matrix: FragmentMatrix;
    readonly lookup: Lookup;
    readonly transform: Transform;
    stats?: ConstructOutputInfo;

    constructor(rows: number, cols: number, maxBound: number) {
        this.maxBound = maxBound;
        this.matrix = new FragmentMatrix(rows, cols, -1 * maxBound);
        this.lookup = new Lookup(this.matrix);
        this.transform = new Transform(this.matrix);
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

    isUnique(): boolean {
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

        this.stats = this.transform.isUnique();
        return !this.stats.aborted;
    }

    // brute force

    * swipe(): Generator<null> {
        for (let _ of this.matrix.swipe(this.maxBound)) {
            yield null;
        }
    }
}


class Solution {
    matrix: FragmentMatrix;
    stats: ConstructOutputInfo;

    static deserialize(obj: any) {
        let instance = new Solution(obj.rows, obj.cols, obj.stats);
        for (let id = 0; id < instance.matrix.array.length; id++) {
            instance.matrix.array[id] = obj.array[id];
        }
        return instance;
    }

    constructor(rows: number, cols: number, stats: ConstructOutputInfo) {
        this.matrix = new FragmentMatrix(rows, cols, 0);
        this.stats = stats;
    }

    // display

    render(): Element {
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
                new Maths.Vector(1, a)];
            for (let id = Direction.Top; id <= Direction.Left; id++) {
                let fr = this.matrix.at(pos, id);
                piece.appendChild(new Svg.Text(fr.toString(), txtPos[id].x, txtPos[id].y, { className: "fragment-label" }));
            }

            piece.translation = new Maths.Vector(pos.col * 10, pos.row * 10);

            group.appendChild(piece);
        }

        let almostRate = this.stats.almostValidCount / this.stats.validCount;
        group.appendChild(new Svg.Text(`${this.stats.validCount} | x${almostRate.toFixed(1)}`, this.matrix.cols * 5, 0, { className: "stat-label" }));
        return frame.domEl;
    }
}

function* generate(rows: number, cols: number, maxBound: number) {
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

        if (yieldCount >= 100) {
            break;
        }
    }
    console.log("Total try", totalCount);
}

export { generate, Solution }