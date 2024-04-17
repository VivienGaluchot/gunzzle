import * as tmp from "./template.ts";
import * as ins from "./instance.ts";

/** Return `true` if `a` is more difficult than `b` */
function isMoreDifficult(a: ins.PermutationCount, b: ins.PermutationCount): boolean {
    return (a.valid < b.valid) || (a.valid == b.valid && a.almost > b.almost);
}

interface PerfContext {
    iterations: number;
    lastPrintInMs: number;
}

function perfIteration(ctx: PerfContext) {
    ctx.iterations += 1;
    if (ctx.iterations % 100 == 0) {
        const now = Date.now();
        const deltatTimeInMs = now - ctx.lastPrintInMs;
        if (deltatTimeInMs > 5000) {
            console.debug(
                `${Math.round(1000 * ctx.iterations / deltatTimeInMs).toString().padStart(6)} / s`,
            );
            ctx.iterations = 0;
            ctx.lastPrintInMs = now;
        }
    }
}

export function bruteForceSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotKind: number,
    onNewBest: (instance: ins.Puzzle<PieceCount, SlotCount>, counts: ins.PermutationCount) => void,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestCount: ins.PermutationCount | null = null;

    for (const instance of template.all(slotKind)) {
        const counts = instance.countPermutations(bestCount?.valid);
        if (bestCount == null || isMoreDifficult(counts, bestCount)) {
            onNewBest(instance, counts);
            bestCount = counts;
        }
        perfIteration(ctx);
    }
}

export function randomSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotKind: number,
    onNewBest: (instance: ins.Puzzle<PieceCount, SlotCount>, counts: ins.PermutationCount) => void,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestPuzzle: ins.Puzzle<PieceCount, SlotCount> = template.random(slotKind);
    let bestCount: ins.PermutationCount = bestPuzzle.countPermutations();

    while (true) {
        const instance = template.random(slotKind);
        const counts = instance.countPermutations(bestCount?.valid);
        if (isMoreDifficult(counts, bestCount)) {
            onNewBest(instance, counts);
            bestPuzzle = instance;
            bestCount = counts;
        }
        perfIteration(ctx);
    }
}
