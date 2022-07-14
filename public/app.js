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
function execWithFormData(formData, output, cancelBtn) {
    return __awaiter(this, void 0, void 0, function* () {
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
        info.innerText = `starting ...`;
        let worker = new Worker("worker.js", { type: "module" });
        let promise = new Promise((resolve, reject) => {
            cancelBtn.onclick = () => {
                resolve(null);
            };
            worker.onmessage = (event) => {
                count++;
                info.innerText = `${count} solution found for ${rows} ${cols} ${fragments} ...`;
                let data = event.data;
                if (data == null) {
                    resolve(null);
                }
                else {
                    let sol = Puzzle.Solution.fromObj(data);
                    output.appendChild(sol.render());
                }
            };
            worker.onerror = (event) => {
                console.error("Worker error", event);
                reject(event);
            };
        }).then(() => {
            cancelBtn.disabled = true;
            worker.terminate();
            info.innerText = `${count} solution found for ${rows} ${cols} ${fragments}`;
        });
        cancelBtn.disabled = false;
        worker.postMessage({ rows, cols, fragments });
        return promise;
    });
}
function formSubmit(el, runBtn) {
    return __awaiter(this, void 0, void 0, function* () {
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
            let cancel = checkBtn(document.getElementById("btn-cancel"));
            yield execWithFormData(data, output, cancel);
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
    });
}
// bind
const runBtn = checkBtn(document.getElementById("btn-run"));
runBtn.onclick = () => {
    for (let el of document.getElementsByClassName("gen-form")) {
        formSubmit(el, runBtn);
    }
};
