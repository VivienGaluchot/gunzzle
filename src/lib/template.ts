import * as instance from "./instance.ts";

// Slots

export class ValSlot {
    id: string;
    count: number;
    generated?: number;

    constructor(id: string, count: number) {
        this.id = id;
        this.count = count;
    }

    toString(): string {
        return `${this.id}`;
    }

    *all(): Generator<instance.Slot> {
        for (let i = -this.count; i <= this.count; i++) {
            if (i != 0) {
                this.generated = i;
                yield new instance.Slot(i);
            }
        }
    }

    clean() {
        this.generated = undefined;
    }
}

export class RefSlot {
    ref: ValSlot;

    constructor(ref: ValSlot) {
        this.ref = ref;
    }

    toString(): string {
        return `*${this.ref.toString()}`;
    }

    *all(): Generator<RefSlot> {
        yield this;
    }

    clean() {
    }
}

type Slot = RefSlot | ValSlot;

type PartialSlot = instance.Slot | RefSlot;

function resolvePartialSlot(partial: PartialSlot): instance.Slot {
    if (partial instanceof instance.Slot) {
        return partial;
    } else if (partial instanceof RefSlot) {
        if (partial.ref.generated != undefined) {
            return new instance.Slot(partial.ref.generated * -1);
        } else {
            throw new Error("internal error");
        }
    } else {
        throw new Error("internal error");
    }
}

// Pieces

export class Piece {
    slots: Slot[];

    constructor(slots: Slot[]) {
        this.slots = slots;
    }

    toString(): string {
        const slot_list = this.slots.map((slot) => `${slot.toString()}`).join(
            " ",
        );
        return `[${slot_list}]`;
    }

    *all(): Generator<PartialPiece> {
        yield* this.recGenerator(this.slots);
    }

    private *recGenerator(slots: Slot[]): Generator<PartialPiece> {
        const [first, ...rest] = slots;
        if (first == undefined) {
            yield [];
        } else {
            for (const slot of first.all()) {
                for (const slotRest of this.recGenerator(rest)) {
                    yield [slot, ...slotRest];
                }
            }
        }
    }

    clean() {
        for (const slot of this.slots) {
            slot.clean();
        }
    }
}

type PartialPiece = PartialSlot[];

function resolvePartialPiece(partial: PartialPiece): instance.Piece {
    return new instance.Piece(partial.map(resolvePartialSlot));
}

// Puzzles

export class Puzzle {
    pieces: Piece[];

    constructor(pieces: Piece[]) {
        this.pieces = pieces;
    }

    toString(): string {
        return this.pieces.map((piece) => piece.toString()).join(" ");
    }

    *all(): Generator<instance.Puzzle> {
        for (const piece of this.pieces) {
            piece.clean();
        }
        for (const partialPieces of this.recGenerator(this.pieces)) {
            yield new instance.Puzzle(partialPieces.map(resolvePartialPiece));
        }
    }

    private *recGenerator(pieces: Piece[]): Generator<PartialPiece[]> {
        const [first, ...rest] = pieces;
        if (first == undefined) {
            yield [];
        } else {
            for (const piece of first.all()) {
                for (const pieceRest of this.recGenerator(rest)) {
                    yield [piece, ...pieceRest];
                }
            }
        }
    }
}

//-------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------

import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";

Deno.test("ValSlot.all", () => {
    assertEquals(
        [...new ValSlot("a", 1).all()].map((slot) => slot.value),
        [-1, 1],
    );
    assertEquals(
        [...new ValSlot("a", 2).all()].map((slot) => slot.value),
        [-2, -1, 1, 2],
    );
    assertEquals(
        [...new ValSlot("a", 3).all()].map((slot) => slot.value),
        [-3, -2, -1, 1, 2, 3],
    );
});

Deno.test("Piece.all", () => {
    const s00 = new ValSlot("a", 2);
    const s01 = new ValSlot("b", 1);
    const p1 = new Piece([
        new RefSlot(s00),
        s00,
        s01,
        new RefSlot(s01),
        new RefSlot(s01),
    ]);

    const allResolved = [];
    for (const piece of p1.all()) {
        allResolved.push(
            resolvePartialPiece(piece).slots.map((slot) => slot.value),
        );
    }

    assertEquals(allResolved, [
        [2, -2, -1, 1, 1],
        [2, -2, 1, -1, -1],
        [1, -1, -1, 1, 1],
        [1, -1, 1, -1, -1],
        [-1, 1, -1, 1, 1],
        [-1, 1, 1, -1, -1],
        [-2, 2, -1, 1, 1],
        [-2, 2, 1, -1, -1],
    ]);
});

Deno.test("Puzzle.all", () => {
    const s00 = new ValSlot("a", 2);
    const s01 = new ValSlot("b", 1);
    const p1 = new Piece([s00, new RefSlot(s01)]);
    const p2 = new Piece([new RefSlot(s00), s01]);
    const puzzleTemplate = new Puzzle([p1, p2]);

    assertEquals(puzzleTemplate.toString(), "[a *b] [*a b]");
    assertEquals(
        [...puzzleTemplate.all()].map((puzzle) => {
            return puzzle.pieces.map((piece) => {
                return piece.slots.map((slot) => {
                    return slot.value;
                });
            });
        }),
        [
            [[-2, 1], [2, -1]],
            [[-2, -1], [2, 1]],
            [[-1, 1], [1, -1]],
            [[-1, -1], [1, 1]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]],
            [[2, 1], [-2, -1]],
            [[2, -1], [-2, 1]],
        ],
    );
});

Deno.test("Puzzle.toString", () => {
    const s00 = new ValSlot("a", 2);
    const s01 = new ValSlot("b", 2);
    const s10 = new ValSlot("c", 2);
    const s20 = new ValSlot("d", 2);

    const p1 = new Piece([s00, s01]);
    const p2 = new Piece([new RefSlot(s01), s10]);
    const p3 = new Piece([new RefSlot(s10), s20]);

    const puzzle = new Puzzle([p1, p2, p3]);
    assertEquals(puzzle.toString(), "[a b] [*b c] [*c d]");
});
