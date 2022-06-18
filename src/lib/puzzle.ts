"use strict"

class Solution {
    constructor() {

    }
}

async function generate(rows: number, cols: number, fragments: number): Promise<Solution[]> {
    await new Promise(r => setTimeout(r, 2000));
    return [];
}

export { generate }