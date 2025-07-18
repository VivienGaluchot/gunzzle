export function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

export function normalizedEntropy(arr: number[], valueCout: number) {
    const n = arr.length;
    if (n === 0) return 0;
    if (valueCout <= 1) return 0;

    const freq = new Map();
    for (const val of arr) {
        freq.set(val, (freq.get(val) || 0) + 1);
    }

    let entropy = 0;
    for (const count of freq.values()) {
        const p = count / n;
        entropy -= p * Math.log2(p);
    }

    const maxEntropy = Math.log2(valueCout);
    return entropy / maxEntropy;
}

//-------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------

import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";

Deno.test("normalizedEntropy", () => {
    assertEquals(normalizedEntropy([0, 0, 0, 0], 10), 0);
    assertEquals(normalizedEntropy([1, 1, 1, 1], 10), 0);
    assertEquals(normalizedEntropy([0, 1, 2, 3], 4), 1);
    assertEquals(normalizedEntropy([0, 0, 1, 1], 4), 0.5);
});
