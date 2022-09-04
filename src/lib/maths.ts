"use strict"


// Public

class Vector {
    x: number;
    y: number;

    static center(a: Vector, b: Vector): Vector {
        return b.subtract(a).scaleInPlace(1 / 2).addInPlace(a);
    }

    static up(): Vector {
        return new Vector(0, 1);
    }

    static down(): Vector {
        return new Vector(0, -1);
    }

    constructor(x: number, y: number) {
        checkIsFinite(x);
        checkIsFinite(y);
        this.x = x;
        this.y = y;
    }

    set(x: number, y: number) {
        checkIsFinite(x);
        checkIsFinite(y);
        this.x = x;
        this.y = y;
    }

    equal(other: Vector) {
        return this.x == other.x && this.y == other.y;
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    addInPlace(v: Vector) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    add(v: Vector) {
        return this.clone().addInPlace(v);
    }

    subtractInPlace(v: Vector) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    subtract(v: Vector) {
        return this.clone().subtractInPlace(v);
    }

    scaleInPlace(a: number) {
        this.x *= a;
        this.y *= a;
        return this;
    }

    scale(a: number) {
        return this.clone().scaleInPlace(a);
    }

    norm() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        return this.clone().normalizeInPlace();
    }

    normalizeInPlace() {
        let r = 1 / this.norm();
        checkIsFinite(r);
        return this.scaleInPlace(r);
    }

    squareDist(v: Vector) {
        let dx = this.x - v.x;
        let dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    dist(v: Vector) {
        return Math.sqrt(this.squareDist(v));
    }

    dotProduct(v: Vector) {
        return this.x * v.x + this.y * v.y;
    }

    crossProduct(v: Vector) {
        return this.x * v.y - this.y * v.x;
    }

    angleWith(v: Vector) {
        let x = Math.atan2(this.crossProduct(v), this.dotProduct(v));
        checkIsFinite(x);
        return x;
    }

    rotateInPlace(a: number) {
        let c = Math.cos(a);
        let s = Math.sin(a);
        let x2 = c * this.x - s * this.y;
        let y2 = s * this.x + c * this.y;
        this.set(x2, y2);
        return this;
    }

    rotate(a: number) {
        return this.clone().rotateInPlace(a);
    }
}

class Rect {
    // min x y position
    pos: Vector;
    size: Vector;

    constructor(pos: Vector, size: Vector) {
        this.pos = pos;
        this.size = size;
    }

    equal(other: Rect) {
        return this.pos.equal(other.pos) && this.size.equal(other.size);
    }

    clone() {
        return new Rect(this.pos.clone(), this.size.clone());
    }

    center() {
        return this.size.scale(0.5).addInPlace(this.pos);
    }

    minX() {
        return this.pos.x;
    }

    maxX() {
        return this.pos.x + this.size.x;
    }

    minY() {
        return this.pos.y;
    }

    maxY() {
        return this.pos.y + this.size.y;
    }

    topLeft() {
        return new Vector(0, this.size.y).addInPlace(this.pos);
    }

    topRight() {
        return this.size.add(this.pos);
    }

    bottomLeft() {
        return this.pos;
    }

    bottomRight() {
        return new Vector(this.size.x, 0).addInPlace(this.pos);
    }

    top() {
        return Vector.center(this.topLeft(), this.topRight());
    }

    right() {
        return Vector.center(this.bottomRight(), this.topRight());
    }

    bottom() {
        return Vector.center(this.bottomLeft(), this.bottomRight());
    }

    left() {
        return Vector.center(this.topLeft(), this.topLeft());
    }

    translateInPlace(v: Vector) {
        this.pos.addInPlace(v);
        return this;
    }

    translate(v: Vector) {
        return this.clone().translateInPlace(v);
    }

    contains(p: Vector) {
        return p.x >= this.minX() && p.x <= this.maxX() && p.y >= this.minY() && p.y <= this.maxY();
    }

    isIntersecting(r: Rect) {
        let interX = (this.minX() <= r.maxX()) && (r.minX() <= this.maxX());
        let interY = (this.minY() <= r.maxY()) && (r.minY() <= this.maxY());
        return interX && interY;
    }

    intersection(r: Rect): Rect | null {
        if (this.isIntersecting(r)) {
            let minX = Math.max(this.minX(), r.minX());
            let minY = Math.max(this.minY(), r.minY());
            let maxX = Math.min(this.maxX(), r.maxX());
            let maxY = Math.min(this.maxY(), r.maxY());
            return new Rect(new Vector(minX, minY), new Vector(maxX - minX, maxY - minY));
        } else {
            return null;
        }
    }
}

function swipe(x: number, a: number, b: number, va: number, vb: number): number {
    let r = (vb - va) / (b - a);
    let v0 = va - (r * a);
    return v0 + r * x;
}

function checkIsFinite(n: number) {
    if (!Number.isFinite(n)) {
        throw new Error("invalid number");
    }
}

// Output in [min; max[
function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function shuffle(array: any[]) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

class RNG {
    m: number;
    a: number;
    c: number;
    state: number;

    constructor(seed: number) {
        // LCG using GCC's constants
        this.m = 0x80000000; // 2**31;
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }

    // returns in range [0,1]
    nextFloat() {
        return this.nextInt() / (this.m - 1);
    }

    // returns in range [start, max]: including start, including end
    // can't modulu nextInt because of weak randomness in lower bits
    nextRange(min: number, max: number) {
        var rangeSize = 1 + max - min;
        var randomUnder1 = this.nextInt() / this.m;
        return min + Math.floor(randomUnder1 * rangeSize);
    }

    shuffle(array: any[]) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = this.nextRange(0, i);
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}

export { Vector, Rect, swipe, checkIsFinite, getRandomInt, shuffle, RNG }