"use strict";
import * as Puzzle from './lib/puzzle.js';
onmessage = (event) => {
    let data = event.data;
    console.log("Worker generation started", data);
    for (let solution of Puzzle.generate(data)) {
        postMessage(solution);
    }
    postMessage(null);
};
