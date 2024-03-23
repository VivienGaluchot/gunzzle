import * as tpl from "./template.ts";
import { assertDefined, fixedMap, FixedSizeArray } from "./type.ts";

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
    slotsTransformations: Slots<SlotCount>[];

    constructor(slots: Slots<SlotCount>, transformations: tpl.Transformations<SlotCount>) {
        this.slots = slots;
        this.slotsTransformations = transformations.map((transformation) => {
            return fixedMap(transformation, (targetId) => {
                const targetSlot = this.slots[targetId];
                if (targetSlot == undefined) {
                    throw new Error(`transformation value '${targetId}' out of range`);
                }
                return targetSlot;
            });
        });
    }

    toString(): string {
        const slot_list = this.slots.map((slot) => `${slot.value}`).join(" ");
        return `[${slot_list}]`;
    }
}

// Puzzles

export class Puzzle<PieceCount extends number, SlotCount extends number> {
    template: tpl.Puzzle<PieceCount, SlotCount>;
    pieces?: FixedSizeArray<PieceCount, Piece<SlotCount>>;

    constructor(template: tpl.Puzzle<PieceCount, SlotCount>) {
        this.template = template;
    }

    withPieces(pieces: FixedSizeArray<PieceCount, Piece<SlotCount>>) {
        this.pieces = pieces;
        return this;
    }

    toString(): string {
        return this.pieces?.map((piece) => piece.toString()).join(" ") ?? "<no pieces>";
    }

    countPermutations(): number {
        return this.recCounter([], assertDefined(this.pieces));
    }

    private recCounter(fixedPieces: Slots<SlotCount>[], freePieces: Piece<SlotCount>[]): number {
        let acc = 0;
        for (const [freePieceIndex, freePiece] of freePieces.entries()) {
            for (const piece of freePiece.slotsTransformations) {
                // check if piece can be placed against already fixed pieces
                const pieceId = fixedPieces.length;
                const links = assertDefined(this.template.piecesLinksToPrev[pieceId]);
                let isOk = true;
                for (const link of links) {
                    const freeSlot = assertDefined(piece[link.slotId]);
                    const fixedSlot = assertDefined(fixedPieces[link.to.pieceId]?.[link.to.slotId]);
                    if (fixedSlot.value != (-1 * freeSlot.value)) {
                        isOk = false;
                        break;
                    }
                }
                if (isOk) {
                    if (freePieces.length > 1) {
                        const nextFree = [...freePieces];
                        nextFree.splice(freePieceIndex, 1);
                        acc += this.recCounter([...fixedPieces, piece], nextFree);
                    } else {
                        acc += 1;
                    }
                }
            }
        }
        return acc;
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
            p.slotsTransformations.map((tr) => tr.map((slot) => slot.value)),
            slots_transformations,
        );
    }

    // identity
    check(new Piece([new Slot(0), new Slot(1)], [[0, 1]]), [[0, 1]]);
    check(new Piece([new Slot(3), new Slot(2), new Slot(-1)], [[0, 1, 2]]), [[3, 2, -1]]);

    // rotation
    check(new Piece([new Slot(0), new Slot(1)], [[0, 1], [1, 0]]), [[0, 1], [1, 0]]);
    check(new Piece([new Slot(4), new Slot(1)], [[0, 1], [1, 0]]), [[4, 1], [1, 4]]);
    check(new Piece([new Slot(3), new Slot(2), new Slot(-1)], [[0, 1, 2], [2, 0, 1], [1, 2, 0]]), [
        [3, 2, -1],
        [-1, 3, 2],
        [2, -1, 3],
    ]);
});

Deno.test("Puzzle.toString", () => {
    const s00 = new tpl.ValSlot("a", 2);
    const s01 = new tpl.ValSlot("b", 2);
    const s10 = new tpl.ValSlot("c", 2);
    const s20 = new tpl.ValSlot("d", 2);

    const trs: tpl.Transformations<2> = [[0, 1]];
    const templateP1 = new tpl.Piece([s00, s01]).withTransformations(trs);
    const templateP2 = new tpl.Piece([new tpl.RefSlot(s01), s10]).withTransformations(trs);
    const templateP3 = new tpl.Piece([new tpl.RefSlot(s10), s20]).withTransformations(trs);
    const templatePuzzle = new tpl.Puzzle([templateP1, templateP2, templateP3]);

    const p1 = new Piece([new Slot(0), new Slot(1)], []);
    const p2 = new Piece([new Slot(2), new Slot(3)], []);
    const p3 = new Piece([new Slot(4), new Slot(5)], []);
    const puzzle = new Puzzle(templatePuzzle).withPieces([p1, p2, p3]);

    assertEquals(puzzle.toString(), "[0 1] [2 3] [4 5]");
});

Deno.test("Puzzle.countPermutations", () => {
    const s00 = new tpl.ValSlot("a", 2);
    const s01 = new tpl.ValSlot("b", 2);
    const s10 = new tpl.ValSlot("c", 2);
    const s20 = new tpl.ValSlot("d", 2);

    const trs: tpl.Transformations<2> = [[0, 1]];
    const templateP1 = new tpl.Piece([s00, s01]).withTransformations(trs);
    const templateP2 = new tpl.Piece([new tpl.RefSlot(s01), s10]).withTransformations(trs);
    const templateP3 = new tpl.Piece([new tpl.RefSlot(s10), s20]).withTransformations(trs);
    const templatePuzzle = new tpl.Puzzle([templateP1, templateP2, templateP3]);
    assertEquals(templatePuzzle.toString(), "[a b] [*b c] [*c d]");

    {
        const p1 = new Piece([new Slot(-1), new Slot(1)], trs);
        const p2 = new Piece([new Slot(-1), new Slot(1)], trs);
        const p3 = new Piece([new Slot(-1), new Slot(1)], trs);
        const puzzle = new Puzzle(templatePuzzle).withPieces([p1, p2, p3]);
        assertEquals(puzzle.countPermutations(), 6);
    }

    {
        const p1 = new Piece([new Slot(1), new Slot(1)], trs);
        const p2 = new Piece([new Slot(1), new Slot(1)], trs);
        const p3 = new Piece([new Slot(1), new Slot(1)], trs);
        const puzzle = new Puzzle(templatePuzzle).withPieces([p1, p2, p3]);
        assertEquals(puzzle.countPermutations(), 0);
    }

    {
        const p1 = new Piece([new Slot(1), new Slot(2)], trs);
        const p2 = new Piece([new Slot(-2), new Slot(3)], trs);
        const p3 = new Piece([new Slot(-3), new Slot(-1)], trs);
        const puzzle = new Puzzle(templatePuzzle).withPieces([p1, p2, p3]);
        assertEquals(puzzle.countPermutations(), 3);
    }

    {
        const p1 = new Piece([new Slot(1), new Slot(2)], trs);
        const p2 = new Piece([new Slot(-2), new Slot(3)], trs);
        const p3 = new Piece([new Slot(-3), new Slot(4)], trs);
        const puzzle = new Puzzle(templatePuzzle).withPieces([p1, p2, p3]);
        assertEquals(puzzle.countPermutations(), 1);
    }
});
