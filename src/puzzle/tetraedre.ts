/**
 * Tetraedre puzzle
 *
 * # Template
 *
 * Piece
 *
 * ```
 *      -
 *    /   \
 *   1  x  2
 *  /       \
 *  --- 0 ---
 * ```
 *
 * Puzzle
 *
 * ```
 *                -
 *              /   \
 *             a  1  b
 *            /       \
 *            --- c ---
 *
 *            --- c*---
 *     -      \       /      -
 *   /   \     f* 3  g     /   \
 *  a* 2  f     \   /     g* 4  b*
 * /       \      -      /       \
 * --- e ---             --- e* ---
 * ```
 */

import * as tmp from "../lib/template.ts";

export function getTemplate(): tmp.Puzzle<4, 3> {
    const sA = new tmp.ValSlot("a");
    const rA = new tmp.RefSlot(sA);
    const sB = new tmp.ValSlot("b");
    const rB = new tmp.RefSlot(sB);
    const sC = new tmp.ValSlot("c");
    const rC = new tmp.RefSlot(sC);
    const sE = new tmp.ValSlot("e");
    const rE = new tmp.RefSlot(sE);
    const sF = new tmp.ValSlot("f");
    const rF = new tmp.RefSlot(sF);
    const sG = new tmp.ValSlot("g");
    const rG = new tmp.RefSlot(sG);

    const trs: tmp.Transformations<3> = [
        [0, 1, 2],
        [1, 2, 0],
        [2, 0, 1],
        [0, 2, 1],
        [2, 1, 0],
        [1, 0, 2],
    ];

    // no transform on first piece to reduce the number of symetries found
    const p1 = new tmp.Piece([sC, sA, sB]).withTransformations([[0, 1, 2]]);
    const p2 = new tmp.Piece([sE, rA, sF]).withTransformations(trs);
    const p3 = new tmp.Piece([rC, sG, rF]).withTransformations(trs);
    const p4 = new tmp.Piece([rE, rG, rB]).withTransformations(trs);

    return new tmp.Puzzle([p1, p2, p3, p4], "");
}

//-------------------------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------------------------

import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";

Deno.test("Puzzle.countPermutations", () => {
    const template = getTemplate();
    // best value without first piece transform omptimization
    const a = template.toInstance([[-3, -2, -1], [-3, 2, 3], [3, 1, -3], [3, -1, 1]]);
    // best value with first piece transform omptimization
    const b = template.toInstance([[-3, -2, 2], [-3, 2, 3], [3, -1, -3], [3, 1, -2]]);
    assertEquals(a.countPermutations(), b.countPermutations());
});
