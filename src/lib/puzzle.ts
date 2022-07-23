"use strict"

import * as Svg from './svg.js';
import * as Maths from './maths.js';

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

function* arrayIncrementGen(array: number[], maxBound: number): Generator<null> {
    let isDone = false;
    yield null;
    while (!isDone) {
        isDone = arrayIncrement(array, maxBound);
        yield null;
    }
}

function* permutations<T>(values: Array<T>): Generator<Array<T>> {
    if (values.length == 0) {
        yield [];
    } else if (values.length == 1) {
        yield values;
    } else {
        for (let id = 0; id < values.length; id++) {
            let local = [...values];
            let deleted = local.splice(id, 1);
            for (let perms of permutations(local)) {
                yield deleted.concat(perms);
            }
        }
    }
}

const ROTATION_R_COUNT = 8;

///      non flip | flip
/// r: [0, 1, 2, 3, 4, 5, 6, 7]
function rotate(dir: Direction, r: number): Direction {
    let rotated = (dir + r) % DIRECTION_COUNT;
    if (r < 4) {
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

type LookupTransformCb = (pos: Pos, dir: Direction) => { pos: Pos, dir: Direction };

class Lookup {
    readonly matrix: FragmentMatrix;
    readonly array: FragmentIndex[];

    constructor(matrix: FragmentMatrix) {
        this.matrix = matrix;
        this.array = new Array(matrix.rows * matrix.cols * DIRECTION_COUNT).fill(0);

        for (let pos of this.matrix.everyPos()) {
            for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
                this.array[this.lookIndex(pos, dir)] = this.matrix.getFrIndex(pos, dir);
            }
        }
    }

    applyTransform(callback: LookupTransformCb) {
        let initial = [...this.array];
        for (let pos of this.matrix.everyPos()) {
            for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
                let target = callback(pos, dir);
                this.array[this.lookIndex(pos, dir)] = initial[this.lookIndex(target.pos, target.dir)]
            }
        }
    }

    lookIndex(pos: Pos, dir: Direction) {
        return pos.row * this.matrix.cols * 4 + pos.col * 4 + dir;
    }

    at(pos: Pos, dir: Direction) {
        let frIndex = this.array[this.lookIndex(pos, dir)];
        return this.matrix.array[frIndex.idx] * frIndex.sign;
    }
}


class Transform {
    readonly matrix: FragmentMatrix;
    readonly lookups: Lookup[];

    private minCount = 1000;

    constructor(matrix: FragmentMatrix) {
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

    isUnique(): boolean {
        // TODO reverse order of display
        let count = 0;
        for (let transform of this.lookups) {
            if (this.isValid(transform)) {
                count++;
            }
        }
        if (count < this.minCount) {
            console.debug("Valid transformation count", count);
            this.minCount = count;
            return true;
        }
        return false;
    }

    // internal

    private isValid(transform: Lookup): boolean {
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

    private * swipeTransforms(): Generator<LookupTransformCb> {
        let baseIndex = [];
        for (let row = 0; row < this.matrix.rows; row++) {
            for (let col = 0; col < this.matrix.cols; col++) {
                baseIndex.push(row * this.matrix.cols + col);
            }
        }
        for (let permuted of permutations(baseIndex)) {
            let rotMatrix = new Array(this.matrix.rows * this.matrix.cols).fill(0);
            for (let _ of arrayIncrementGen(rotMatrix, ROTATION_R_COUNT - 1)) {
                yield (pos: Pos, dir: Direction) => {
                    let index = permuted[pos.row * this.matrix.cols + pos.col];
                    let col = index % this.matrix.cols;
                    let row = (index - col) / this.matrix.cols;
                    let rot = rotMatrix[pos.row * this.matrix.cols + pos.col];
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
    readonly maxBound: number;
    readonly matrix: FragmentMatrix;
    readonly lookup: Lookup;
    readonly transform: Transform;

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
            maxBound: this.maxBound
        };
    }

    // puzzle logic

    isUnique(): boolean {
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
        return this.transform.isUnique();
    }

    // brute force

    * swipe(): Generator<null> {
        for (let _ of this.matrix.swipe(this.maxBound)) {
            yield null;
        }
    }
}


class Solution {
    readonly matrix: FragmentMatrix;

    static deserialize(obj: any) {
        let instance = new Solution(obj.rows, obj.cols, obj.maxBound);
        for (let id = 0; id < instance.matrix.array.length; id++) {
            instance.matrix.array[id] = obj.array[id];
        }
        return instance;
    }

    constructor(rows: number, cols: number, maxBound: number) {
        this.matrix = new FragmentMatrix(rows, cols, -1 * maxBound);
    }

    // display

    render(): Element {
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
                new Maths.Vector(1, a)];
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

        if (yieldCount >= 20) {
            break;
        }
    }
    console.log("Total try", totalCount);
}

export { generate, Solution }