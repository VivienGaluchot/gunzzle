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

export function shifts<N extends number>(arr: FixedSizeArray<N, number>): FixedSizeArray<N, FixedSizeArray<N, number>> {
    const all = [];
    for (let i = 0; i < arr.length; i++) {
        const one = [];
        for (let j = 0; j < arr.length; j++) {
            one.push(assertDefined(arr[(i + j) % arr.length]));
        }
        all.push(one as FixedSizeArray<N, number>);
    }
    return all as FixedSizeArray<N, FixedSizeArray<N, number>>;
}

//-------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------

import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";
import { assertDefined, FixedSizeArray } from "./type.ts";

Deno.test("normalizedEntropy", () => {
    assertEquals(normalizedEntropy([0, 0, 0, 0], 10), 0);
    assertEquals(normalizedEntropy([1, 1, 1, 1], 10), 0);
    assertEquals(normalizedEntropy([0, 1, 2, 3], 4), 1);
    assertEquals(normalizedEntropy([0, 0, 1, 1], 4), 0.5);
});

Deno.test("shifts", () => {
    assertEquals(shifts([0, 1, 2]), [[0, 1, 2], [1, 2, 0], [2, 0, 1]]);
    assertEquals(shifts([0, 1]), [[0, 1], [1, 0]]);
});
