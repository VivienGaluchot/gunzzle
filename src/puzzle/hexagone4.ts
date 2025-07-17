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
 *  \       2       /     --- g* ---
 *   k             i    /           \
 *    \           /    i*            k
 *      --- j ---     /               \
 *                    \       3       /
 *                     n             l
 *                      \           /
 *                        --- m ---
 * ```
 */

import * as tmp from "../lib/template.ts";

export function getTemplate(): tmp.Puzzle<4, 6> {
    const a = tmp.slotPair("a");
    const b = tmp.slotPair("b");
    const c = tmp.slotPair("c");
    const d = tmp.slotPair("d");
    const e = tmp.slotPair("e");
    const f = tmp.slotPair("f");
    const g = tmp.slotPair("g");
    const h = tmp.slotPair("h");
    const i = tmp.slotPair("i");
    const j = tmp.slotPair("j");
    const k = tmp.slotPair("k");
    const l = tmp.slotPair("l");
    const m = tmp.slotPair("m");
    const n = tmp.slotPair("n");

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

    const p1 = new tmp.Piece([a.s, b.s, c.s, d.s, e.s, f.s]).withTransformations([[0, 1, 2, 3, 4, 5]]);
    const p2 = new tmp.Piece([d.s, e.s, f.s, g.s, h.s, c.r]).withTransformations(trs);
    const p3 = new tmp.Piece([d.r, h.r, i.s, j.s, k.s, l.s]).withTransformations(trs);
    const p4 = new tmp.Piece([g.r, k.s, l.s, m.s, n.s, i.r]).withTransformations(trs);

    return new tmp.Puzzle([p1, p2, p3, p4]);
}
