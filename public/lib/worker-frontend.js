"use strict";
;
;
// Internal
function assert(isOk, ...message) {
    if (!isOk) {
        console.error("Assert failed:", ...message);
        throw new Error("Assert failed");
    }
}
async function getMessage(worker) {
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
async function* puzzleGenerate(cancelPromise, input) {
    let request = { genInput: input };
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
            }
            else {
                if (lastId) {
                    assert(lastId == null || response.id - lastId == 1, "invalid responds id", response, lastId);
                }
                lastId = response.id;
                if (response.genOutput) {
                    yield response.genOutput;
                }
                else {
                    break;
                }
            }
        }
    }
    catch (error) {
        console.error("Worker error", error);
        throw new Error("worker error");
    }
    finally {
        worker.terminate();
    }
}
async function puzzleStats(sol) {
    let request = { statsInput: sol.serialize() };
    console.debug("send worker request", request);
    let worker = new Worker("lib/worker-backend.js", { type: "module" });
    worker.postMessage(request);
    let stats;
    try {
        let response = await getMessage(worker);
        if (response.statsOutput) {
            stats = response.statsOutput;
        }
        else {
            console.log("unexpected worker response", response);
            throw new Error("unexpected worker response");
        }
    }
    catch (error) {
        console.error("Worker error", error);
        throw new Error("worker error");
    }
    finally {
        worker.terminate();
    }
    return stats;
}
export { puzzleGenerate, puzzleStats };
