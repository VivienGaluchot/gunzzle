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
  ·  g ·     e       c   ·  l ·   
 k      *e    ·  d ·   *c       m 
·    2    ·            ·    3    ·
 j       h    · *d ·    p       n 
  ·  i ·    *h      *p   ·  o ·   
            ·    4    ·           
  · *i ·     t       r   · *o ·   
 x      *t    ·  s ·   *r       y 
·    5    ·            ·    6    ·
 w       u    · *s ·    B       z 
  ·  v ·    *u      *B   ·  A ·   
            ·    7    ·
             E       C 
              ·  D ·   
`;

const TRS: tmp.Transformations<6> = [
    ...shifts([0, 1, 2, 3, 4, 5]),
    ...shifts([5, 4, 3, 2, 1, 0]),
];

export function getTemplate(): tmp.Puzzle<7, 6> {
    const col = new tmp.SlotCollection();

    const p1 = new tmp.Piece(col.slots(["a", "b", "c", "d", "e", "f"])).withTransformations(TRS);
    const p2 = new tmp.Piece(col.slots(["g", "*e", "h", "i", "j", "k"])).withTransformations(TRS);
    const p3 = new tmp.Piece(col.slots(["l", "m", "n", "o", "p", "*c"])).withTransformations(TRS);
    const p4 = new tmp.Piece(col.slots(["*d", "*p", "r", "s", "t", "*h"])).withTransformations(TRS);
    const p5 = new tmp.Piece(col.slots(["*i", "*t", "u", "v", "w", "x"])).withTransformations(TRS);
    const p6 = new tmp.Piece(col.slots(["*o", "y", "z", "A", "B", "*r"])).withTransformations(TRS);
    const p7 = new tmp.Piece(col.slots(["*s", "*B", "C", "D", "E", "*u"])).withTransformations(TRS);

    return new tmp.Puzzle([p1, p2, p3, p4, p5, p6, p7], VISUAL);
}
