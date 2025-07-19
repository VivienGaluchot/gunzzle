/**
 * Triangle puzzle
 *
 * # Template
 *
 * Piece
 *
 * ```
 *      ·
 *    ·   ·
 *   1  x  2
 *  ·       ·
 * · ·  0  · ·
 * ```
 */

import * as tmp from "../lib/template.ts";

const VISUAL = `
                 ·                
               ·   ·              
              a  1  b             
             ·       ·            
            · ·  c  · ·           
                                  
            · · *c  · ·           
      ·      ·       ·      ·     
    ·   ·    *f  3  g     ·   ·   
   d  2  f     ·   ·    *g  4  h  
  ·       ·      ·      ·       · 
 · ·  e  · ·           · ·  i  · ·
`;

const TRS: tmp.Transformations<3> = [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1],
    [0, 2, 1],
    [2, 1, 0],
    [1, 0, 2],
];

export function getTemplate(): tmp.Puzzle<4, 3> {
    const a = tmp.slotPair("a");
    const b = tmp.slotPair("b");
    const c = tmp.slotPair("c");
    const d = tmp.slotPair("d");
    const e = tmp.slotPair("e");
    const f = tmp.slotPair("f");
    const g = tmp.slotPair("g");
    const h = tmp.slotPair("h");
    const i = tmp.slotPair("i");

    const p1 = new tmp.Piece([c.s, a.s, b.s]).withTransformations([[0, 1, 2]]);
    const p2 = new tmp.Piece([e.s, d.s, f.s]).withTransformations(TRS);
    const p3 = new tmp.Piece([c.r, g.s, f.r]).withTransformations(TRS);
    const p4 = new tmp.Piece([i.s, h.s, g.r]).withTransformations(TRS);

    return new tmp.Puzzle([p1, p2, p3, p4], VISUAL);
}
