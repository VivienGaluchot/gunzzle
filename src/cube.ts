import * as tmp from "./lib/template.ts";
import * as algo from "./lib/algo.ts";

/**
 * Cube puzzle
 *
 * ```
 *           -- a --
 *          |       |
 *          b       c
 *          |       |
 *   -- x -- -- d -- -- x --
 *  |       |       |       |
 *  x       x       x       x
 *  |       |       |       |
 *   -- x -- -- x -- -- x --
 *          |       |
 *          x       x
 *          |       |
 *           -- x --
 *          |       |
 *          x       x
 *          |       |
 *           -- x --
 * ```
 */

console.log("# cube");

console.log("## template");
console.log("");

const s00 = new tmp.ValSlot("a");
const s01 = new tmp.ValSlot("b");
const s10 = new tmp.ValSlot("c");
const s20 = new tmp.ValSlot("d");

const trs: tmp.Transformations<2> = [[0, 1], [1, 0]];
const p1 = new tmp.Piece([s00, s01]).withTransformations(trs);
const p2 = new tmp.Piece([new tmp.RefSlot(s01), s10]).withTransformations(trs);
const p3 = new tmp.Piece([new tmp.RefSlot(s10), s20]).withTransformations(trs);

const template = new tmp.Puzzle([p1, p2, p3]);
console.log(template.toString());

const symmetries = template.getOneSolutionPuzzle().countPermutations().valid;
console.log(`symmetries`, symmetries);

console.log("");

console.log("## solutions");
console.log("");

algo.bruteForceSearch(template, (instance, counts) => {
    console.log(`${counts.almost / symmetries}:${counts.valid / symmetries}`);
    console.log(instance.toString());
    console.log("");
});
