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

interface Triplet {
    first: Pos,
    second: Pos,
    third: Pos
}

interface FragmentIndex {
    idx: number, sign: number
}

function fragmentNext(fragment: number, maxBound: number, offset: number): number {
    assert(fragment != 0, "invalid fragment");
    if (fragment < 0) {
        // [-maxBound ; -1] -> [0 ; maxBound - 1]
        fragment += maxBound;
    } else {
        // [1 ; maxBound] -> [maxBound ; 2 * maxBound - 1]
        fragment += maxBound - 1;
    }
    fragment = (fragment + offset) % (maxBound * 2);
    if (fragment < maxBound) {
        // [0 ; maxBound - 1] -> [-maxBound ; -1]
        return fragment - maxBound;
    } else {
        // [maxBound ; 2 * maxBound - 1] -> [1 ; maxBound]
        return fragment - maxBound + 1;
    }
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

const ROTATION_COUNT = DIRECTION_COUNT * 2;

///        non flip | flip
/// r: [0, 1, 2, 3, | 4, 5, 6, 7]
function rotate(dir: Direction, r: number): Direction {
    assert(dir >= 0 && dir < DIRECTION_COUNT, "invalid direction", dir);
    assert(r >= 0 && r < ROTATION_COUNT, "invalid rotation", r);

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

interface MatrixEvolution {
    idx: number,
    value: number,
    initial: number
}

interface MatrixEvolutionState {
    array: number[];
}

class FragmentMatrix {
    readonly rows: number;
    readonly cols: number;
    readonly links: number;

    // Storage order
    // [rows] + [cols] + [rows * cols * 2]
    readonly array: number[];

    readonly hPairs: Pair[];
    readonly vPairs: Pair[];

    readonly hTriplets: Triplet[];
    readonly vTriplets: Triplet[];

    private readonly colSize: number;
    private readonly rowSize: number;

    constructor(rows: number, cols: number, links: number, initial: number) {
        this.rows = rows;
        this.cols = cols;
        this.links = links;

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

    setAt(pos: Pos, dir: Direction, fragment: number) {
        let index = this.getFrIndex(pos, dir);
        fragment = index.sign * fragment;
        return this.array[index.idx] = fragment;
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

    swipeLength(): number {
        return 1 + matrixIncrementLength(this.array, this.links);
    }

    * swipe(): Generator<null> {
        let isDone = false;
        yield null;
        while (!isDone) {
            isDone = matrixIncrement(this.array, this.links);
            yield null;
        }
    }

    // generic

    randomize() {
        this.array[0] = -1 * this.links;
        for (let idx = 1; idx < this.array.length; idx++) {
            let x = Maths.getRandomInt(0, this.links * 2);
            if (x < this.links) {
                // -links .. -1
                this.array[idx] = -1 * this.links + x;
            } else {
                // 1 .. links
                this.array[idx] = x - this.links + 1;
            }
        }
    }

    tilt() {
        let tiltCount = 0;
        for (let idx = 0; idx < this.array.length; idx++) {
            if (Maths.getRandomInt(0, 4) == 0) {
                tiltCount++;
                let offset = Maths.getRandomInt(1, this.links * 2);
                this.array[idx] = fragmentNext(this.array[idx], this.links, offset);
            }
        }
        console.log("Tilted", tiltCount, "/", this.array.length);
    }

    * localEvolutions(): Generator<MatrixEvolution> {
        for (let off = 1; off < (this.links * 2); off++) {
            for (let idx = 0; idx < this.array.length; idx++) {
                let initial = this.array[idx];
                this.array[idx] = fragmentNext(this.array[idx], this.links, off);
                yield { idx: idx, value: this.array[idx], initial: initial };
                this.array[idx] = initial;
            }
        }
    }

    selectEvolution(evolution: MatrixEvolution) {
        this.array[evolution.idx] = evolution.value;
    }

    getState(): MatrixEvolutionState {
        return { array: [...this.array] };
    }

    setState(state: MatrixEvolutionState) {
        assert(this.array.length == state.array.length, "invalid state", state, this.array);
        for (let idx = 0; idx < this.array.length; idx++) {
            this.array[idx] = state.array[idx]
        };
    }

    // internal

    private * hPairsGen(count: number): Generator<Pos[]> {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols - (count - 1); col++) {
                let arr = [];
                for (let i = 0; i < count; i++) {
                    arr.push({ row: row, col: col + i })
                }
                yield arr;
            }
        }
    }

    private * vPairsGen(count: number): Generator<Pos[]> {
        for (let row = 0; row < this.rows - (count - 1); row++) {
            for (let col = 0; col < this.cols; col++) {
                let arr = [];
                for (let i = 0; i < count; i++) {
                    arr.push({ row: row + i, col: col })
                }
                yield arr;
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

function statsToString(stats: SolutionStats) {
    if (stats.validCount == 0 && stats.almostValidCount == 0) {
        return "-";
    }
    let validCount = stats.validCount;
    let almostRate = stats.almostValidCount / stats.validCount;
    return `${validCount} x${almostRate.toFixed(0)}`;
}

interface TrComputeInput {
    maxValidCount: number;
}

interface TrComputeOutput extends SolutionStats {
    aborted: boolean;
}

class Transform {
    readonly matrix: FragmentMatrix;
    readonly lookup: Lookup;

    private maxCount = -1;
    private minAlmostCount = -1;

    constructor(matrix: FragmentMatrix) {
        this.matrix = matrix;
        this.lookup = new Lookup(matrix);
    }

    setCutoff(maxCount: number) {
        this.maxCount = maxCount;
    }

    isNewBest(): TrComputeOutput {
        let pieces: Pos[] = [];
        for (let pos of this.matrix.everyPos()) {
            pieces.push(pos);
        }

        let input = {
            maxValidCount: this.maxCount,
        };
        let output = this.trCompute(input);
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

    trCompute(input: TrComputeInput): TrComputeOutput {
        let pieces: Pos[] = [];
        for (let pos of this.matrix.everyPos()) {
            pieces.push(pos);
        }

        let symCount = this.matrix.rows == this.matrix.cols ? ROTATION_COUNT : ROTATION_COUNT / 2;
        let flipSymmetry = this.matrix.rows == this.matrix.cols;

        let internalInput = { maxValidCount: input.maxValidCount * symCount };
        let output = {
            aborted: false,
            validCount: 0,
            almostValidCount: 0
        };

        this.recConstruct(flipSymmetry, { row: 0, col: 0 }, pieces, internalInput, output);

        // let pieces2: Pos[] = [];
        // for (let pos of this.matrix.everyPos()) {
        //     pieces2.push(pos);
        // }
        // let output2 = {
        //     aborted: false,
        //     validCount: 0,
        //     almostValidCount: 0
        // };
        // this.recConstructNonOptimized({ row: 0, col: 0 }, pieces2, internalInput, output2);

        // if (output.aborted != output2.aborted || (!output.aborted && (output.validCount != output2.validCount || output.almostValidCount != output2.almostValidCount))) {
        //     console.error("Original ", output2);
        //     console.error("Optimized", output);
        //     throw new Error("err");
        // } else {
        //     console.log("optimized algo runtime check ok", output);
        // }

        if (!output.aborted) {
            assert(output.validCount % symCount == 0, "validCount not divisible by symmetries", output, symCount);
        }
        output.validCount = output.validCount / symCount;
        output.almostValidCount = output.almostValidCount / symCount;

        return output;
    }

    // internal

    // fixedCount: [0; rows * cols] number of pieces with defined
    // remaining: set of pieces not placed yet
    // return true when at least one solution have been found
    private recConstruct(useFlipSymmetry: boolean, pos: Pos, remaining: Pos[], input: TrComputeInput, output: TrComputeOutput): boolean {
        if (remaining.length == 0) {
            // add 2 to compensate for the first piece rotations skipped
            output.validCount += useFlipSymmetry ? 2 : 1;
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
                let selected = subPieces.splice(idx, 1)[0];

                // rotate it
                // do not rotate first piece fully to gain some time by skipping symmetries
                // TODO check if more can be skipped
                let rCount = (useFlipSymmetry && pos.row == 0 && pos.col == 0) ? ROTATION_COUNT / 2 : ROTATION_COUNT;
                for (let r = 0; r < rCount; r++) {
                    this.lookup.setTransform(selected, pos, r);

                    // check new piece compatibility
                    if (left != null && left != this.lookup.at(pos, Direction.Left)) {
                        // not compatible
                    } else if (top != null && top != this.lookup.at(pos, Direction.Top)) {
                        // not compatible
                    } else {
                        // continue with the next piece;
                        let subPos = { ...pos };
                        subPos.col++;
                        if (subPos.col == this.matrix.cols) {
                            subPos.col = 0;
                            subPos.row++;
                        }
                        hasFound = this.recConstruct(useFlipSymmetry, subPos, subPieces, input, output) || hasFound;
                        if (output.validCount > input.maxValidCount) {
                            output.aborted = true;
                            return false;
                        }
                    }
                }
            }

            // no valid piece found for the last one
            if (!hasFound && remaining.length == 1) {
                // add 2 to compensate for the first piece rotations skipped
                output.almostValidCount += useFlipSymmetry ? 2 : 1;
            }

            return hasFound;
        }
    }

    private recConstructNonOptimized(pos: Pos, remaining: Pos[], input: TrComputeInput, output: TrComputeOutput): boolean {
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
                let selected = subPieces.splice(idx, 1)[0];

                // rotate it
                for (let r = 0; r < ROTATION_COUNT; r++) {
                    this.lookup.setTransform(selected, pos, r);

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
                        hasFound = this.recConstructNonOptimized(subPos, subPieces, input, output) || hasFound;
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
    links: number,
    array: number[],
    stats: SolutionStats,
}

interface EvolveOutput {
    isTilt: boolean,
    isNewSol: boolean
}

class WorkerSolution {
    readonly matrix: FragmentMatrix;
    readonly lookup: Lookup;
    readonly transform: Transform;
    stats: SolutionStats;

    constructor(rows: number, cols: number, links: number) {
        this.matrix = new FragmentMatrix(rows, cols, links, -1 * links);
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
            links: this.matrix.links,
            array: this.matrix.array,
            stats: this.stats,
        };
    }

    static deserialize(obj: SerializedSolution) {
        let instance = new WorkerSolution(obj.rows, obj.cols, obj.links);
        for (let id = 0; id < instance.matrix.array.length; id++) {
            instance.matrix.array[id] = obj.array[id];
        }
        return instance;
    }

    // puzzle logic

    isNewBest(targetUnique: boolean): boolean {
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

    swipeLength(): number {
        return this.matrix.swipeLength();
    }

    * swipe(): Generator<null> {
        for (let _ of this.matrix.swipe()) {
            yield null;
        }
    }

    // genetic

    randomize(initialCutoff: number): TrComputeOutput {
        let trInput: TrComputeInput = { maxValidCount: initialCutoff };
        while (true) {
            this.matrix.randomize();
            let output = this.trCompute(trInput);
            if (!output.aborted) {
                return output;
            } else {
                console.log("Randomization retry");
            }
        }
    }

    * evolve(initialOutput: TrComputeOutput, initialCutoff: number): Generator<EvolveOutput> {
        function isBest(prev: TrComputeOutput | null, next: TrComputeOutput): boolean {
            return prev == null
                || (next.validCount < prev.validCount)
                || (next.validCount == prev.validCount && next.almostValidCount > prev.almostValidCount);
        }

        let ultraBestOutput: TrComputeOutput = initialOutput;
        let ultraBestState: MatrixEvolutionState = this.matrix.getState();
        let trInput: TrComputeInput = { maxValidCount: initialOutput.validCount };

        while (true) {
            let bestOutput: TrComputeOutput | null = null;
            while (true) {
                let next = null;
                for (let evolution of this.matrix.localEvolutions()) {
                    let output = this.trCompute(trInput);
                    if (!output.aborted) {
                        if (isBest(bestOutput, output)) {
                            next = evolution;
                            bestOutput = output;
                            trInput.maxValidCount = bestOutput.validCount;
                            break;
                        }
                    }
                }
                if (next != null && bestOutput != null) {
                    this.matrix.selectEvolution(next);
                    this.stats = bestOutput;
                    if (isBest(ultraBestOutput, bestOutput)) {
                        console.log("Local step (new best)", statsToString(bestOutput), bestOutput);
                        ultraBestState = this.matrix.getState();
                        ultraBestOutput = bestOutput;
                        yield { isTilt: false, isNewSol: true };
                    } else {
                        console.log("Local step", statsToString(bestOutput), bestOutput);
                    }
                } else {
                    break;
                }
            }

            this.matrix.setState(ultraBestState);
            this.matrix.tilt();
            trInput.maxValidCount = initialCutoff;
            yield { isTilt: true, isNewSol: false };
        }
    }

    // stat update

    trCompute(input: TrComputeInput): TrComputeOutput {
        let output = this.transform.trCompute(input);
        if (!output.aborted) {
            this.stats = output;
        }
        return output;
    }
}

interface ExternalFormat {
    rows: number,
    cols: number,
    links: number,
    pieces: {
        pos: Pos,
        top: number,
        right: number,
        bottom: number,
        left: number
    }[]
}

class Solution {
    matrix: FragmentMatrix;
    stats: SolutionStats;

    serialize(): SerializedSolution {
        return {
            rows: this.matrix.rows,
            cols: this.matrix.cols,
            links: this.matrix.links,
            array: this.matrix.array,
            stats: this.stats,
        };
    }

    static deserialize(obj: SerializedSolution) {
        let instance = new Solution(obj.rows, obj.cols, obj.links, obj.stats);
        for (let id = 0; id < instance.matrix.array.length; id++) {
            instance.matrix.array[id] = obj.array[id];
        }
        return instance;
    }

    constructor(rows: number, cols: number, links: number, stats: SolutionStats) {
        this.matrix = new FragmentMatrix(rows, cols, links, 0);
        this.stats = stats;
    }

    statsString() {
        return statsToString(this.stats);
    }

    // import/export

    static import(obj: ExternalFormat) {
        let instance = new Solution(obj.rows, obj.cols, obj.links, { validCount: 0, almostValidCount: 0 });
        for (let id = 0; id < instance.matrix.array.length; id++) {
            instance.matrix.array[id] = 0;
        }
        let setValue = (pos: Pos, dir: Direction, value: number) => {
            let initial = instance.matrix.at(pos, dir);
            assert(initial == 0 || initial == value, "inconsistency detected", { pos, dir, initial, value });
            instance.matrix.setAt(pos, dir, value);
        }
        for (let piece of obj.pieces) {
            setValue(piece.pos, Direction.Top, piece.top);
            setValue(piece.pos, Direction.Right, piece.right);
            setValue(piece.pos, Direction.Bottom, piece.bottom);
            setValue(piece.pos, Direction.Left, piece.left);
        }
        return instance;
    }

    export(): ExternalFormat {
        let pieces = [];
        for (let pos of this.matrix.everyPos()) {
            pieces.push({
                pos,
                top: this.matrix.at(pos, Direction.Top),
                right: this.matrix.at(pos, Direction.Right),
                bottom: this.matrix.at(pos, Direction.Bottom),
                left: this.matrix.at(pos, Direction.Left)
            });
        }
        return {
            rows: this.matrix.rows,
            cols: this.matrix.cols,
            links: this.matrix.links,
            pieces: pieces,
        };
    }

    // display

    render(): SVGElement {
        let frame = new Svg.SvgFrame();
        frame.domEl.classList.add("puzzle-solution");
        let group = new Svg.Group();
        frame.appendChild(group);

        frame.safeView = new Maths.Rect(new Maths.Vector(-1, -2), new Maths.Vector(2 + this.matrix.cols * 10, 3 + this.matrix.rows * 10));
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

        group.appendChild(new Svg.Text(this.statsString(), this.matrix.cols * 5, 0, { className: "stat-label" }));
        return frame.domEl;
    }
}

enum GenMode {
    BruteForce,
    Genetic,
}

interface GenInput {
    rows: number,
    cols: number,
    links: number,
    mode: GenMode,
    validCountCutoff: number,
    targetUnique: boolean,
    startFrom?: SerializedSolution,
}

interface GenOutput {
    sol?: SerializedSolution,
    rate?: number,
    tiltCount?: number,
    progress?: number,
    iterCount?: number,
}

function* genBruteForce(input: GenInput): Generator<GenOutput> {
    let sol = new WorkerSolution(input.rows, input.cols, input.links);
    let timeWindowCount = 0;
    let iterCount = 0;
    let swipeIndex = 0;
    let timeWindowStart = Date.now();
    let swipeLength = sol.swipeLength();

    sol.transform.setCutoff(input.validCountCutoff);
    for (let _ of sol.swipe()) {
        if (sol.isNewBest(input.targetUnique)) {
            yield {
                sol: sol.serialize(),
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

function* genGenetic(input: GenInput): Generator<GenOutput> {
    let sol: WorkerSolution;
    let firstOutput: TrComputeOutput;
    if (input.startFrom) {
        sol = WorkerSolution.deserialize(input.startFrom);
        firstOutput = sol.trCompute({ maxValidCount: Infinity });
    } else {
        sol = new WorkerSolution(input.rows, input.cols, input.links);
        firstOutput = sol.randomize(input.validCountCutoff);
    }
    yield { sol: sol.serialize() };

    let tiltCount = 0;
    for (let { isTilt, isNewSol } of sol.evolve(firstOutput, input.validCountCutoff)) {
        if (isTilt) {
            tiltCount++;
            yield { tiltCount: tiltCount };
        }
        if (isNewSol) {
            yield { sol: sol.serialize() };
        }
    }
}

function* generate(input: GenInput): Generator<GenOutput> {
    input.validCountCutoff = input.validCountCutoff;
    if (input.mode == GenMode.BruteForce) {
        for (let derived of genBruteForce(input)) {
            yield derived;
        }
    }
    if (input.mode == GenMode.Genetic) {
        for (let derived of genGenetic(input)) {
            yield derived;
        }
    }
}

function stats(input: SerializedSolution): SolutionStats {
    let sol = WorkerSolution.deserialize(input);
    sol.trCompute({ maxValidCount: Infinity });
    return sol.stats;
}

export { generate, stats, Solution, GenMode, GenInput, GenOutput, ExternalFormat, SerializedSolution, SolutionStats }