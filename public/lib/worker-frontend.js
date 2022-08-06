"use strict";
function assert(isOk, ...message) {
    if (!isOk) {
        console.error("Assert failed:", ...message);
        throw new Error("Assert failed");
    }
}
;
;
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
function startBackend() {
    return new Worker("lib/worker-backend.js", { type: "module" });
}
function stopBackend(worker) {
    worker.terminate();
}
async function* puzzleGenerate(cancelPromise, worker, input) {
    let request = { genInput: input };
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
export { puzzleGenerate, startBackend, stopBackend };
