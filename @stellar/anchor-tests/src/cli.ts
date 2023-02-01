#!/usr/bin/env node
import yargs from "yargs";
import fs from "fs";
import path from "path";
import { URL } from "url";

import { run } from "./helpers/test";
import { getStats } from "./helpers/stats";
import { Config, SEP, TestRun } from "./types";
import { printTestRun, printStats } from "./helpers/console";

const command = yargs
  .options({
    "home-domain": {
      alias: "h",
      requiresArg: true,
      demandOption: true,
      type: "string",
      description:
        "The home domain of the anchor. The anchor's TOML file should be present at <home-domain>/.well-known/stellar.toml. Prepends 'https://' if no protocol is specified.",
    },
    "asset-code": {
      alias: "a",
      requiresArg: true,
      type: "string",
      description:
        "The asset code to use for testing. Must match one of the CURRENCIES listed in the TOML file.",
    },
    seps: {
      alias: "s",
      type: "array",
      requiresArg: true,
      demandOption: true,
      coerce: (arg: Array<string>) => arg.map((x) => parseInt(x)),
      description: "A list of numbers corresponding to the SEPs to test.",
    },
    verbose: {
      alias: "v",
      type: "boolean",
      default: false,
      description:
        "Display the each request and response used in each failed test.",
    },
    "sep-config": {
      alias: "c",
      type: "string",
      requiresArg: true,
      description:
        "A relative or absolute file path to JSON file containing the configuration required for SEP 6, 12, & 31.",
    },
  })
  .check((argv: any) => {
    if (!argv.homeDomain.startsWith("http")) {
      argv.homeDomain = `https://${argv.homeDomain}`;
      argv.h = `https://${argv.homeDomain}`;
      argv["home-domain"] = `https://${argv.homeDomain}`;
    }
    let url;
    try {
      url = new URL(argv.homeDomain);
    } catch {
      throw "error: --home-domain is not a valid URL.";
    }
    if (`${url.protocol}//${url.host}/` !== url.toString()) {
      throw "error: --home-domain includes protocol, hostname, and port.";
    }
    if (argv.seps) {
      for (const sep of argv.seps) {
        if (![1, 6, 10, 12, 24, 31, 38, 381].includes(sep))
          throw "error: invalid --sep value provided. Choices: 1, 6, 10, 12, 24, 31, 38, 381 for 38v1.6.1.";
      }
      if (
        (argv.seps.includes(6) ||
          argv.seps.includes(12) ||
          argv.seps.includes(31) ||
          argv.seps.includes(38) ||
          argv.seps.includes(381)) &&
        !argv.sepConfig
      ) {
        throw "error: SEP 6, 12, 31 ,38 & 381 (38 v1.6.1) require a configuration file (--sep-config, -c)";
      }
    }
    return true;
  });

let args = command.argv;

(async () => {
  const config: Config = {
    homeDomain: args.homeDomain as string,
    seps: args.seps as SEP[],
  };
  if (args._.length) config.searchStrings = args._.map(String);
  if (args.assetCode) config.assetCode = args.assetCode as string;
  if (args.verbose) config.verbose = args.verbose as boolean;
  if (args.sepConfig) {
    if (!path.isAbsolute(args.sepConfig as string)) {
      args.sepConfig = path.resolve(args.sepConfig as string);
    }
    if (!fs.existsSync(args.sepConfig as string)) {
      yargs.showHelp();
      console.error(
        "\nerror: the file specified with --sep-config does not exist",
      );
      process.exit(1);
      return;
    }
    let sepConfigObj: any;
    try {
      sepConfigObj = JSON.parse(
        fs.readFileSync(args.sepConfig as string).toString(),
      );
    } catch {
      yargs.showHelp();
      console.error(
        "\nerror: --sep-config JSON file contents could not be parsed",
      );
      process.exit(1);
      return;
    }
    config.sepConfig = sepConfigObj;
  }
  const startTime = Date.now();
  const testRuns: TestRun[] = [];
  try {
    for await (const testRun of run(config)) {
      testRuns.push(testRun);
      await printTestRun(testRun, config.verbose as boolean);
    }
  } catch (e) {
    yargs.showHelp();
    console.error(`\n${e.name}: ${e.message}`);
    process.exit(1);
    return;
  }
  const endTime = Date.now();
  console.log(); // add new line between results and stats
  const stats = getStats(testRuns);
  printStats(stats, startTime, endTime);
  if (stats.failed > 0) process.exit(1);
})();
