"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as Svg from './svg.js';
import * as Maths from './maths.js';
/**
 *       tl   tr
 *       --- ---
 *  rt |         | lt
 *          x
 *  rb |         | lb
 *       --- ---
 *       bl   br
 */
var FragmentPosition;
(function (FragmentPosition) {
    FragmentPosition[FragmentPosition["TopLeft"] = 0] = "TopLeft";
    FragmentPosition[FragmentPosition["TopRight"] = 1] = "TopRight";
    FragmentPosition[FragmentPosition["RightTop"] = 2] = "RightTop";
    FragmentPosition[FragmentPosition["RightBottom"] = 3] = "RightBottom";
    FragmentPosition[FragmentPosition["BottomRight"] = 4] = "BottomRight";
    FragmentPosition[FragmentPosition["BottomLeft"] = 5] = "BottomLeft";
    FragmentPosition[FragmentPosition["LeftBottom"] = 6] = "LeftBottom";
    FragmentPosition[FragmentPosition["LeftTop"] = 7] = "LeftTop";
})(FragmentPosition || (FragmentPosition = {}));
class Piece {
    constructor() {
        this.fragments = [0, 1, 2, 3, 4, 5, 6, 7];
    }
    render() {
        let group = new Svg.Group();
        group.domEl.classList.add("piece");
        group.appendChild(new Svg.Rect(2, 2, 6, 6, { className: "piece-block" }));
        let a = 10 / 3;
        let b = 10 / 3 * 2;
        let txtPos = [
            new Maths.Vector(a, 1.5),
            new Maths.Vector(b, 1.5),
            new Maths.Vector(9, a),
            new Maths.Vector(9, b),
            new Maths.Vector(a, 9.5),
            new Maths.Vector(b, 9.5),
            new Maths.Vector(1, a),
            new Maths.Vector(1, b)
        ];
        for (let id = FragmentPosition.TopLeft; id <= FragmentPosition.LeftTop; id++) {
            let fr = this.fragments[id];
            let pos = txtPos[id];
            group.appendChild(new Svg.Text(fr.toString(), pos.x, pos.y, { className: "fragment-label" }));
        }
        return group;
    }
}
class Solution {
    constructor(rows, cols) {
        this.pieces = [];
        this.rows = rows;
        this.cols = cols;
        for (let r = 0; r < rows; r++) {
            let row = [];
            for (let c = 0; c < cols; c++) {
                row.push(new Piece());
            }
            this.pieces.push(row);
        }
    }
    render() {
        let frame = new Svg.SvgFrame();
        frame.domEl.classList.add("puzzle-solution");
        let group = new Svg.Group();
        frame.appendChild(group);
        frame.safeView = new Maths.Rect(new Maths.Vector(0, 0), new Maths.Vector(this.rows * 10, this.cols * 10));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let piece = this.pieces[r][c].render();
                piece.translation = new Maths.Vector(r * 10, c * 10);
                group.appendChild(piece);
            }
        }
        return frame.domEl;
    }
}
function generate(rows, cols, fragments) {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise(r => setTimeout(r, 50));
        return [new Solution(rows, cols)];
    });
}
export { generate };
