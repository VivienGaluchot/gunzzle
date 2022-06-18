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
}


// Public

interface SvgStyle {
    className?: string;
    fill?: string;
    stroke?: string;
    strokeW?: string | number;
    vectorEffect?: string;
}

class SvgNode {
    domEl: SVGElement | HTMLElement;

    constructor(el: SVGElement | HTMLElement) {
        this.domEl = el;
    }

    set style(value: SvgStyle) {
        setStyle(this.domEl, value);
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
}

class SvgTag extends SvgNode {
    constructor(tag: string) {
        const svgNS = "http://www.w3.org/2000/svg";
        super(document.createElementNS(svgNS, tag));
        this.rotate = 0;
    }

    set rotate(value: number) {
        Maths.checkIsFinite(value);
        this.setAttribute("transform", `rotate(${value.toString()})`);
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
        this.x = y;
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


export {
    SvgStyle,
    SvgNode,
    SvgTag,
    Group,
    Line,
    Rect,
    Circle
}