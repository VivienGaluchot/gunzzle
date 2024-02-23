// Slots

export class Slot {
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

// Pieces

export class Piece {
    slots: Slot[];

    constructor(slots: Slot[]) {
        this.slots = slots;
    }

    toString(): string {
        const slot_list = this.slots.map((slot) => `${slot.value}`).join(" ");
        return `[${slot_list}]`;
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

    count_permutations(): number {
        // TODO
        return 0;
    }
}

//-------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------

import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";

Deno.test("Puzzle.toString", () => {
    const p1 = new Piece([new Slot(0), new Slot(1)]);
    const p2 = new Piece([new Slot(2), new Slot(3)]);
    const p3 = new Piece([new Slot(4), new Slot(5)]);

    const puzzle = new Puzzle([p1, p2, p3]);
    assertEquals(puzzle.toString(), "[0 1] [2 3] [4 5]");
});
