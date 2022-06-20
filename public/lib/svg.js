"use strict";
import * as Maths from './maths.js';
// Private
function setStyle(el, style) {
    if (style.className) {
        el.setAttribute("class", style.className);
    }
    if (style.fill) {
        el.setAttribute("fill", style.fill);
    }
    if (style.stroke) {
        el.setAttribute("stroke", style.stroke);
    }
    if (style.strokeW) {
        el.setAttribute("stroke-width", `${style.strokeW}`);
    }
    if (style.vectorEffect) {
        el.setAttribute("vector-effect", style.vectorEffect);
    }
    if (style.fontFamily) {
        el.setAttribute("font-family", style.fontFamily);
    }
    if (style.fontSize) {
        el.setAttribute("font-size", style.fontSize);
    }
    if (style.textAnchor) {
        el.setAttribute("text-anchor", style.textAnchor);
    }
}
class SvgNode {
    constructor(el) {
        this.domEl = el;
    }
    set style(value) {
        setStyle(this.domEl, value);
    }
    set rotation(value) {
        this.rotationAngle = value;
        this.transform();
    }
    set translation(value) {
        this.translateVector = value;
        this.transform();
    }
    set scale(value) {
        this.scaleVector = value;
        this.transform();
    }
    setAttribute(name, value) {
        this.domEl.setAttribute(name, value);
    }
    appendChild(el) {
        if (el instanceof SvgNode) {
            this.domEl.appendChild(el.domEl);
        }
        else {
            this.domEl.appendChild(el);
        }
    }
    removeChildren() {
        while (this.domEl.firstChild) {
            this.domEl.firstChild.remove();
        }
    }
    transform() {
        let transforms = [];
        if (this.rotationAngle) {
            transforms.push(`rotate(${this.rotationAngle.toString()})`);
        }
        if (this.translateVector) {
            transforms.push(`translate(${this.translateVector.x.toString()} ${this.translateVector.y.toString()})`);
        }
        if (this.scaleVector) {
            transforms.push(`scale(${this.scaleVector.x.toString()} ${this.scaleVector.y.toString()})`);
        }
        this.setAttribute("transform", transforms.join(" "));
    }
}
class SvgFrame extends SvgNode {
    constructor() {
        super(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
        this.setAttribute("width", "200");
        this.setAttribute("height", "200");
        this.setAttribute("preserveAspectRatio", "xMidYMid");
        this.internalSafeView = new Maths.Rect(new Maths.Vector(0, 0), new Maths.Vector(0, 0));
        this.safeView = new Maths.Rect(new Maths.Vector(-10, -10), new Maths.Vector(20, 20));
    }
    // safe area, always drawn for all aspect ratios
    set safeView(value) {
        this.internalSafeView = value;
        this.setAttribute("viewBox", `${value.pos.x} ${value.pos.x} ${value.size.x} ${value.size.y}`);
    }
    get safeView() {
        return this.internalSafeView;
    }
}
class SvgTag extends SvgNode {
    constructor(tag) {
        const svgNS = "http://www.w3.org/2000/svg";
        super(document.createElementNS(svgNS, tag));
    }
}
class Group extends SvgTag {
    constructor() {
        super("g");
    }
    set id(value) {
        this.domEl.setAttribute("id", value);
    }
}
class Line extends SvgTag {
    constructor(x1, y1, x2, y2, style) {
        super("line");
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.style = style;
    }
    set x1(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("x1", value.toString());
    }
    set y1(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("y1", value.toString());
    }
    set x2(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("x2", value.toString());
    }
    set y2(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("y2", value.toString());
    }
}
class Rect extends SvgTag {
    constructor(x, y, w, h, style) {
        super("rect");
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.style = style;
    }
    set x(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("x", value.toString());
    }
    set y(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("y", value.toString());
    }
    set w(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("width", value.toString());
    }
    set h(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("height", value.toString());
    }
}
class Circle extends SvgTag {
    constructor(x, y, r, style) {
        super("circle");
        this.x = x;
        this.y = y;
        this.r = r;
        this.style = style;
    }
    set x(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("cx", value.toString());
    }
    set y(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("cy", value.toString());
    }
    set r(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("r", value.toString());
    }
}
class Text extends SvgTag {
    constructor(text, x, y, style) {
        super("text");
        this.text = text;
        this.x = x;
        this.y = y;
        this.style = style;
    }
    set text(value) {
        this.domEl.textContent = value;
    }
    set x(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("x", value.toString());
    }
    set y(value) {
        Maths.checkIsFinite(value);
        this.setAttribute("y", value.toString());
    }
}
export { SvgNode, SvgFrame, SvgTag, Group, Line, Rect, Circle, Text };
