"use strict"

import * as Maths from './maths.js';


// Private

function setStyle(el: Element, style: SvgStyle) {
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
}


// Public

interface SvgStyle {
    className?: string;
    fill?: string;
    stroke?: string;
    strokeW?: string | number;
    vectorEffect?: string;
    fontFamily?: string;
    fontSize?: string;
}

class SvgNode {
    domEl: SVGElement | HTMLElement;
    rotationAngle?: number;
    translateVector?: Maths.Vector;
    scaleVector?: Maths.Vector;

    constructor(el: SVGElement | HTMLElement) {
        this.domEl = el;
    }

    set style(value: SvgStyle) {
        setStyle(this.domEl, value);
    }

    set rotation(value: number) {
        this.rotationAngle = value;
        this.transform();
    }

    set translation(value: Maths.Vector) {
        this.translateVector = value;
        this.transform();
    }

    set scale(value: Maths.Vector) {
        this.scaleVector = value;
        this.transform();
    }

    setAttribute(name: string, value: string) {
        this.domEl.setAttribute(name, value);
    }

    appendChild(el: SvgNode | Element) {
        if (el instanceof SvgNode) {
            this.domEl.appendChild(el.domEl);
        } else {
            this.domEl.appendChild(el);
        }
    }

    removeChildren() {
        while (this.domEl.firstChild) {
            this.domEl.firstChild.remove();
        }
    }

    private transform() {
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
    // safe area, always drawn for all aspect ratios
    internalSafeView: Maths.Rect;

    constructor() {
        super(document.createElementNS("http://www.w3.org/2000/svg", "svg"));

        this.setAttribute("width", "200");
        this.setAttribute("height", "200");

        this.setAttribute("preserveAspectRatio", "xMidYMid");

        this.internalSafeView = new Maths.Rect(new Maths.Vector(0, 0), new Maths.Vector(0, 0));
        this.safeView = new Maths.Rect(new Maths.Vector(-10, -10), new Maths.Vector(20, 20));
    }

    // safe area, always drawn for all aspect ratios
    set safeView(value: Maths.Rect) {
        this.internalSafeView = value;
        this.setAttribute("viewBox", `${value.pos.x} ${value.pos.x} ${value.size.x} ${value.size.y}`);
    }

    get safeView(): Maths.Rect {
        return this.internalSafeView;
    }
}

class SvgTag extends SvgNode {
    constructor(tag: string) {
        const svgNS = "http://www.w3.org/2000/svg";
        super(document.createElementNS(svgNS, tag));
    }
}

class Group extends SvgTag {
    constructor() {
        super("g");
    }

    set id(value: string) {
        this.domEl.setAttribute("id", value);
    }
}

class Line extends SvgTag {
    constructor(x1: number, y1: number, x2: number, y2: number, style: SvgStyle) {
        super("line");
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.style = style;
    }

    set x1(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("x1", value.toString());
    }

    set y1(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("y1", value.toString());
    }

    set x2(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("x2", value.toString());
    }

    set y2(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("y2", value.toString());
    }
}

class Rect extends SvgTag {
    constructor(x: number, y: number, w: number, h: number, style: SvgStyle) {
        super("rect");
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.style = style;
    }

    set x(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("x", value.toString());
    }

    set y(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("y", value.toString());
    }

    set w(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("width", value.toString());
    }

    set h(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("height", value.toString());
    }
}

class Circle extends SvgTag {
    constructor(x: number, y: number, r: number, style: SvgStyle) {
        super("circle");
        this.x = x;
        this.y = y;
        this.r = r;
        this.style = style;
    }

    set x(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("cx", value.toString());
    }

    set y(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("cy", value.toString());
    }

    set r(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("r", value.toString());
    }
}

class Text extends SvgTag {
    constructor(text: string, x: number, y: number, style: SvgStyle) {
        super("text");
        this.text = text;
        this.x = x;
        this.y = y;
        this.style = style;
    }

    set text(value: string) {
        this.domEl.textContent = value;
    }

    set x(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("x", value.toString());
    }

    set y(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("y", value.toString());
    }
}


export {
    SvgStyle,
    SvgNode,
    SvgFrame,
    SvgTag,
    Group,
    Line,
    Rect,
    Circle,
    Text
}