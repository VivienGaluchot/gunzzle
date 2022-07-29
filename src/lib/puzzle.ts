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
        if (matrix[idx] <= maxBound) {
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

function matrixIncrementLength(matrix: number[], maxBound: number) {
    return Math.pow((maxBound * 2), (matrix.length - 1));
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

    swipeLength(maxBound: number): number {
        return 1 + matrixIncrementLength(this.array, maxBound);
    }

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

interface SolutionStats {
    validCount: number;
    almostValidCount: number;
}

interface ConstructInputInfo {
    maxValidCount: number;
}

interface ConstructOutputInfo extends SolutionStats {
    aborted: boolean;
}

class Transform {
    readonly matrix: FragmentMatrix;
    readonly lookup: Lookup;

    // TODO conf from website
    private maxCount = 1000;
    private minAlmostCount = -1;

    constructor(matrix: FragmentMatrix) {
        this.matrix = matrix;
        this.lookup = new Lookup(matrix);
    }

    isNewBest(): ConstructOutputInfo {
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
            assert(output.validCount % 8 == 0, "unexpected output", output);
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
    // return true when at least one solution have been found
    private recConstruct(pos: Pos, remaining: Pos[], input: ConstructInputInfo, output: ConstructOutputInfo): boolean {
        if (remaining.length == 0) {
            output.validCount++;
            return true;

        } else {
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
                    } else if (top != null && top != this.lookup.at(pos, Direction.Top)) {
                        // not compatible
                    } else {
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

interface SerializedSolution {
    rows: number,
    cols: number,
    array: number[],
    stats: SolutionStats,
}

class WorkerSolution {
    readonly maxBound: number;
    readonly matrix: FragmentMatrix;
    readonly lookup: Lookup;
    readonly transform: Transform;
    stats: SolutionStats;

    constructor(rows: number, cols: number, maxBound: number) {
        this.maxBound = maxBound;
        this.matrix = new FragmentMatrix(rows, cols, -1 * maxBound);
        this.lookup = new Lookup(this.matrix);
        this.transform = new Transform(this.matrix);
        this.stats = {
            validCount: 0,
            almostValidCount: 0
        };
    }

    serialize(): SerializedSolution {
        return {
            rows: this.matrix.rows,
            cols: this.matrix.cols,
            array: this.matrix.array,
            stats: this.stats,
        };
    }

    // puzzle logic

    isNewBest(targetUnique: boolean): boolean {
        // Heuristics to reduce the number of possibility to find
        // a perfect unique solution faster.
        // May skip some good but not perfect solutions.

        if (targetUnique) {
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
            // pair validation heuristic
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
            // TODO triplet validation heuristic

        }

        let out = this.transform.isNewBest();
        this.stats = out;
        return !out.aborted;
    }

    // brute force

    swipeLength(): number {
        return this.matrix.swipeLength(this.maxBound);
    }

    * swipe(): Generator<null> {
        for (let _ of this.matrix.swipe(this.maxBound)) {
            yield null;
        }
    }
}


class Solution {
    matrix: FragmentMatrix;
    stats: SolutionStats;

    static deserialize(obj: SerializedSolution) {
        let instance = new Solution(obj.rows, obj.cols, obj.stats);
        for (let id = 0; id < instance.matrix.array.length; id++) {
            instance.matrix.array[id] = obj.array[id];
        }
        return instance;
    }

    constructor(rows: number, cols: number, stats: SolutionStats) {
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

        let validCount = this.stats.validCount / 8;
        let almostRate = this.stats.almostValidCount / this.stats.validCount;
        group.appendChild(new Svg.Text(`${validCount} | x${almostRate.toFixed(1)}`, this.matrix.cols * 5, 0, { className: "stat-label" }));
        return frame.domEl;
    }
}

interface GenInput {
    rows: number,
    cols: number,
    links: number,
    targetUnique: boolean
}

interface GenOutput {
    sol?: SerializedSolution,
    rate?: number,
    progress?: number,
}

function* generate(input: GenInput): Generator<GenOutput> {
    let timeWindowCount = 0;
    let totalCount = 0;

    let timeWindowStart = Date.now();
    let swipeIndex = 0;

    let sol = new WorkerSolution(input.rows, input.cols, input.links);
    const swipeLength = sol.swipeLength()

    for (let _ of sol.swipe()) {
        if (sol.isNewBest(input.targetUnique)) {
            yield { sol: sol.serialize() };
        }
        totalCount++;
        timeWindowCount++;

        let timeInMs = Date.now();
        if (timeInMs - timeWindowStart > 500) {
            yield {
                rate: timeWindowCount * (1000 / 500),
                progress: swipeIndex / swipeLength
            };
            timeWindowCount = 0;
            timeWindowStart = timeInMs;
        }

        swipeIndex++;
    }

    console.log("Total try", totalCount);
    assert(totalCount == swipeLength, "Wrong swipe length", swipeLength);
}

export { generate, Solution, GenInput, GenOutput }