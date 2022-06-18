"use strict"

/**
 * Piece
 * 
 *       tl   tr
 *       --- ---
 *  rt |         | lt
 *          x
 *  rb |         | lb
 *       --- ---
 *       bl   br
 */
class Piece {
    constructor() {

    }
}

class Solution {
    constructor() {

    }

    render(): Element {
        let el = document.createElement("div");
        el.classList.add("puzzle-solution");
        return el;
    }
}

async function generate(rows: number, cols: number, fragments: number): Promise<Solution[]> {
    await new Promise(r => setTimeout(r, 500));
    return [];
}

export { generate }