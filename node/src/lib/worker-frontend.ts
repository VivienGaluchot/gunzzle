"use strict"

import * as Puzzle from './puzzle.js';

interface WorkerRequest {
    // generate solutions
    genInput?: Puzzle.GenInput,
    // compute stats
    statsInput?: Puzzle.SerializedSolution
};

interface WorkerResponse {
    id: number,
    // generate solutions
    genOutput?: Puzzle.GenOutput,
    // compute stats
    statsOutput?: Puzzle.SolutionStats
};

// Internal

function assert(isOk: boolean, ...message: any[]) {
    if (!isOk) {
        console.error("Assert failed:", ...message);
        throw new Error("Assert failed");
    }
}

async function getMessage(worker: Worker): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
        worker.onmessage = (event) => {
            resolve(event.data);
        };
        worker.onerror = (event) => {
            reject(event);
        };
        worker.onmessageerror = (event) => {
            reject(event);
        };
    });
}

// API

async function* puzzleGenerate(cancelPromise: Promise<undefined>, input: Puzzle.GenInput): AsyncGenerator<Puzzle.GenOutput> {
    let request: WorkerRequest = { genInput: input };
    console.debug("send worker request", request);
    let worker = new Worker("lib/worker-backend.js", { type: "module" });
    worker.postMessage(request);
    let lastId = null;
    try {
        while (true) {
            let response = await Promise.race([cancelPromise, getMessage(worker)]);
            if (response == undefined) {
                console.log("Puzzle generation canceled");
                break;
            } else {
                if (lastId) {
                    assert(lastId == null || response.id - lastId == 1, "invalid responds id", response, lastId);
                }
                lastId = response.id;
                if (response.genOutput) {
                    yield response.genOutput;
                } else {
                    break;
                }
            }
        }
    } catch (error) {
        console.error("Worker error", error);
        throw new Error("worker error");
    } finally {
        worker.terminate();
    }
}

async function puzzleStats(sol: Puzzle.Solution): Promise<Puzzle.SolutionStats> {
    let request: WorkerRequest = { statsInput: sol.serialize() };
    console.debug("send worker request", request);
    let worker = new Worker("lib/worker-backend.js", { type: "module" });
    worker.postMessage(request);
    let stats: Puzzle.SolutionStats;
    try {
        let response = await getMessage(worker);
        if (response.statsOutput) {
            stats = response.statsOutput;
        } else {
            console.log("unexpected worker response", response);
            throw new Error("unexpected worker response");
        }
    } catch (error) {
        console.error("Worker error", error);
        throw new Error("worker error");
    } finally {
        worker.terminate();
    }
    return stats;
}

export { puzzleGenerate, puzzleStats, WorkerRequest, WorkerResponse }