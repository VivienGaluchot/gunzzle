
// Slots

abstract class Slot {
    abstract toString(): string
}

export class ValSlot extends Slot {
    id: string;

    constructor(id: string) {
        super();
        this.id = id;
    }

    override toString(): string {
        return `${this.id}`;
    }
}

export class RefSlot extends Slot {
    ref: ValSlot;

    constructor(ref: ValSlot) {
        super();
        this.ref = ref;
    }

    override toString(): string {
        return `*${this.ref.toString()}`;
    }
}

// Pieces

export class Piece {
    slots: Slot[]

    constructor(slots: Slot[]) {
        this.slots = slots;
    }

    toString(): string {
        const slot_list = this.slots.map((slot) =>
            `${slot.toString()}`
        ).join(" ");
        return `[${slot_list}]`;
    }
}


// Puzzles

export class Puzzle {
    pieces: Piece[]

    constructor(pieces: Piece[]) {
        this.pieces = pieces;
    }

    toString(): string {
        return this.pieces.map((piece) => piece.toString()).join(" ");
    }
}
