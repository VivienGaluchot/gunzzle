"use strict"

import * as Puzzle from './lib/puzzle.js';

function checkNonNull(element: HTMLElement | null): HTMLElement {
    if (element == null) {
        throw new Error("missing element");
    }
    return element;
}

function checkBtn(element: HTMLElement | null): HTMLButtonElement {
    if (element == null) {
        throw new Error("missing element");
    }
    if (!(element instanceof HTMLButtonElement)) {
        throw new Error("wrong element type");
    }
    return element;
}

async function execWithFormData(formData: FormData, output: Element, cancelBtn: HTMLButtonElement) {
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

    while (output.firstChild != null) {
        output.firstChild.remove();
    }

    let count = 0;
    let info = document.createElement("div");
    info.classList.add("info");
    output.appendChild(info);
    info.innerText = `running ...`;

    let worker = new Worker("worker.js", { type: "module" });
    let promise = new Promise((resolve, reject) => {
        cancelBtn.onclick = () => {
            resolve("canceled");
        };
        worker.onmessage = (event) => {
            let data = event.data;
            if (data == null) {
                resolve("done");
                worker.terminate();
            } else {
                let sol = Puzzle.Solution.fromObj(data);
                output.appendChild(sol.render());
                count++;
                info.innerText = `${count} solutions ...`;
            }
        };
        worker.onerror = (event) => {
            console.error("worker error", event);
            reject("worker error");
        };
    }).then((state) => {
        info.innerText = `${count} solutions, ${state}`;
        cancelBtn.disabled = true;
    }).catch(() => {
        info.innerText = `${count} solutions, error`;
        cancelBtn.disabled = true;
    });
    cancelBtn.disabled = false;

    worker.postMessage({ rows, cols, fragments });

    return promise;
}


async function formSubmit(el: Element, runBtn: HTMLButtonElement) {
    let toEnable = new Set<HTMLButtonElement | HTMLInputElement>();
    console.info("run...");
    try {
        runBtn.disabled = true;
        let output = checkNonNull(document.querySelector(".gen-output"));
        while (output.firstChild != null) {
            output.firstChild.remove();
        }

        if (!(el instanceof HTMLFormElement)) {
            throw new Error(`element is not a form ${el}`);
        }
        let data = new FormData(el);
        for (let child of el.querySelectorAll("button, input")) {
            if (child instanceof HTMLInputElement) {
                if (!child.disabled) {
                    toEnable.add(child);
                    child.disabled = true;
                }
            }
        }
        let cancel = checkBtn(document.getElementById("btn-cancel"));
        await execWithFormData(data, output, cancel);
        console.info("done");
    } catch (error) {
        console.error("execution failed", error);
    } finally {
        for (let el of toEnable) {
            el.disabled = false;
        }
        runBtn.disabled = false;
    }
}


// bind

const runBtn = checkBtn(document.getElementById("btn-run"));
runBtn.onclick = () => {
    for (let el of document.getElementsByClassName("gen-form")) {
        formSubmit(el, runBtn);
    }
};
