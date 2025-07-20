/**
 * Tetrahedra puzzle
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

const VISUAL = `
                 ·                
               ·   ·              
              a  1  b             
             ·       ·            
            · ·  c  · ·           
                                  
            · · *c  · ·           
      ·      ·       ·      ·     
    ·   ·    *e  3  f     ·   ·   
  *a  2  e     ·   ·    *f  4 *b  
  ·       ·      ·      ·       · 
 · ·  d  · ·           · · *d  · ·
`;

import { shifts } from "../lib/math.ts";
import * as tmp from "../lib/template.ts";

export function getTemplate(): tmp.Puzzle<4, 3> {
    const a = tmp.slotPair("a");
    const b = tmp.slotPair("b");
    const c = tmp.slotPair("c");
    const d = tmp.slotPair("d");
    const e = tmp.slotPair("e");
    const f = tmp.slotPair("f");

    const trs: tmp.Transformations<3> = [
        ...shifts([0, 1, 2]),
        ...shifts([2, 1, 0]),
    ];

    // no transform on first piece to reduce the number of symmetries found
    // can be used since all slots from first pieces are connected to other pieces
    const p1 = new tmp.Piece([c.s, a.s, b.s]).withTransformations([[0, 1, 2]]);
    const p2 = new tmp.Piece([d.s, a.r, e.s]).withTransformations(trs);
    const p3 = new tmp.Piece([c.r, f.s, e.r]).withTransformations(trs);
    const p4 = new tmp.Piece([d.r, f.r, b.r]).withTransformations(trs);

    return new tmp.Puzzle([p1, p2, p3, p4], VISUAL);
}
