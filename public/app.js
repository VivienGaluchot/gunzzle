"use strict";
import * as Puzzle from './lib/puzzle.js';
function checkNonNull(element) {
    if (element == null) {
        throw new Error("missing element");
    }
    return element;
}
function checkBtn(element) {
    if (element == null) {
        throw new Error("missing element");
    }
    if (!(element instanceof HTMLButtonElement)) {
        throw new Error("wrong element type");
    }
    return element;
}
async function execWithFormData(formData, output) {
    let cancelBtn = checkBtn(document.getElementById("btn-cancel"));
    let progressBar = checkNonNull(document.getElementById("gen-progress"));
    let progressLabel = checkNonNull(document.getElementById("gen-progress-label"));
    function setProgressPercent(progress) {
        progressBar.setAttribute("value", progress.toString());
        progressLabel.innerText = `${progress.toFixed(1)} %`;
    }
    function getIntProp(name) {
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
    setProgressPercent(0);
    let worker = new Worker("worker.js", { type: "module" });
    let promise = new Promise((resolve, reject) => {
        cancelBtn.onclick = () => {
            worker.terminate();
            resolve("canceled");
        };
        worker.onmessage = (event) => {
            let data = event.data;
            if (data == null) {
                setProgressPercent(100);
                worker.terminate();
                resolve("done");
            }
            else {
                if (data.sol) {
                    let sol = Puzzle.Solution.deserialize(data.sol);
                    output.insertBefore(sol.render(), info.nextSibling);
                    count++;
                    info.innerText = `${count} solutions ...`;
                    if (count > 100) {
                        output.lastChild?.remove();
                    }
                }
                if (data.progress) {
                    setProgressPercent(data.progress * 100);
                }
                if (data.rate) {
                    console.log("Rate", data.rate, "/ sec");
                }
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
async function formSubmit(el, runBtn) {
    let toEnable = new Set();
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
        await execWithFormData(data, output);
        console.info("done");
    }
    catch (error) {
        console.error("execution failed", error);
    }
    finally {
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
