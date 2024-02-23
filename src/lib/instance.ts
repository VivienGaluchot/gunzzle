
// Slots

export class Slot {
    value: number;

    constructor(value: number) {
        this.value = value;
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
            `${slot.value}`
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