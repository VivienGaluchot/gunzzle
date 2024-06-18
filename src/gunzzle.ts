/**
 * Gunzzle solver
 */

import * as algo from "./lib/algo.ts";
import * as cube from "./puzzle/cube.ts";
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
    const ARG_MAP_SEARCH = {
        "bruteforce": algo.bruteForceSearch,
        "random": algo.randomSearch,
        "darwin": algo.darwinSearch,
    };

    function showUsage() {
        console.log(`gunzzle.ts -s ${mapKeys(ARG_MAP_SEARCH)}`);
        console.log(``);
        console.log(`   required:`);
        console.log(`      -s/--search ${mapKeys(ARG_MAP_SEARCH)}`);
        console.log(`         search algo`);
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
        string: ["search", "dir"],
        alias: { "s": "search", "d": "dir", "h": "help" },
    });

    if (flags.help) {
        showUsage();
        Deno.exit(0);
    }

    return {
        dir: flags.dir,
        userAlgo: mapValueRequired(ARG_MAP_SEARCH, requiredArg(flags.search, showUsage), showUsage),
    };
}

// Main

async function main(): Promise<number> {
    const { dir, userAlgo } = getArgs();

    const template = cube.getTemplate();
    const symmetries = template.getOneSolutionPuzzle().countPermutations().valid;

    await userAlgo(template, 3, async (instance, counts) => {
        const valid = counts.valid / symmetries;
        const almost = Math.round(10 * counts.almost / symmetries) / 10;
        console.log("---");
        console.log(`${valid} x ${almost}`);
        console.log(instance.toString());
        console.log("---");
        if (dir) {
            await Deno.writeFile(
                `${dir}/${valid}x${almost}.txt`,
                new TextEncoder().encode(instance.toString()),
            );
        }
    });

    return 0;
}

Deno.exit(await main());
