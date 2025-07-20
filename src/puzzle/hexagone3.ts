/**
 * Hexagone puzzle
 *
 * # Template
 *
 * Piece
 *
 * ```
 *      ·  0 ·
 *     5       1
 *    ·    x    ·
 *     4       2
 *      ·  3 ·
 * ```
 */

import { shifts } from "../lib/math.ts";
import * as tmp from "../lib/template.ts";

const VISUAL = `
  ·  a ·               
 f       b             
·    1    ·            
 e       c    ·  g ·   
  ·  d ·    *c       h 
            ·    2    ·
  · *d ·     k       i 
 o      *k    ·  j ·   
·    3    ·            
 n       l             
  ·  m ·               
`;

const TRS: tmp.Transformations<6> = [
    ...shifts([0, 1, 2, 3, 4, 5]),
    ...shifts([5, 4, 3, 2, 1, 0]),
];

export function getTemplate(): tmp.Puzzle<3, 6> {
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
    const o = tmp.slotPair("o");

    const p1 = new tmp.Piece([a.s, b.s, c.s, d.s, e.s, f.s]).withTransformations([[0, 1, 2, 3, 4, 5]]);
    const p2 = new tmp.Piece([g.s, h.s, i.s, j.s, k.s, c.r]).withTransformations(TRS);
    const p3 = new tmp.Piece([d.r, k.r, l.s, m.s, n.s, o.s]).withTransformations(TRS);

    return new tmp.Puzzle([p1, p2, p3], VISUAL);
}
