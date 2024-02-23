import * as instance from "./instance.ts";

// Slots

export class ValSlot {
    id: string;
    count: number;

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
                yield new instance.Slot(i);
            }
        }
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
}

type Slot = RefSlot | ValSlot;

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

    *all(): Generator<instance.Piece> {
        for (const slots of Piece.recGenerator(this.slots)) {
            yield new instance.Piece(slots);
        }
    }

    private static *recGenerator(slots: Slot[]): Generator<instance.Slot[]> {
        const [first, ...rest] = slots;
        if (first instanceof ValSlot) {
            for (const slotInstance of first.all()) {
                if (rest.length > 0) {
                    for (const slotRest of Piece.recGenerator(rest)) {
                        yield [slotInstance, ...slotRest];
                    }
                } else {
                    yield [slotInstance];
                }
            }
        }
        // TODO handle RefSlot
        if (first instanceof RefSlot) {
            for (const slotRest of Piece.recGenerator(rest)) {
                yield [new instance.Slot(0), ...slotRest];
            }
        }
    }
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
        /// TODO
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
    const p1 = new Piece([s00, s01]);

    assertEquals(
        [...p1.all()].map((piece) => piece.slots.map((slot) => slot.value)),
        [
            [-2, -1],
            [-2, 1],
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
            [2, -1],
            [2, 1],
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
