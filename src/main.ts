import * as template from "./lib/template.ts";
import * as _instance from "./lib/instance.ts";

const s00 = new template.ValSlot("a");
const s01 = new template.ValSlot("b");
const s10 = new template.ValSlot("c");
const s20 = new template.ValSlot("d");

const p1 = new template.Piece([s00, s01]);
const p2 = new template.Piece([new template.RefSlot(s01), s10]);
const p3 = new template.Piece([new template.RefSlot(s10), s20]);

const puzzle = new template.Puzzle([p1, p2, p3]);

console.log(puzzle.toString());
