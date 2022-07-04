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
function execWithFormData(formData, output) {
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
        let cancel = document.createElement("button");
        cancel.classList.add("cancel-btn");
        cancel.innerText = "Cancel";
        output.appendChild(cancel);
        let count = 0;
        let info = document.createElement("div");
        info.classList.add("info");
        output.appendChild(info);
        info.innerText = `${count} solution found for ${rows} ${cols} ${fragments}`;
        let worker = new Worker("worker.js", { type: "module" });
        let promise = new Promise((resolve, reject) => {
            cancel.onclick = () => {
                resolve(null);
            };
            worker.onmessage = (event) => {
                count++;
                info.innerText = `${count} solution found for ${rows} ${cols} ${fragments}`;
                let data = event.data;
                if (data == null) {
                    resolve(null);
                }
                else {
                    let sol = Puzzle.Solution.fromObj(data);
                    console.log(sol);
                    output.appendChild(sol.render());
                }
            };
        }).then(() => {
            cancel.disabled = true;
            worker.terminate();
        });
        worker.postMessage({ rows, cols, fragments });
        return promise;
    });
}
function formSubmit(event) {
    return __awaiter(this, void 0, void 0, function* () {
        let toEnable = new Set();
        console.info("run...");
        try {
            let output = document.querySelector(".gen-output");
            if (output == null) {
                throw new Error(`output element not found`);
            }
            while (output.firstChild != null) {
                output.firstChild.remove();
            }
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
            yield execWithFormData(data, output);
            console.info("done");
        }
        catch (error) {
            console.error("execution failed", error);
        }
        finally {
            for (let el of toEnable) {
                el.disabled = false;
            }
        }
        return false;
    });
}
// bind
for (let el of document.getElementsByClassName("gen-form")) {
    el.addEventListener('submit', formSubmit);
}
