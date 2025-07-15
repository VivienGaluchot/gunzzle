/**
 * Gunzzle solver
 */

import * as algo from "./lib/algo.ts";
import * as cube from "./puzzle/cube.ts";
import * as triangle4 from "./puzzle/triangle4.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";

// CLI helpers

function mapKeys<T>(args: Record<string, T>) {
    return `{${Object.keys(args).join(" ")}}`;
}

function requiredArg<T>(value: T | undefined, showUsage: () => void): T {
    if (value == undefined) {
        showUsage();
        Deno.exit(1);
    }
    return value;
}

function intArg(value: string, showUsage: () => void): number {
    const x = Number(value);
    if (Number.isFinite(x)) {
        return x;
    } else {
        showUsage();
        Deno.exit(1);
    }
}

function mapValueRequired<T>(
    args: Record<string, T>,
    key: string,
    showUsage: () => void,
): T {
    const value = args[key];
    if (value) {
        return value;
    } else {
        showUsage();
        Deno.exit(1);
    }
}

// CLI args

function getArgs() {
    const ARG_TEMPLATE = {
        "cube": cube.getTemplate,
        "triangle4": triangle4.getTemplate,
    };

    const ARG_MAP_SEARCH = {
        "bruteforce": algo.bruteForceSearch,
        "random": algo.randomSearch,
        "darwin": algo.darwinSearch,
    };

    function showUsage() {
        console.log(`gunzzle.ts -s ${mapKeys(ARG_MAP_SEARCH)}`);
        console.log(``);
        console.log(`   required:`);
        console.log(`      -t/--template ${mapKeys(ARG_TEMPLATE)}`);
        console.log(`         template`);
        console.log(`      -s/--search ${mapKeys(ARG_MAP_SEARCH)}`);
        console.log(`         search algo`);
        console.log(`      -n/--slot_number X`);
        console.log(`         number of slot to use for search`);

        console.log(``);
        console.log(`   optional:`);
        console.log(`      -d/--dir <dir>`);
        console.log(`         store solutions in specified directory`);
        console.log(``);
        console.log(`      -h/--help`);
        console.log(`         show help`);
    }

    const flags = parseArgs(Deno.args, {
        boolean: ["help"],
        string: ["search", "dir", "template", "slot_number"],
        alias: { "s": "search", "t": "template", "n": "slot_number", "d": "dir", "h": "help" },
    });

    if (flags.help) {
        showUsage();
        Deno.exit(0);
    }

    return {
        dir: flags.dir,
        templateName: requiredArg(flags.template, showUsage),
        getTemplate: mapValueRequired(
            ARG_TEMPLATE,
            requiredArg(flags.template, showUsage),
            showUsage,
        ),
        userAlgo: mapValueRequired(ARG_MAP_SEARCH, requiredArg(flags.search, showUsage), showUsage),
        slotNumber: intArg(requiredArg(flags.slot_number, showUsage), showUsage),
    };
}

// Main

async function main(): Promise<number> {
    const { dir, templateName, getTemplate, userAlgo, slotNumber } = getArgs();

    const template = getTemplate();
    const symmetries = template.getOneSolutionPuzzle().countPermutations().valid;

    let prevFilePath: string | undefined = undefined;
    await userAlgo(template, slotNumber, async (instance, counts) => {
        const valid = counts.valid / symmetries;
        const almost = Math.round(10 * counts.almost / symmetries) / 10;
        console.log("---");
        console.log(`${valid} x ${almost}`);
        console.log(instance.toString());
        console.log("---");
        if (dir) {
            const filePath = `${dir}/${templateName}-${valid}x${almost}.txt`;
            try {
                // TODO
                // normalize the instance (swap ids for reproducibility)
                // print in nice output
                await Deno.writeFile(filePath, new TextEncoder().encode(instance.toString()), {
                    createNew: true,
                });
            } catch (err) {
                console.error("failed to write", err);
            }
            if (prevFilePath != undefined) {
                await Deno.remove(prevFilePath);
            }
            prevFilePath = filePath;
        }
    });

    return 0;
}

Deno.exit(await main());
