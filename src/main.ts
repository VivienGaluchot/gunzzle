interface Slot {
    get value(): number;
}

class ValSlot implements Slot {
    value: number;

    constructor(value: number) {
        this.value = value;
    }
}

class RefSlot implements Slot {
    ref: ValSlot;

    constructor(ref: ValSlot) {
        this.ref = ref;
    }

    get value(): number {
        return -1 * this.ref.value;
    }
}

class Piece {
    slots: Slot[]

    constructor(slots: Slot[]) {
        this.slots = slots;
    }

    show(): string {
        const slot_list = this.slots.map((slot) =>
            `${slot.value}`
        ).join(" ");
        return `[${slot_list}]`;
    }
}

class Puzzle {
    pieces: Piece[]

    constructor(pieces: Piece[]) {
        this.pieces = pieces;
    }

    show(): string {
        return this.pieces.map((piece) => piece.show()).join(" ");
    }
}

const s00 = new ValSlot(1);
const s01 = new ValSlot(2);
const s10 = new ValSlot(3);
const s20 = new ValSlot(4);

const p1 = new Piece([s00, s01]);
const p2 = new Piece([new RefSlot(s01), s10]);
const p3 = new Piece([new RefSlot(s10), s20]);

const puzzle = new Puzzle([p1, p2, p3]);

console.log(puzzle.show());

