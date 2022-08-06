"use strict"

// TODO
// - Export to JSON
// - Start generation based on JSON import
// - Save in local storage on demand
// - 2*3 symmetry adjustment

import * as Puzzle from './lib/puzzle.js';

const BASE_TITLE = document.title;

// Utils

function checkNonNull(element: HTMLElement | null): HTMLElement {
    if (element == null) {
        throw new Error("missing element");
    }
    return element;
}

function rmChildren(element: Element) {
    while (element.firstChild != null) {
        element.firstChild.remove();
    }
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

function checkSelect(element: HTMLElement | null): HTMLSelectElement {
    if (element == null) {
        throw new Error("missing element");
    }
    if (!(element instanceof HTMLSelectElement)) {
        throw new Error("wrong element type");
    }
    return element;
}

// Generation

async function execWithFormData(genMode: Puzzle.GenMode, formData: FormData, output: Element, info: HTMLElement) {
    let cancelBtn = checkBtn(document.getElementById("btn-cancel"));
    let progressBar = checkNonNull(document.getElementById("gen-progress"));
    let progressLabel = checkNonNull(document.getElementById("gen-progress-label"));
    let remTimeLabel = checkNonNull(document.getElementById("gen-rem-time-label"));

    // info

    let infoSolution = "";

    function showTitle(isRunning: boolean, solution: string | null) {
        if (solution) {
            infoSolution = solution;
        }
        if (isRunning) {
            document.title = `${BASE_TITLE} | ⌛ ${infoSolution}`;
        } else {
            document.title = `${BASE_TITLE} | ${infoSolution}`;
        }
    }

    function showInfo(infoState: string) {
        info.innerText = infoState;
    }

    // progress

    let launchTimeInMs = 0;

    function setProgressPercent(progress: number) {
        let remTimeInMs = 0;
        if (progress == 0) {
            launchTimeInMs = Date.now();
        } else {
            let dt = Date.now() - launchTimeInMs;
            let etaInMs = dt * (100 / progress);
            remTimeInMs = etaInMs - dt;
        }
        let remTimeInMin = remTimeInMs / 60000;
        progressBar.setAttribute("value", progress.toString());
        progressLabel.innerText = `${progress.toFixed(1)} %`;
        remTimeLabel.innerText = `${remTimeInMin.toFixed(1)} min left`;
    }

    function setProgress(isDone: boolean) {
        if (!isDone) {
            progressBar.removeAttribute("value");
        } else {
            progressBar.setAttribute("value", "0");
        }
        progressLabel.innerText = `-`;
        remTimeLabel.innerText = `-`;
    }

    // form utils

    function getStrProp(name: string): string {
        if (!formData.has(name)) {
            throw new Error(`form property ${name} missing`);
        }
        return formData.get(name)!.toString();
    }

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

    // main

    let rows = getIntProp("row_count");
    let cols = getIntProp("col_count");
    let links = getIntProp("link_count");
    let validCountCutoff = getIntProp("valid_count_cutoff");
    let targetUnique = formData.has("target_unique");

    let isProgressAvailable = genMode == Puzzle.GenMode.BruteForce;
    rmChildren(output);
    let count = 0;
    showTitle(true, "");
    showInfo("Running ...");

    if (genMode == Puzzle.GenMode.BruteForce) {
        setProgressPercent(0);
    } else {
        setProgress(false);
    }

    let worker = new Worker("worker.js", { type: "module" });
    let promise = new Promise((resolve, reject) => {
        cancelBtn.onclick = () => {
            worker.terminate();
            if (!isProgressAvailable) {
                setProgress(true);
            }
            resolve("canceled");
        };
        worker.onmessage = (event) => {
            let data: Puzzle.GenOutput = event.data;
            if (data == null) {
                if (isProgressAvailable) {
                    setProgressPercent(100);
                } else {
                    setProgress(true);
                }
                worker.terminate();
                resolve("success");
            } else {
                if (data.sol) {
                    let sol = Puzzle.Solution.deserialize(data.sol);
                    output.insertBefore(sol.render(), output.firstChild);
                    count++;
                    showTitle(true, Puzzle.statsToString(sol.stats));
                    if (count > 100) {
                        output.lastChild?.remove();
                    }
                }
                if (isProgressAvailable && data.progress) {
                    setProgressPercent(data.progress * 100);
                }
                if (data.rate) {
                    console.log("Rate", data.rate, "/ sec");
                }
                if (data.tiltCount) {
                    showInfo(`Running ... ${data.tiltCount} tilts`);
                }
            }
        };
        worker.onerror = (event) => {
            console.error("worker error", event);
            reject("worker error");
        };
    }).then((state) => {
        showTitle(false, null);
        showInfo(`Done, ${state}`);
        cancelBtn.disabled = true;
    }).catch(() => {
        showTitle(false, null);
        showInfo("Error");
        cancelBtn.disabled = true;
    });
    cancelBtn.disabled = false;
    let input: Puzzle.GenInput = {
        rows: rows,
        cols: cols,
        links: links,
        mode: genMode,
        validCountCutoff: validCountCutoff,
        targetUnique: targetUnique
    };
    worker.postMessage(input);

    return promise;
}


// Gen mode

let getMode = (modeSelect: HTMLSelectElement) => {
    if (modeSelect.value == "brt") {
        return Puzzle.GenMode.BruteForce;
    } else if (modeSelect.value == "gen") {
        return Puzzle.GenMode.Genetic;
    } else {
        throw new Error(`mode value invalid: ${modeSelect.value}`);
    }
};


// Form

async function formSubmit(el: Element, runBtn: HTMLButtonElement, modeSelect: HTMLSelectElement) {
    let toEnable = new Set<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>();
    console.info("run...");
    try {
        runBtn.disabled = true;
        modeSelect.disabled = true;
        let output = checkNonNull(document.getElementById("gen-output"));
        rmChildren(output);
        let info = checkNonNull(document.getElementById("gen-info"));
        rmChildren(info);

        if (!(el instanceof HTMLFormElement)) {
            throw new Error(`element is not a form ${el}`);
        }
        let data = new FormData(el);
        for (let child of el.querySelectorAll("button, input, select")) {
            if (child instanceof HTMLInputElement || child instanceof HTMLSelectElement) {
                if (!child.disabled) {
                    toEnable.add(child);
                    child.disabled = true;
                }
            }
        }
        await execWithFormData(getMode(modeSelect), data, output, info);
        console.info("done");
    } catch (error) {
        console.error("execution failed", error);
    } finally {
        for (let el of toEnable) {
            el.disabled = false;
        }
        runBtn.disabled = false;
        modeSelect.disabled = false;
    }
}

// Bind

const modeSelect = checkSelect(document.getElementById("gen-mode"));
const runBtn = checkBtn(document.getElementById("btn-run"));
const importBtn = checkBtn(document.getElementById("btn-select-import"));
const exportBtn = checkBtn(document.getElementById("btn-select-export"));
const clearBtn = checkBtn(document.getElementById("btn-select-clear"));


let onGenModeUpdate = () => {
    let setHidden = (cls: string, isHidden: boolean) => {
        for (let el of document.getElementsByClassName(cls)) {
            if (el instanceof HTMLElement) {
                el.hidden = isHidden;
            }
        }
    }
    let mode = getMode(modeSelect);
    if (mode == Puzzle.GenMode.BruteForce) {
        setHidden("gen-only", true);
        setHidden("brt-only", false);
    }
    if (mode == Puzzle.GenMode.Genetic) {
        setHidden("gen-only", false);
        setHidden("brt-only", true);
    }
};

modeSelect.onchange = onGenModeUpdate;
onGenModeUpdate();

runBtn.onclick = () => {
    for (let el of document.getElementsByClassName("gen-form")) {
        formSubmit(el, runBtn, modeSelect);
    }
};