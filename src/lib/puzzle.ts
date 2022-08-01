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

    // Storage order
    // [rows] + [cols] + [rows * cols * 2]
    readonly array: number[];

    readonly hPairs: Pair[];
    readonly vPairs: Pair[];

    readonly hTriplets: Triplet[];
    readonly vTriplets: Triplet[];

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

    // generic

    randomize(maxBound: number) {
        for (let idx = 0; idx < this.array.length; idx++) {
            let x = Maths.getRandomInt(0, maxBound * 2);
            if (x < maxBound) {
                // -maxBound .. -1
                this.array[idx] = -1 * maxBound + x;
            } else {
                // 1 .. maxBound
                this.array[idx] = x - maxBound + 1;
            }
        }
    }

    tilt(maxBound: number) {
        let tiltCount = 0;
        for (let idx = 0; idx < this.array.length; idx++) {
            if (Maths.getRandomInt(0, 4) == 0) {
                tiltCount++;
                let offset = Maths.getRandomInt(1, maxBound * 2);
                this.array[idx] = fragmentNext(this.array[idx], maxBound, offset);
            }
        }
        console.log("Tilted", tiltCount, "over", this.array.length);
    }

    * localEvolutions(maxBound: number): Generator<MatrixEvolution> {
        for (let off = 1; off < (maxBound * 2); off++) {
            for (let idx = 1; idx < this.array.length; idx++) {
                let initial = this.array[idx];
                this.array[idx] = fragmentNext(this.array[idx], maxBound, off);
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

interface TrComputeInput {
    maxValidCount: number;
}

interface TrComputeOutput extends SolutionStats {
    aborted: boolean;
}

class Transform {
    readonly matrix: FragmentMatrix;
    readonly lookup: Lookup;

    private maxCount: number;
    private minAlmostCount = -1;

    constructor(matrix: FragmentMatrix, validCountCutoff: number) {
        this.matrix = matrix;
        this.lookup = new Lookup(matrix);
        this.maxCount = validCountCutoff;
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
            assert(output.validCount % ROTATION_R_COUNT == 0, "unexpected output", output);
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
    private recConstruct(pos: Pos, remaining: Pos[], input: TrComputeInput, output: TrComputeOutput): boolean {
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
                for (let r = 0; r < ROTATION_R_COUNT; r++) {
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

    constructor(rows: number, cols: number, maxBound: number, validCountCutoff: number) {
        this.maxBound = maxBound;
        this.matrix = new FragmentMatrix(rows, cols, -1 * maxBound);
        this.lookup = new Lookup(this.matrix);
        this.transform = new Transform(this.matrix, validCountCutoff);
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
        return this.matrix.swipeLength(this.maxBound);
    }

    * swipe(): Generator<null> {
        for (let _ of this.matrix.swipe(this.maxBound)) {
            yield null;
        }
    }

    // genetic

    randomize(initialCutoff: number): TrComputeOutput {
        let trInput: TrComputeInput = { maxValidCount: initialCutoff };
        while (true) {
            this.matrix.randomize(this.maxBound);
            let output = this.trCompute(trInput);
            if (!output.aborted) {
                return output;
            } else {
                console.log("Randomization retry");
            }
        }
    }

    * evolve(initialCutoff: number): Generator<null> {
        function isBest(prev: TrComputeOutput | null, next: TrComputeOutput): boolean {
            return prev == null
                || (next.validCount < prev.validCount)
                || (next.validCount == prev.validCount && next.almostValidCount > prev.almostValidCount);
        }

        let initialOutput = this.randomize(initialCutoff);
        yield null;

        let ultraBestOutput: TrComputeOutput | null = null;
        let ultraBestState: MatrixEvolutionState = this.matrix.getState();
        let trInput: TrComputeInput = { maxValidCount: initialOutput.validCount };

        while (true) {
            let bestOutput: TrComputeOutput | null = null;
            while (true) {
                let next = null;
                for (let evolution of this.matrix.localEvolutions(this.maxBound)) {
                    let output = this.trCompute(trInput);
                    if (!output.aborted) {
                        if (isBest(bestOutput, output)) {
                            next = evolution;
                            bestOutput = output;
                            trInput.maxValidCount = bestOutput.validCount;
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
                        yield null;
                    } else {
                        console.log("Local step", statsToString(bestOutput), bestOutput);
                    }
                } else {
                    break;
                }
            }

            console.log("Tilt");
            this.matrix.setState(ultraBestState);
            this.matrix.tilt(this.maxBound);
            trInput.maxValidCount = initialCutoff;
        }
    }

    // wrapper

    private trCompute(input: TrComputeInput): TrComputeOutput {
        let output = this.transform.trCompute(input);
        if (!output.aborted) {
            this.stats = output;
        }
        return output;
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

        group.appendChild(new Svg.Text(statsToString(this.stats), this.matrix.cols * 5, 0, { className: "stat-label" }));
        return frame.domEl;
    }
}

function statsToString(stats: SolutionStats) {
    let validCount = stats.validCount / ROTATION_R_COUNT;
    let almostRate = stats.almostValidCount / stats.validCount;
    return `${validCount} x${almostRate.toFixed(1)}`;
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
    targetUnique: boolean
}

interface GenOutput {
    sol?: SerializedSolution,
    rate?: number,
    progress?: number,
    iterCount: number,
}

function* genBruteForce(input: GenInput, sol: WorkerSolution): Generator<GenOutput> {
    let timeWindowCount = 0;
    let iterCount = 0;
    let swipeIndex = 0;
    let timeWindowStart = Date.now();
    let swipeLength = sol.swipeLength();

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

function* genGenetic(input: GenInput, sol: WorkerSolution): Generator<GenOutput> {
    for (let _ of sol.evolve(input.validCountCutoff)) {
        yield {
            sol: sol.serialize(),
            iterCount: 0
        };
    }
}

function* generate(input: GenInput): Generator<GenOutput> {
    input.validCountCutoff = input.validCountCutoff * ROTATION_R_COUNT;

    let sol = new WorkerSolution(input.rows, input.cols, input.links, input.validCountCutoff);
    if (input.mode == GenMode.BruteForce) {
        for (let derived of genBruteForce(input, sol)) {
            yield derived;
        }
    }
    if (input.mode == GenMode.Genetic) {
        for (let derived of genGenetic(input, sol)) {
            yield derived;
        }
    }
}

export { generate, Solution, GenMode, GenInput, GenOutput, statsToString }