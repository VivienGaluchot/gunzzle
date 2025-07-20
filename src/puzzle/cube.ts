/**
 * Cube puzzle
 *
 * # Template
 *
 * Piece
 *
 * ```
 *   -- 0 --
 *  |       |
 *  3   x   1
 *  |       |
 *   -- 2 --
 * ```
 */

const VISUAL = `
            ··  a  ··            
            ·       ·            
            b   1   c            
            ·       ·            
            ··  d  ··            
 ·· *b  ··  ·· *d  ··  ·· *c  ·· 
 ·       ·  ·       ·  ·       · 
 e   2   f *f   3   g *g   4   h 
 ·       ·  ·       ·  ·       · 
 ··  i  ··  ··  j  ··  ··  k  ·· 
            ·· *j  ··            
            ·       ·            
           *i   5  *k            
            ·       ·            
            ··  l  ··            
            ·· *l  ··            
            ·       ·            
           *e   6  *h            
            ·       ·            
            ·· *a  ··            
`;

import { shifts } from "../lib/math.ts";
import * as tmp from "../lib/template.ts";

const TRS: tmp.Transformations<4> = [
    ...shifts([0, 1, 2, 3]),
    ...shifts([3, 2, 1, 0]),
];

export function getTemplate(): tmp.Puzzle<6, 4> {
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

    // no transform on first piece to reduce the number of symmetries found
    // can be used since all slots from first pieces are connected to other pieces
    const p1 = new tmp.Piece([a.s, c.s, d.s, b.s]).withTransformations([[0, 1, 2, 3]]);
    const p2 = new tmp.Piece([b.r, f.s, i.s, e.s]).withTransformations(TRS);
    const p3 = new tmp.Piece([d.r, g.s, j.s, f.r]).withTransformations(TRS);
    const p4 = new tmp.Piece([c.r, h.s, k.s, g.r]).withTransformations(TRS);
    const p5 = new tmp.Piece([j.r, k.r, l.s, i.r]).withTransformations(TRS);
    const p6 = new tmp.Piece([l.r, h.r, a.r, e.r]).withTransformations(TRS);

    return new tmp.Puzzle([p1, p2, p3, p4, p5, p6], VISUAL);
}
