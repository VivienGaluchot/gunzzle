import * as tmp from "./template.ts";
import * as ins from "./instance.ts";
import { assertDefined } from "./type.ts";

/**
 * Return
 * * `>0` if `a` is more difficult than `b`,
 * * `0` if `a` difficulty is the same as `b`,
 * * `<0` if `b` is more difficult than `a`.
 */
function compareDifficulty(a: ins.DifficultyIndice, b: ins.DifficultyIndice): number {
    if (a.valid != b.valid) {
        return b.valid - a.valid;
    } else {
        const scoreA = a.almost * a.entropy * a.entropy;
        const scoreB = b.almost * b.entropy * b.entropy;
        return scoreA - scoreB;
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

type onNewBestCb<PieceCount extends number, SlotCount extends number> = (
    instance: ins.Puzzle<PieceCount, SlotCount>,
    indice: ins.DifficultyIndice,
) => Promise<void>;

export async function bruteForceSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotCount: number,
    onNewBest: onNewBestCb<PieceCount, SlotCount>,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestIndice: ins.DifficultyIndice | null = null;

    for (const instance of template.all(slotCount)) {
        const indice = instance.getDifficultyIndice(slotCount, bestIndice?.valid);
        if (bestIndice == null || compareDifficulty(indice, bestIndice) > 0) {
            await onNewBest(instance, indice);
            bestIndice = indice;
        }
        perfIteration(ctx);
    }
}

export async function randomSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotCount: number,
    onNewBest: onNewBestCb<PieceCount, SlotCount>,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestPuzzle: ins.Puzzle<PieceCount, SlotCount> = template.random(slotCount);
    let bestIndice: ins.DifficultyIndice = bestPuzzle.getDifficultyIndice(slotCount);

    while (true) {
        const instance = template.random(slotCount);
        const indice = instance.getDifficultyIndice(slotCount, bestIndice?.valid);
        if (compareDifficulty(indice, bestIndice) > 0) {
            await onNewBest(instance, indice);
            bestPuzzle = instance;
            bestIndice = indice;
        }
        perfIteration(ctx);
    }
}

export async function darwinSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotCount: number,
    onNewBest: onNewBestCb<PieceCount, SlotCount>,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestIndice: ins.DifficultyIndice | null = null;

    // settings
    const populationCount = 25;
    const childCount = 5;
    const mutationRate = .3;

    // initialize population
    const population: {
        instance: ins.Puzzle<PieceCount, SlotCount>;
        indice: ins.DifficultyIndice;
    }[] = [];
    for (let i = 0; i < populationCount; i++) {
        const instance = template.random(slotCount);
        const count = instance.getDifficultyIndice(slotCount);
        population.push({ instance, indice: count });
    }

    // evolution loop
    while (true) {
        // make children
        let hasLogged = false;
        for (let i = 0; i < populationCount; i++) {
            for (let i = 0; i < childCount; i++) {
                const instance = template.randomChildren(
                    slotCount,
                    mutationRate,
                    assertDefined(population[i]).instance,
                );
                const indice = instance.getDifficultyIndice(slotCount, bestIndice?.valid);
                population.push({ instance, indice });
                if (bestIndice == null || compareDifficulty(indice, bestIndice) > 0) {
                    await onNewBest(instance, indice);
                    bestIndice = indice;
                }
                hasLogged = hasLogged || perfIteration(ctx);
            }
        }
        // keep bests
        population.sort((a, b) => {
            return compareDifficulty(a.indice, b.indice);
        });
        while (population.length > populationCount) {
            population.shift();
        }
        if (hasLogged) {
            console.debug(population.map((v) => v.indice.almost));
        }
    }
}
