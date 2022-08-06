"use strict"

// TODO
// - Start generation based on JSON import

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

function exportJson(filename: string, obj: any) {
    const blob = [JSON.stringify(obj, null, 4)];
    const file = new File(blob, filename, {
        type: 'application/json',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(file);
    link.hidden = true;
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

async function importJson() {
    let fileInput = document.createElement("input");
    fileInput.type = 'file';
    fileInput.hidden = true;
    document.body.appendChild(fileInput);
    return new Promise((resolve, reject) => {
        let readFile = (e: any) => {
            let file = e.target.files[0];
            if (!file) {
                reject();
            }
            let reader = new FileReader();
            reader.onload = () => {
                resolve(JSON.parse(reader.result!.toString()));
            }
            reader.onerror = reject;
            reader.readAsText(file);
        }
        fileInput.onchange = readFile;
        fileInput.click();
    }).finally(() => {
        document.body.removeChild(fileInput);
    });
}

// Elements

const modeSelect = checkSelect(document.getElementById("gen-mode"));

const runBtn = checkBtn(document.getElementById("btn-run"));
const cancelBtn = checkBtn(document.getElementById("btn-cancel"));

const selectOutput = checkNonNull(document.getElementById("select-output"));
const selectPreset = checkSelect(document.getElementById("select-preset"));
const importBtn = checkBtn(document.getElementById("btn-select-import"));
const exportBtn = checkBtn(document.getElementById("btn-select-export"));

const progressBar = checkNonNull(document.getElementById("gen-progress"));
const progressLabel = checkNonNull(document.getElementById("gen-progress-label"));
const remTimeLabel = checkNonNull(document.getElementById("gen-rem-time-label"));
const genOutput = checkNonNull(document.getElementById("gen-output"));
const genInfo = checkNonNull(document.getElementById("gen-info"));


// Selected

let selected: Puzzle.Solution | null = null;

function setSelected(sol: Puzzle.Solution) {
    rmChildren(selectOutput);
    selectOutput.appendChild(sol.render());
    selected = sol;
}

importBtn.onclick = async () => {
    let obj = await importJson();
    let sol = Puzzle.Solution.import(obj as Puzzle.ExternalFormat);
    setSelected(sol);
}

exportBtn.onclick = () => {
    if (selected) {
        const filename = `${selected.matrix.rows}x${selected.matrix.cols}(${selected.matrix.links}) ${selected.statsString()}.json`;
        exportJson(filename, selected.export());
    }
}

selectPreset.onchange = async () => {
    let selected = selectPreset.options[selectPreset.selectedIndex];
    let path = selected.dataset.importPath;
    if (path) {
        console.log("load preset at path", path);
        let response = await fetch(path);
        let obj = await response.json();
        // TODO offload stat computation to worker
        let sol = Puzzle.Solution.import(obj as Puzzle.ExternalFormat);
        setSelected(sol);
    }
}


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
                    let el = sol.render();
                    el.onclick = () => {
                        setSelected(sol);
                    };
                    genOutput.insertBefore(el, genOutput.firstChild);
                    count++;
                    showTitle(true, sol.statsString());
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