"use strict";
import * as Puzzle from './puzzle.js';
console.log("Worker backend started");
function sendResponse(response) {
    postMessage(response);
}
let id = 0;
onmessage = (event) => {
    let request = event.data;
    if (request.genInput) {
        console.log("Request received", request);
        for (let solution of Puzzle.generate(request.genInput)) {
            sendResponse({
                id: id++,
                genOutput: solution
            });
        }
        sendResponse({
            id: id++
        });
    }
    if (request.statsInput) {
        console.log("Request received", request);
        sendResponse({
            id: id++,
            statsOutput: Puzzle.stats(request.statsInput),
        });
    }
};
