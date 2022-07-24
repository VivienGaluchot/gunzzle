"use strict";
import * as Puzzle from './lib/puzzle.js';
onmessage = async (event) => {
    let data = event.data;
    console.log('Worker generation started');
    for (let solution of Puzzle.generate(data.rows, data.cols, data.fragments)) {
        postMessage(solution);
    }
    postMessage(null);
};
