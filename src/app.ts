"use strict"

import * as Puzzle from './lib/puzzle.js';

async function execWithFormData(formData: FormData) {
    function getIntProp(name: string): number {
        if (!formData.has(name)) {
            throw new Error(`form property ${name} missing`);
        }
        let prop = Number(formData.get(name));
        if (!Number.isFinite(prop)) {
            throw new Error(`form property ${name} is non finite: ${prop}`);
        }
        if (!Number.isInteger(prop)) {
            throw new Error(`form property ${name} is not an integer: ${prop}`);
        }
        return Number(prop);
    }

    let rows = getIntProp("row_count");
    let cols = getIntProp("col_count");
    let fragments = getIntProp("fragment_count");
    let solutions = await Puzzle.generate(rows, cols, fragments);

    console.info(`${solutions.length} solution found for ${rows} ${cols} ${fragments}`);
}


async function formSubmit(event: Event) {
    let toEnable = new Set<HTMLButtonElement | HTMLInputElement>();
    console.info("run...");
    try {
        let el = event.target;
        if (!(el instanceof HTMLFormElement)) {
            throw new Error(`element is not a form ${el}`);
        }
        let data = new FormData(el);
        for (let child of el.querySelectorAll("button, input")) {
            if (child instanceof HTMLButtonElement || child instanceof HTMLInputElement) {
                if (!child.disabled) {
                    toEnable.add(child);
                    child.disabled = true;
                }
            }
        }
        await execWithFormData(data);
    } catch (error) {
        console.error("execution failed", error);
    } finally {
        for (let el of toEnable) {
            el.disabled = false;
        }
    }
    return false;
}


// bind

for (let el of document.getElementsByClassName("gen-form")) {
    el.addEventListener('submit', formSubmit);
}