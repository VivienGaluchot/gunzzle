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

export interface PermutationCount {
    // number of permutation where the puzzle can be completed
    valid: number;
    // number of permutation where the puzzle can be almost completed, only the last piece does not fit
    almost: number;
}

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

    countPermutations(maxValid?: number): PermutationCount {
        const maxValidReached = { almost: 0, valid: Infinity };
        return this.recCounter(
            [],
            fixedMap(assertDefined(this.pieces), () => true),
            maxValid,
        ) ?? maxValidReached;
    }

    private recCounter(
        fixedPieces: Slots<SlotCount>[],
        isFreePiece: FixedSizeArray<PieceCount, boolean>,
        maxValid: number | undefined,
    ): PermutationCount | null {
        const acc: PermutationCount = { almost: 0, valid: 0 };
        const pieces = assertDefined(this.pieces);
        const freePiecesCount = pieces.length - fixedPieces.length;
        for (const [selectedPieceIndex, selectedPiece] of pieces.entries()) {
            if (isFreePiece[selectedPieceIndex] == true) {
                for (const piece of selectedPiece.slotsTransformations) {
                    // check if piece can be placed against already fixed pieces
                    const pieceId = fixedPieces.length;
                    const links = assertDefined(this.template.piecesLinksToPrev[pieceId]);
                    let isOk = true;
                    for (const link of links) {
                        const freeSlot = assertDefined(piece[link.slotId]);
                        const fixedSlot = assertDefined(
                            fixedPieces[link.to.pieceId]?.[link.to.slotId],
                        );
                        if (fixedSlot.value + freeSlot.value != 0) {
                            isOk = false;
                            break;
                        }
                    }
                    if (isOk) {
                        if (freePiecesCount > 1) {
                            fixedPieces.push(piece);
                            isFreePiece[selectedPieceIndex] = false;
                            const rec = this.recCounter(fixedPieces, isFreePiece, maxValid);
                            isFreePiece[selectedPieceIndex] = true;
                            fixedPieces.pop();
                            if (rec == null) {
                                return null;
                            }
                            acc.valid += rec.valid;
                            acc.almost += rec.almost;
                        } else {
                            acc.valid += 1;
                            if (maxValid && acc.valid > maxValid) {
                                return null;
                            }
                        }
                    }
                }
            }
        }
        if ((freePiecesCount == 1) && (acc.valid == 0)) {
            acc.almost += 1;
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
    const s00 = new tpl.ValSlot("a");
    const s01 = new tpl.ValSlot("b");
    const s10 = new tpl.ValSlot("c");
    const s20 = new tpl.ValSlot("d");

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
    const s00 = new tpl.ValSlot("a");
    const s01 = new tpl.ValSlot("b");
    const s10 = new tpl.ValSlot("c");
    const s20 = new tpl.ValSlot("d");

    const trs: tpl.Transformations<2> = [[0, 1], [1, 0]];
    const templateP1 = new tpl.Piece([s00, s01]).withTransformations(trs);
    const templateP2 = new tpl.Piece([new tpl.RefSlot(s01), s10]).withTransformations(trs);
    const templateP3 = new tpl.Piece([new tpl.RefSlot(s10), s20]).withTransformations(trs);
    const templatePuzzle = new tpl.Puzzle([templateP1, templateP2, templateP3]);
    assertEquals(templatePuzzle.toString(), "[a b] [*b c] [*c d]");

    // 2 since puzzle has one symmetry
    assertEquals(templatePuzzle.getOneSolutionPuzzle().countPermutations(), {
        valid: 2,
        almost: 2,
    });

    {
        const p1 = new Piece([new Slot(-1), new Slot(1)], trs);
        const p2 = new Piece([new Slot(-1), new Slot(1)], trs);
        const p3 = new Piece([new Slot(-1), new Slot(1)], trs);
        assertEquals(new Puzzle(templatePuzzle).withPieces([p1, p2, p3]).countPermutations(), {
            valid: 12,
            almost: 0,
        });
        assertEquals(new Puzzle(templatePuzzle).withPieces([p2, p1, p3]).countPermutations(), {
            valid: 12,
            almost: 0,
        });
    }

    {
        const p1 = new Piece([new Slot(1), new Slot(1)], trs);
        const p2 = new Piece([new Slot(1), new Slot(1)], trs);
        const p3 = new Piece([new Slot(1), new Slot(1)], trs);
        assertEquals(new Puzzle(templatePuzzle).withPieces([p1, p2, p3]).countPermutations(), {
            valid: 0,
            almost: 0,
        });
        assertEquals(new Puzzle(templatePuzzle).withPieces([p2, p1, p3]).countPermutations(), {
            valid: 0,
            almost: 0,
        });
    }

    {
        const p1 = new Piece([new Slot(1), new Slot(2)], trs);
        const p2 = new Piece([new Slot(-2), new Slot(3)], trs);
        const p3 = new Piece([new Slot(-3), new Slot(-1)], trs);
        assertEquals(new Puzzle(templatePuzzle).withPieces([p1, p2, p3]).countPermutations(), {
            valid: 6,
            almost: 0,
        });
        assertEquals(new Puzzle(templatePuzzle).withPieces([p2, p1, p3]).countPermutations(), {
            valid: 6,
            almost: 0,
        });
    }

    {
        const p1 = new Piece([new Slot(1), new Slot(2)], trs);
        const p2 = new Piece([new Slot(-2), new Slot(3)], trs);
        const p3 = new Piece([new Slot(-3), new Slot(4)], trs);
        assertEquals(new Puzzle(templatePuzzle).withPieces([p1, p2, p3]).countPermutations(), {
            valid: 2,
            almost: 2,
        });
        assertEquals(new Puzzle(templatePuzzle).withPieces([p2, p1, p3]).countPermutations(), {
            valid: 2,
            almost: 2,
        });
    }
});
