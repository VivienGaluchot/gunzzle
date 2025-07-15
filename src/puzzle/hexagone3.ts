/**
 * Hexagone puzzle
 *
 * # Template
 *
 * Piece
 *
 * ```
 *      --- 0 ---
 *    /           \
 *   5             1
 *  /               \
 *  \       x       /
 *   4             2
 *    \           /
 *      --- 3 ---
 * ```
 *
 * Puzzle
 *
 * ```
 *      --- a ---
 *    /           \
 *   f             b
 *  /               \
 *  \       0       /     --- d ---
 *   e             c    /           \
 *    \           /    c*            e
 *      --- d ---     /               \
 *                    \       1       /
 *      --- i ---      h             f
 *    /           \     \           /
 *   m             h*     --- g ---
 *  /               \
 *  \       2       /
 *   l             j
 *    \           /
 *      --- k ---
 * ```
 */

import * as tmp from "../lib/template.ts";

export function getTemplate(): tmp.Puzzle<4, 3> {
    const sA = new tmp.ValSlot("a");
    const _rA = new tmp.RefSlot(sA);
    const sB = new tmp.ValSlot("b");
    const _rB = new tmp.RefSlot(sB);
    const sC = new tmp.ValSlot("c");
    const rC = new tmp.RefSlot(sC);
    const sD = new tmp.ValSlot("d");
    const _rD = new tmp.RefSlot(sD);
    const sE = new tmp.ValSlot("e");
    const _rE = new tmp.RefSlot(sE);
    const sF = new tmp.ValSlot("f");
    const rF = new tmp.RefSlot(sF);
    const sG = new tmp.ValSlot("g");
    const rG = new tmp.RefSlot(sG);
    const sH = new tmp.ValSlot("h");
    const _rH = new tmp.RefSlot(sH);
    const sI = new tmp.ValSlot("i");
    const _rI = new tmp.RefSlot(sI);
    const sJ = new tmp.ValSlot("j");
    const _rJ = new tmp.RefSlot(sJ);
    const sK = new tmp.ValSlot("k");
    const _rK = new tmp.RefSlot(sK);
    const sL = new tmp.ValSlot("l");
    const _rL = new tmp.RefSlot(sL);
    const sM = new tmp.ValSlot("m");
    const _rM = new tmp.RefSlot(sM);

    const trs: tmp.Transformations<3> = [
        [0, 1, 2],
        [1, 2, 0],
        [2, 0, 1],
        [0, 2, 1],
        [2, 1, 0],
        [1, 0, 2],
    ];

    // no transform on first piece to reduce the number of symetries found
    const p1 = new tmp.Piece([sC, sA, sB]).withTransformations([[0, 1, 2]]);
    const p2 = new tmp.Piece([sE, sD, sF]).withTransformations(trs);
    const p3 = new tmp.Piece([rC, sG, rF]).withTransformations(trs);
    const p4 = new tmp.Piece([sI, rG, sH]).withTransformations(trs);

    return new tmp.Puzzle([p1, p2, p3, p4]);
}
