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

function getIntProp(formData: FormData, name: string): number {
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

// Elements

const modeSelect = checkSelect(document.getElementById("gen-mode"));

const runBtn = checkBtn(document.getElementById("btn-run"));
const cancelBtn = checkBtn(document.getElementById("btn-cancel"));

const importBtn = checkBtn(document.getElementById("btn-select-import"));
const exportBtn = checkBtn(document.getElementById("btn-select-export"));
const clearBtn = checkBtn(document.getElementById("btn-select-clear"));

const progressBar = checkNonNull(document.getElementById("gen-progress"));
const progressLabel = checkNonNull(document.getElementById("gen-progress-label"));
const remTimeLabel = checkNonNull(document.getElementById("gen-rem-time-label"));
const genOutput = checkNonNull(document.getElementById("gen-output"));
const genInfo = checkNonNull(document.getElementById("gen-info"));


// Generation

async function execWithFormData(genMode: Puzzle.GenMode, formData: FormData) {

    // info

    let titleInfo = "";

    function showTitle(isRunning: boolean, solution: string | null) {
        if (solution) {
            titleInfo = solution;
        }
        if (isRunning) {
            document.title = `${BASE_TITLE} | ⌛ ${titleInfo}`;
        } else {
            document.title = `${BASE_TITLE} | ${titleInfo}`;
        }
    }

    function showInfo(infoState: string) {
        genInfo.innerText = infoState;
    }

    // progress

    let launchTimeInMs = Date.now();

    function setProgressPercent(progress: number) {
        let remTimeInMs = 0;
        if (progress != 0) {
            let dt = Date.now() - launchTimeInMs;
            let etaInMs = dt * (100 / progress);
            remTimeInMs = etaInMs - dt;
        }
        let remTimeInMin = remTimeInMs / 60000;
        progressBar.setAttribute("value", progress.toString());
        progressLabel.innerText = `${progress.toFixed(1)} %`;
        remTimeLabel.innerText = `${remTimeInMin.toFixed(1)} min left`;
    }

    function setPendingProgress(isDone: boolean) {
        if (!isDone) {
            progressBar.removeAttribute("value");
        } else {
            progressBar.setAttribute("value", "0");
        }
        progressLabel.innerText = ``;
        remTimeLabel.innerText = ``;
    }

    // main

    const rows = getIntProp(formData, "row_count");
    const cols = getIntProp(formData, "col_count");
    const links = getIntProp(formData, "link_count");
    const validCountCutoff = getIntProp(formData, "valid_count_cutoff");
    const targetUnique = formData.has("target_unique");
    const isProgressAvailable = genMode == Puzzle.GenMode.BruteForce;

    rmChildren(genOutput);
    rmChildren(genInfo);
    let count = 0;
    showTitle(true, "");
    showInfo("Running ...");

    if (genMode == Puzzle.GenMode.BruteForce) {
        setProgressPercent(0);
    } else {
        setPendingProgress(false);
    }

    let worker = new Worker("worker.js", { type: "module" });
    let promise = new Promise((resolve, reject) => {
        worker.onmessage = (event) => {
            let data: Puzzle.GenOutput = event.data;
            if (data == null) {
                resolve("success");
            } else {
                if (data.sol) {
                    let sol = Puzzle.Solution.deserialize(data.sol);
                    genOutput.insertBefore(sol.render(), genOutput.firstChild);
                    count++;
                    showTitle(true, Puzzle.statsToString(sol.stats));
                    if (genOutput.children.length > 100) {
                        genOutput.lastChild?.remove();
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
        cancelBtn.onclick = () => {
            resolve("canceled");
        };
    }).then((state) => {
        if (isProgressAvailable) {
            setProgressPercent(100);
        }
        showInfo(`Done, ${state}`)
    }).catch((reason) => {
        showInfo(`Error, ${reason}`);
    }).finally(() => {
        worker.terminate();
        showTitle(false, null);;
        cancelBtn.disabled = true;
        cancelBtn.onclick = null;
        if (!isProgressAvailable) {
            setPendingProgress(true);
        }
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

function getMode(modeSelect: HTMLSelectElement) {
    if (modeSelect.value == "brt") {
        return Puzzle.GenMode.BruteForce;
    } else if (modeSelect.value == "gen") {
        return Puzzle.GenMode.Genetic;
    } else {
        throw new Error(`mode value invalid: ${modeSelect.value}`);
    }
}


// Form

async function formSubmit(el: Element, runBtn: HTMLButtonElement, modeSelect: HTMLSelectElement) {
    let toEnable = new Set<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>();
    console.info("run...");
    try {
        runBtn.disabled = true;
        modeSelect.disabled = true;
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
        await execWithFormData(getMode(modeSelect), data);
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