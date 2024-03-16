import { Transformations } from "./template.ts";
import { FixedSizeArray } from "./type.ts";

// Slots

export class Slot {
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

// Pieces

export type Slots<SlotCount extends number> = FixedSizeArray<SlotCount, Slot>;

export class Piece<SlotCount extends number> {
    slots: Slots<SlotCount>;
    // list of all slots with transformations
    slots_transformations: Slots<SlotCount>[];

    constructor(slots: Slots<SlotCount>, transformations: Transformations<SlotCount>) {
        this.slots = slots;
        this.slots_transformations = [slots];
        for (const transformation of transformations) {
            const transformed = transformation.map((targetId) => {
                const targetSlot = this.slots[targetId];
                if (targetSlot == undefined) {
                    throw new Error(`transformation value '${targetId}' out of range`);
                }
                return targetSlot;
            }) as Slots<SlotCount>;
            this.slots_transformations.push(transformed);
        }
    }

    toString(): string {
        const slot_list = this.slots.map((slot) => `${slot.value}`).join(" ");
        return `[${slot_list}]`;
    }
}

// Puzzles

export class Puzzle<N extends number> {
    pieces: Piece<N>[];

    constructor(pieces: Piece<N>[]) {
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

Deno.test("new Piece", () => {
    function check<N extends number>(
        p: Piece<N>,
        slots_transformations: number[][],
    ) {
        assertEquals(
            p.slots_transformations.map((tr) => tr.map((slot) => slot.value)),
            slots_transformations,
        );
    }

    // identity
    check(new Piece([new Slot(0), new Slot(1)], []), [[0, 1]]);
    check(new Piece([new Slot(3), new Slot(2), new Slot(-1)], []), [[3, 2, -1]]);

    // rotation
    check(new Piece([new Slot(0), new Slot(1)], [[1, 0]]), [[0, 1], [1, 0]]);
    check(new Piece([new Slot(4), new Slot(1)], [[1, 0]]), [[4, 1], [1, 4]]);
    check(new Piece([new Slot(3), new Slot(2), new Slot(-1)], [[2, 0, 1], [1, 2, 0]]), [
        [3, 2, -1],
        [-1, 3, 2],
        [2, -1, 3],
    ]);
});

Deno.test("Puzzle.toString", () => {
    const p1 = new Piece([new Slot(0), new Slot(1)], []);
    const p2 = new Piece([new Slot(2), new Slot(3)], []);
    const p3 = new Piece([new Slot(4), new Slot(5)], []);

    const puzzle = new Puzzle([p1, p2, p3]);
    assertEquals(puzzle.toString(), "[0 1] [2 3] [4 5]");
});
