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
 *      --- d* ---      h             f
 *    /           \     \           /
 *   l             h*     --- g ---
 *  /               \
 *  \       2       /
 *   k             i
 *    \           /
 *      --- j ---
 * ```
 */

import * as tmp from "../lib/template.ts";

export function getTemplate(): tmp.Puzzle<3, 6> {
    const sA = new tmp.ValSlot("a");
    const _rA = new tmp.RefSlot(sA);
    const sB = new tmp.ValSlot("b");
    const _rB = new tmp.RefSlot(sB);
    const sC = new tmp.ValSlot("c");
    const rC = new tmp.RefSlot(sC);
    const sD = new tmp.ValSlot("d");
    const rD = new tmp.RefSlot(sD);
    const sE = new tmp.ValSlot("e");
    const _rE = new tmp.RefSlot(sE);
    const sF = new tmp.ValSlot("f");
    const _rF = new tmp.RefSlot(sF);
    const sG = new tmp.ValSlot("g");
    const _rG = new tmp.RefSlot(sG);
    const sH = new tmp.ValSlot("h");
    const rH = new tmp.RefSlot(sH);
    const sI = new tmp.ValSlot("i");
    const _rI = new tmp.RefSlot(sI);
    const sJ = new tmp.ValSlot("j");
    const _rJ = new tmp.RefSlot(sJ);
    const sK = new tmp.ValSlot("k");
    const _rK = new tmp.RefSlot(sK);
    const sL = new tmp.ValSlot("l");
    const _rL = new tmp.RefSlot(sL);

    const trs: tmp.Transformations<6> = [
        [0, 1, 2, 3, 4, 5],
        [5, 0, 1, 2, 3, 4],
        [4, 5, 0, 1, 2, 3],
        [3, 4, 5, 0, 1, 2],
        [2, 3, 4, 5, 0, 1],
        [1, 2, 3, 4, 5, 0],
        [5, 4, 3, 2, 1, 1],
        [1, 5, 4, 3, 2, 1],
        [1, 1, 5, 4, 3, 2],
        [2, 1, 1, 5, 4, 3],
        [3, 2, 1, 1, 5, 4],
        [4, 3, 2, 1, 1, 5],
    ];

    // no transform on first piece to reduce the number of symetries found
    const p1 = new tmp.Piece([sA, sB, sC, sD, sE, sF]).withTransformations([[0, 1, 2, 3, 4, 5]]);
    const p2 = new tmp.Piece([sD, sE, sF, sG, sH, rC]).withTransformations(trs);
    const p3 = new tmp.Piece([rD, rH, sI, sJ, sK, sL]).withTransformations(trs);

    return new tmp.Puzzle([p1, p2, p3]);
}
