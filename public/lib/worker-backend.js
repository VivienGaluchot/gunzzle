"use strict";
import * as Puzzle from './puzzle.js';
console.log("Worker backend started");
function sendResponse(response) {
    postMessage(response);
}
let id = 0;
onmessage = (event) => {
    let request = event.data;
    console.log("Request received", request);
    if (request.genInput) {
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
};
