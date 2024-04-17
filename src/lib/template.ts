import * as instance from "./instance.ts";
import { assertDefined, fixedMap, FixedSizeArray } from "./type.ts";

// Slots

export class ValSlot {
    id: string;
    generated?: number;

    constructor(id: string) {
        this.id = id;
    }

    toString(): string {
        return `${this.id}`;
    }

    *all(slotKind: number): Generator<instance.Slot> {
        for (let i = -slotKind; i <= slotKind; i++) {
            if (i != 0) {
                this.generated = i;
                yield new instance.Slot(i);
            }
        }
    }

    random(slotKind: number): instance.Slot {
        let i = getRandomInt((-1 * slotKind) + 1, slotKind);
        if (i <= 0) {
            i = i - 1;
        }
        this.generated = i;
        return new instance.Slot(i);
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

    random(): RefSlot {
        return this;
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

export type Slots<SlotCount extends number> = FixedSizeArray<SlotCount, Slot>;

export type Transformation<SlotCount extends number> = FixedSizeArray<SlotCount, number>;

export type Transformations<SlotCount extends number> = Transformation<SlotCount>[];

export class Piece<SlotCount extends number> {
    slots: Slots<SlotCount>;
    // list of all possible transformations, must include identity
    transformations: Transformations<SlotCount>;

    constructor(slots: Slots<SlotCount>) {
        this.slots = slots;
        this.transformations = [];
    }

    withTransformations(transformations: Transformations<SlotCount>) {
        this.transformations = transformations;
        return this;
    }

    toString(): string {
        const slot_list = this.slots.map((slot) => `${slot.toString()}`).join(
            " ",
        );
        return `[${slot_list}]`;
    }

    *all(slotKind: number): Generator<PartialPiece<SlotCount>> {
        for (const partial of this.recGenerator(slotKind, this.slots)) {
            if (partial.length != this.slots.length) {
                throw new Error("internal error");
            }
            yield {
                slots: partial as FixedSizeArray<SlotCount, PartialSlot>,
                transformations: this.transformations,
            };
        }
    }

    private *recGenerator(slotKind: number, slots: Slot[]): Generator<PartialSlot[]> {
        const [first, ...rest] = slots;
        if (first == undefined) {
            yield [];
        } else {
            for (const slot of first.all(slotKind)) {
                for (const slotRest of this.recGenerator(slotKind, rest)) yield [slot, ...slotRest];
            }
        }
    }

    random(slotKind: number): PartialPiece<SlotCount> {
        return {
            slots: fixedMap(this.slots, (slot) => {
                return slot.random(slotKind);
            }),
            transformations: this.transformations,
        };
    }

    clean() {
        for (const slot of this.slots) {
            slot.clean();
        }
    }
}

type PartialPiece<SlotCount extends number> = {
    slots: FixedSizeArray<SlotCount, PartialSlot>;
    transformations: Transformations<SlotCount>;
};

function resolvePartialPiece<SlotCount extends number>(
    partial: PartialPiece<SlotCount>,
): instance.Piece<SlotCount> {
    return new instance.Piece(
        partial.slots.map(resolvePartialSlot) as instance.Slots<SlotCount>,
        partial.transformations,
    );
}

// Puzzles

interface SlotIndex {
    pieceId: number;
    slotId: number;
}

interface PieceLink {
    slotId: number;
    to: SlotIndex;
}

export class Puzzle<PieceCount extends number, SlotCount extends number> {
    // piece list
    pieces: FixedSizeArray<PieceCount, Piece<SlotCount>>;
    // links to other pieces
    piecesLinks: FixedSizeArray<PieceCount, PieceLink[]>;
    // links to other piece placed before in the `pieces` order
    piecesLinksToPrev: FixedSizeArray<PieceCount, PieceLink[]>;

    constructor(pieces: FixedSizeArray<PieceCount, Piece<SlotCount>>) {
        this.pieces = pieces;
        const slotMap = new Map<Slot, SlotIndex>();
        for (const [pieceId, piece] of pieces.entries()) {
            for (const [slotId, slot] of piece.slots.entries()) {
                slotMap.set(slot, { pieceId: pieceId, slotId: slotId });
            }
        }
        this.piecesLinks = fixedMap(pieces, () => []);
        for (const [pieceId, piece] of pieces.entries()) {
            for (const [slotId, slot] of piece.slots.entries()) {
                if (slot instanceof RefSlot) {
                    const refIndex = assertDefined(slotMap.get(slot.ref));
                    assertDefined(this.piecesLinks[pieceId]).push({ slotId: slotId, to: refIndex });
                    assertDefined(this.piecesLinks[refIndex.pieceId]).push({
                        slotId: refIndex.slotId,
                        to: { pieceId: pieceId, slotId: slotId },
                    });
                }
            }
        }
        this.piecesLinksToPrev = fixedMap(this.piecesLinks, (links, pieceId) => {
            return links.filter((value) => {
                return value.to.pieceId < pieceId;
            });
        });
    }

    toString(): string {
        return this.pieces.map((piece) => piece.toString()).join(" ");
    }

    getOneSolutionPuzzle(): instance.Puzzle<PieceCount, SlotCount> {
        let value = 0;
        const slotMap = new Map<ValSlot, number>();
        for (const piece of this.pieces) {
            for (const slot of piece.slots) {
                if (slot instanceof ValSlot) {
                    value++;
                    slotMap.set(slot, value);
                }
            }
        }
        return new instance.Puzzle(this).withPieces(fixedMap(this.pieces, (piece) => {
            const slots = fixedMap(piece.slots, (slot) => {
                if (slot instanceof ValSlot) {
                    return new instance.Slot(assertDefined(slotMap.get(slot)));
                } else {
                    return new instance.Slot(-1 * assertDefined(slotMap.get(slot.ref)));
                }
            });
            return new instance.Piece(slots, piece.transformations);
        }));
    }

    *all(slotKind: number): Generator<instance.Puzzle<PieceCount, SlotCount>> {
        for (const piece of this.pieces) {
            piece.clean();
        }
        for (const partialPieces of this.recGenerator(slotKind, this.pieces)) {
            yield new instance.Puzzle(this).withPieces(
                fixedMap(
                    partialPieces as FixedSizeArray<PieceCount, PartialPiece<SlotCount>>,
                    resolvePartialPiece<SlotCount>,
                ),
            );
        }
    }

    private *recGenerator(
        slotKind: number,
        pieces: Piece<SlotCount>[],
    ): Generator<PartialPiece<SlotCount>[]> {
        const [first, ...rest] = pieces;
        if (first == undefined) {
            yield [];
        } else {
            for (const piece of first.all(slotKind)) {
                for (const pieceRest of this.recGenerator(slotKind, rest)) {
                    yield [piece, ...pieceRest];
                }
            }
        }
    }

    random(slotKind: number): instance.Puzzle<PieceCount, SlotCount> {
        for (const piece of this.pieces) {
            piece.clean();
        }
        const partialPieces = fixedMap(this.pieces, (piece) => {
            return piece.random(slotKind);
        });
        return new instance.Puzzle(this).withPieces(
            fixedMap(partialPieces, resolvePartialPiece<SlotCount>),
        );
    }
}

//-------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------

import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";
import { assert } from "https://deno.land/std@0.217.0/assert/assert.ts";
import { getRandomInt } from "./math.ts";

Deno.test("Puzzle.toString", () => {
    const s00 = new ValSlot("a");
    const s01 = new ValSlot("b");
    const s10 = new ValSlot("c");
    const s20 = new ValSlot("d");

    const transformations: Transformations<2> = [[0, 1], [1, 0]];
    const p1 = new Piece([s00, s01]).withTransformations(transformations);
    const p2 = new Piece([new RefSlot(s01), s10]).withTransformations(transformations);
    const p3 = new Piece([new RefSlot(s10), s20]).withTransformations(transformations);

    const puzzle = new Puzzle([p1, p2, p3]);
    assertEquals(puzzle.toString(), "[a b] [*b c] [*c d]");
});

Deno.test("ValSlot.all", () => {
    assertEquals(
        [...new ValSlot("a").all(1)].map((slot) => slot.value),
        [-1, 1],
    );
    assertEquals(
        [...new ValSlot("a").all(2)].map((slot) => slot.value),
        [-2, -1, 1, 2],
    );
    assertEquals(
        [...new ValSlot("a").all(3)].map((slot) => slot.value),
        [-3, -2, -1, 1, 2, 3],
    );
});

Deno.test("Piece.all", () => {
    const s00 = new ValSlot("a");
    const s01 = new ValSlot("b");
    const p1 = new Piece<5>([
        new RefSlot(s00),
        s00,
        s01,
        new RefSlot(s01),
        new RefSlot(s01),
    ]);

    const allResolved = [];
    for (const piece of p1.all(2)) {
        allResolved.push(
            resolvePartialPiece(piece).slots.map((slot) => slot.value),
        );
    }

    assertEquals(allResolved, [
        [2, -2, -2, 2, 2],
        [2, -2, -1, 1, 1],
        [2, -2, 1, -1, -1],
        [2, -2, 2, -2, -2],
        [1, -1, -2, 2, 2],
        [1, -1, -1, 1, 1],
        [1, -1, 1, -1, -1],
        [1, -1, 2, -2, -2],
        [-1, 1, -2, 2, 2],
        [-1, 1, -1, 1, 1],
        [-1, 1, 1, -1, -1],
        [-1, 1, 2, -2, -2],
        [-2, 2, -2, 2, 2],
        [-2, 2, -1, 1, 1],
        [-2, 2, 1, -1, -1],
        [-2, 2, 2, -2, -2],
    ]);
});

Deno.test("Puzzle.all", () => {
    const s00 = new ValSlot("a");
    const s01 = new ValSlot("b");

    const transformations: Transformations<2> = [[0, 1], [1, 0]];
    const p1 = new Piece([s00, new RefSlot(s01)]).withTransformations(transformations);
    const p2 = new Piece([new RefSlot(s00), s01]).withTransformations(transformations);
    const puzzleTemplate = new Puzzle([p1, p2]);

    assertEquals(puzzleTemplate.toString(), "[a *b] [*a b]");
    assertEquals(
        [...puzzleTemplate.all(2)].map((puzzle) => {
            return puzzle.pieces?.map((piece) => {
                return piece.slots.map((slot) => {
                    return slot.value;
                });
            });
        }),
        [
            [[-2, 2], [2, -2]],
            [[-2, 1], [2, -1]],
            [[-2, -1], [2, 1]],
            [[-2, -2], [2, 2]],
            [[-1, 2], [1, -2]],
            [[-1, 1], [1, -1]],
            [[-1, -1], [1, 1]],
            [[-1, -2], [1, 2]],
            [[1, 2], [-1, -2]],
            [[1, 1], [-1, -1]],
            [[1, -1], [-1, 1]],
            [[1, -2], [-1, 2]],
            [[2, 2], [-2, -2]],
            [[2, 1], [-2, -1]],
            [[2, -1], [-2, 1]],
            [[2, -2], [-2, 2]],
        ],
    );
});

Deno.test("Puzzle.random", () => {
    const s00 = new ValSlot("a");
    const s01 = new ValSlot("b");
    const s10 = new ValSlot("c");
    const s20 = new ValSlot("d");

    const transformations: Transformations<2> = [[0, 1], [1, 0]];
    const p1 = new Piece([s00, s01]).withTransformations(transformations);
    const p2 = new Piece([new RefSlot(s01), s10]).withTransformations(transformations);
    const p3 = new Piece([new RefSlot(s10), s20]).withTransformations(transformations);

    const puzzleTemplate = new Puzzle([p1, p2, p3]);
    assertEquals(puzzleTemplate.toString(), "[a b] [*b c] [*c d]");

    for (let i = 0; i < 100; i++) {
        const instance = puzzleTemplate.random(10);
        assertEquals(instance.pieces?.length, 3);
        for (const piece of instance.pieces || []) {
            assertEquals(piece.slots.length, 2);
            for (const slot of piece.slots) {
                assert(slot.value <= 10);
                assert(slot.value >= -10);
                assert(slot.value != 0);
            }
        }
    }
});

Deno.test("Puzzle.piecesLinks", () => {
    const s00 = new ValSlot("a");
    const s01 = new ValSlot("b");
    const s10 = new ValSlot("c");
    const s20 = new ValSlot("d");

    const transformations: Transformations<2> = [[0, 1], [1, 0]];
    const p1 = new Piece([s00, s01]).withTransformations(transformations);
    const p2 = new Piece([new RefSlot(s01), s10]).withTransformations(transformations);
    const p3 = new Piece([new RefSlot(s10), s20]).withTransformations(transformations);

    const puzzle = new Puzzle([p1, p2, p3]);
    assertEquals(puzzle.toString(), "[a b] [*b c] [*c d]");
    assertEquals(
        puzzle.pieces.map((_, index) => {
            return puzzle.piecesLinks[index];
        }),
        [
            [{ slotId: 1, to: { pieceId: 1, slotId: 0 } }],
            [
                { slotId: 0, to: { pieceId: 0, slotId: 1 } },
                { slotId: 1, to: { pieceId: 2, slotId: 0 } },
            ],
            [{ slotId: 0, to: { pieceId: 1, slotId: 1 } }],
        ],
    );
    assertEquals(
        puzzle.pieces.map((_, index) => {
            return puzzle.piecesLinksToPrev[index];
        }),
        [
            [],
            [{ slotId: 0, to: { pieceId: 0, slotId: 1 } }],
            [{ slotId: 0, to: { pieceId: 1, slotId: 1 } }],
        ],
    );
});

Deno.test("Puzzle.getOneSolutionPuzzle", () => {
    const s00 = new ValSlot("a");
    const s01 = new ValSlot("b");
    const s10 = new ValSlot("c");
    const s20 = new ValSlot("d");

    const transformations: Transformations<2> = [[0, 1], [1, 0]];
    const p1 = new Piece([s00, s01]).withTransformations(transformations);
    const p2 = new Piece([new RefSlot(s01), s10]).withTransformations(transformations);
    const p3 = new Piece([new RefSlot(s10), s20]).withTransformations(transformations);

    const puzzle = new Puzzle([p1, p2, p3]);
    assertEquals(puzzle.toString(), "[a b] [*b c] [*c d]");
    assertEquals(
        puzzle.getOneSolutionPuzzle().pieces?.map((piece) => {
            return piece.slots.map((slot) => {
                return slot.value;
            });
        }),
        [[1, 2], [-2, 3], [-3, 4]],
    );
});
