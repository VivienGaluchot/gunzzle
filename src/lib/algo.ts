import * as tmp from "./template.ts";
import * as ins from "./instance.ts";

/** Return `true` if `a` is more difficult than `b` */
function difficultyRank(a: ins.PermutationCount, b: ins.PermutationCount): boolean {
    return (a.valid < b.valid) || (a.valid == b.valid && a.almost > b.almost);
}

export function bruteForceSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotKind: number,
    onNewBest: (instance: ins.Puzzle<PieceCount, SlotCount>, counts: ins.PermutationCount) => void,
) {
    let best: ins.PermutationCount | null = null;

    let iterations = 0;
    let lastPrint = Date.now();
    for (const instance of template.all(slotKind)) {
        const counts = instance.countPermutations(best?.valid);
        if (best == null || difficultyRank(counts, best)) {
            onNewBest(instance, counts);
            best = counts;
        }
        iterations += 1;
        const now = Date.now();
        if ((now - lastPrint) > 5000) {
            console.debug(`${(iterations / 5).toString().padStart(6)} / s`);
            iterations = 0;
            lastPrint = now;
        }
    }
}
