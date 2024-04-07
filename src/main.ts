import * as tmp from "./lib/template.ts";
import * as ins from "./lib/instance.ts";

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

const symmetryCount = template.getOneSolutionPuzzle().countPermutations().valid;
let bestSolution: ins.PermutationCount | null = null;

for (const instance of template.all(2)) {
    const counts = instance.countPermutations();
    if ((counts.valid % symmetryCount) != 0) {
        throw new Error("internal error");
    }
    // TODO improve difficulty evaluation ?
    if (bestSolution == null || ins.difficultyRank(counts, bestSolution)) {
        console.log("");
        console.log(`${counts.almost / symmetryCount}:${counts.valid / symmetryCount}`);
        console.log(instance.toString());
        bestSolution = counts;
    }
}
