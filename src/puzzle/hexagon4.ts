/**
 * Hexagon puzzle
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
 n       l    · *j ·   
  ·  m ·    *l       p 
            ·    4    ·
             s       q 
              ·  r ·   
`;

const TRS: tmp.Transformations<6> = [
    ...shifts([0, 1, 2, 3, 4, 5]),
    ...shifts([5, 4, 3, 2, 1, 0]),
];

export function getTemplate(): tmp.Puzzle<4, 6> {
    const col = new tmp.SlotCollection();

    const p1 = new tmp.Piece(col.slots(["a", "b", "c", "d", "e", "f"])).withTransformations(TRS);
    const p2 = new tmp.Piece(col.slots(["g", "h", "i", "j", "k", "*c"])).withTransformations(TRS);
    const p3 = new tmp.Piece(col.slots(["*d", "*k", "l", "m", "n", "o"])).withTransformations(TRS);
    const p4 = new tmp.Piece(col.slots(["*j", "p", "q", "r", "s", "*l"])).withTransformations(TRS);

    return new tmp.Puzzle([p1, p2, p3, p4], VISUAL);
}
