import * as tmp from "./template.ts";
import * as ins from "./instance.ts";

/** Return `true` if `a` is more difficult than `b` */
function difficultyRank(a: ins.PermutationCount, b: ins.PermutationCount): boolean {
    return (a.valid < b.valid) || (a.valid == b.valid && a.almost > b.almost);
}

export function bruteForceSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    onNewBest: (instance: ins.Puzzle<PieceCount, SlotCount>, counts: ins.PermutationCount) => void,
) {
    let best: ins.PermutationCount | null = null;
    for (const instance of template.all(2)) {
        const counts = instance.countPermutations();
        if (best == null || difficultyRank(counts, best)) {
            onNewBest(instance, counts);
            best = counts;
        }
    }
}
