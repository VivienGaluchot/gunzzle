import * as tmp from "./template.ts";
import * as ins from "./instance.ts";
import { assertDefined } from "./type.ts";

/**
 * Return
 * * `1` if `a` is more difficult than `b`,
 * * `0` if `a` difficulty is the same as `b`,
 * * `-1` if `b` is more difficult than `a`.
 */
function compareDifficulty(a: ins.PermutationCount, b: ins.PermutationCount): number {
    if ((a.valid == b.valid) && (a.almost == b.almost)) {
        return 0;
    } else if ((a.valid < b.valid) || (a.valid == b.valid && a.almost > b.almost)) {
        return 1;
    } else {
        return -1;
    }
}

interface PerfContext {
    iterations: number;
    lastPrintInMs: number;
}

function perfIteration(ctx: PerfContext): boolean {
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
            return true;
        }
    }
    return false;
}

export function bruteForceSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotKind: number,
    onNewBest: (instance: ins.Puzzle<PieceCount, SlotCount>, count: ins.PermutationCount) => void,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestCount: ins.PermutationCount | null = null;

    for (const instance of template.all(slotKind)) {
        const count = instance.countPermutations(bestCount?.valid);
        if (bestCount == null || compareDifficulty(count, bestCount) > 0) {
            onNewBest(instance, count);
            bestCount = count;
        }
        perfIteration(ctx);
    }
}

export function randomSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotKind: number,
    onNewBest: (instance: ins.Puzzle<PieceCount, SlotCount>, count: ins.PermutationCount) => void,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestPuzzle: ins.Puzzle<PieceCount, SlotCount> = template.random(slotKind);
    let bestCount: ins.PermutationCount = bestPuzzle.countPermutations();

    while (true) {
        const instance = template.random(slotKind);
        const count = instance.countPermutations(bestCount?.valid);
        if (compareDifficulty(count, bestCount) > 0) {
            onNewBest(instance, count);
            bestPuzzle = instance;
            bestCount = count;
        }
        perfIteration(ctx);
    }
}

export function darwinSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotKind: number,
    onNewBest: (instance: ins.Puzzle<PieceCount, SlotCount>, count: ins.PermutationCount) => void,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestCount: ins.PermutationCount | null = null;

    // settings
    const populationCount = 50;
    const childCount = 5;
    const mutationRate = .2;

    // initialize population
    const population: {
        instance: ins.Puzzle<PieceCount, SlotCount>;
        count: ins.PermutationCount;
    }[] = [];
    for (let i = 0; i < populationCount; i++) {
        const instance = template.random(slotKind);
        const count = instance.countPermutations();
        population.push({ instance, count });
    }

    // evolution loop
    while (true) {
        // make children
        let hasLogged = false;
        for (let i = 0; i < populationCount; i++) {
            for (let i = 0; i < childCount; i++) {
                const instance = template.randomChildren(
                    slotKind,
                    mutationRate,
                    assertDefined(population[i]).instance,
                );
                const count = instance.countPermutations(bestCount?.valid);
                population.push({ instance, count });
                if (bestCount == null || compareDifficulty(count, bestCount) > 0) {
                    onNewBest(instance, count);
                    bestCount = count;
                }
                hasLogged = hasLogged || perfIteration(ctx);
            }
        }
        // keep bests
        population.sort((a, b) => {
            return compareDifficulty(a.count, b.count);
        });
        while (population.length > populationCount) {
            population.shift();
        }
        if (hasLogged) {
            console.debug(population.map((v) => v.count.almost));
        }
    }
}
