import * as tmp from "./template.ts";
import * as ins from "./instance.ts";
import { assertDefined } from "./type.ts";

/**
 * Return
 * * `>0` if `a` is more difficult than `b`,
 * * `0` if `a` difficulty is the same as `b`,
 * * `<0` if `b` is more difficult than `a`.
 */
function compareDifficulties(a: ins.Difficulty, b: ins.Difficulty): number {
    if (a.valid != b.valid) {
        return b.valid - a.valid;
    } else {
        // 1.45 have been choose empirically
        const scoreA = a.almost * Math.pow(a.entropy, 1.42);
        const scoreB = b.almost * Math.pow(b.entropy, 1.42);
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
        const deltaTimeInMs = now - ctx.lastPrintInMs;
        if (deltaTimeInMs > 5000) {
            console.debug(
                `${Math.round(1000 * ctx.iterations / deltaTimeInMs).toString().padStart(6)} / s`,
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
    indice: ins.Difficulty,
) => Promise<void>;

export async function bruteForceSearch<PieceCount extends number, SlotCount extends number>(
    template: tmp.Puzzle<PieceCount, SlotCount>,
    slotCount: number,
    onNewBest: onNewBestCb<PieceCount, SlotCount>,
) {
    const ctx = { iterations: 0, lastPrintInMs: Date.now() };

    let bestDifficulty: ins.Difficulty | null = null;

    for (const instance of template.all(slotCount)) {
        const difficulty = instance.getDifficulty(slotCount, bestDifficulty?.valid);
        if (bestDifficulty == null || compareDifficulties(difficulty, bestDifficulty) > 0) {
            await onNewBest(instance, difficulty);
            bestDifficulty = difficulty;
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
    let bestDifficulty: ins.Difficulty = bestPuzzle.getDifficulty(slotCount);

    while (true) {
        const instance = template.random(slotCount);
        const difficulty = instance.getDifficulty(slotCount, bestDifficulty?.valid);
        if (compareDifficulties(difficulty, bestDifficulty) > 0) {
            await onNewBest(instance, difficulty);
            bestPuzzle = instance;
            bestDifficulty = difficulty;
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

    let bestDifficulty: ins.Difficulty | null = null;

    // settings
    const populationCount = 25;
    const childCount = 5;
    const mutationRate = .3;

    // initialize population
    const population: {
        instance: ins.Puzzle<PieceCount, SlotCount>;
        difficulty: ins.Difficulty;
    }[] = [];
    for (let i = 0; i < populationCount; i++) {
        const instance = template.random(slotCount);
        const count = instance.getDifficulty(slotCount);
        population.push({ instance, difficulty: count });
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
                const difficulty = instance.getDifficulty(slotCount, bestDifficulty?.valid);
                population.push({ instance, difficulty: difficulty });
                if (bestDifficulty == null || compareDifficulties(difficulty, bestDifficulty) > 0) {
                    await onNewBest(instance, difficulty);
                    bestDifficulty = difficulty;
                }
                hasLogged = hasLogged || perfIteration(ctx);
            }
        }
        // keep bests
        population.sort((a, b) => {
            return compareDifficulties(a.difficulty, b.difficulty);
        });
        while (population.length > populationCount) {
            population.shift();
        }
        if (hasLogged) {
            console.debug(population.map((v) => v.difficulty.almost));
        }
    }
}
