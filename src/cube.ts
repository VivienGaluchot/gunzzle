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
 *
 * Puzzle
 *
 * ```
 *             -- a --
 *            |       |
 *            b   1   c
 *            |       |
 *             -- d --
 *   -- b*--   -- d*--   -- c*--
 *  |       | |       | |       |
 *  e   2   f f*  3   g g*  4   h
 *  |       | |       | |       |
 *   -- i --   -- j --   -- k --
 *             -- j*--
 *            |       |
 *            i*  5   k*
 *            |       |
 *             -- l --
 *             -- l*--
 *            |       |
 *            e*  6   h*
 *            |       |
 *             -- a* --
 * ```
 */

import * as tmp from "./lib/template.ts";
import * as algo from "./lib/algo.ts";

console.log("# cube");

console.log("## template");
console.log("");

const sA = new tmp.ValSlot("a");
const rA = new tmp.RefSlot(sA);
const sB = new tmp.ValSlot("b");
const rB = new tmp.RefSlot(sB);
const sC = new tmp.ValSlot("c");
const rC = new tmp.RefSlot(sC);
const sD = new tmp.ValSlot("d");
const rD = new tmp.RefSlot(sD);
const sE = new tmp.ValSlot("e");
const rE = new tmp.RefSlot(sE);
const sF = new tmp.ValSlot("f");
const rF = new tmp.RefSlot(sF);
const sG = new tmp.ValSlot("g");
const rG = new tmp.RefSlot(sG);
const sH = new tmp.ValSlot("h");
const rH = new tmp.RefSlot(sH);
const sI = new tmp.ValSlot("i");
const rI = new tmp.RefSlot(sI);
const sJ = new tmp.ValSlot("j");
const rJ = new tmp.RefSlot(sJ);
const sK = new tmp.ValSlot("k");
const rK = new tmp.RefSlot(sK);
const sL = new tmp.ValSlot("l");
const rL = new tmp.RefSlot(sL);

const trs: tmp.Transformations<4> = [
    [0, 1, 2, 3],
    [3, 0, 1, 2],
    [2, 3, 0, 1],
    [1, 2, 3, 0],
    [0, 3, 2, 1],
    [1, 0, 3, 2],
    [2, 1, 0, 3],
    [3, 2, 1, 0],
];

// no transform on first piece to reduce the number of symetries found
const p1 = new tmp.Piece([sA, sC, sD, sB]).withTransformations([[0, 1, 2, 3]]);
const p2 = new tmp.Piece([rB, sF, sI, sE]).withTransformations(trs);
const p3 = new tmp.Piece([rD, sG, sJ, rF]).withTransformations(trs);
const p4 = new tmp.Piece([rC, sH, sK, rG]).withTransformations(trs);
const p5 = new tmp.Piece([rJ, rK, sL, rI]).withTransformations(trs);
const p6 = new tmp.Piece([rL, rH, rA, rE]).withTransformations(trs);

const template = new tmp.Puzzle([p1, p2, p3, p4, p5, p6]);
console.log(template.toString());

const symmetries = template.getOneSolutionPuzzle().countPermutations().valid;
console.log(`symmetries`, symmetries);

/**
 * Best for now
 *
 * 1 x 29.2:1
 * [-1 -2 2 1] [-1 2 1 1] [-2 -1 1 -2] [2 -1 -1 1] [-1 1 -3 -1] [3 1 1 -1]
 *
 * 1 x 34.5
 * [-2 1 -1 2] [-2 -3 2 2] [1 -2 2 3] [-1 -2 -2 2] [-2 2 -3 -2] [3 2 2 -2]
 */
// algo.randomSearch(template, 3, (instance, counts) => {
//     const valid = counts.valid / symmetries;
//     const almost = Math.round(10 * counts.almost / symmetries) / 10;
//     console.log("---");
//     console.log(`${almost}:${valid}`);
//     console.log(instance.toString());
//     console.log("---");
// });

/**
 * Best for now
 *
 * 1 x 18.7
 * [2 -1 1 -2] [2 -3 1 1] [-1 2 1 3] [1 -1 -1 -2] [-1 1 -3 -1] [3 1 -2 -1]
 */
algo.darwinSearch(template, 3, (instance, counts) => {
    const valid = counts.valid / symmetries;
    const almost = Math.round(10 * counts.almost / symmetries) / 10;
    console.log("---");
    console.log(`${valid} x ${almost}`);
    console.log(instance.toString());
    console.log("---");
});
