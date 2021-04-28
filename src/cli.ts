#!/usr/bin/env node
import yargs from "yargs";
import { URL } from "url";
import { Keypair } from "stellar-sdk";

import { run } from "./helpers/run";
import { getStats, printStats } from "./helpers/stats";
import { Config, SEP, OutputFormat, Result } from "./types";
import { printResult } from "./helpers/result";

const args = yargs
  .options({
    "home-domain": {
      alias: "h",
      requiresArg: true,
      demandOption: true,
      type: "string",
      description:
        "The home domain of the anchor. The anchor's TOML file should be present at <home-domain>/.well-known/stellar.toml. Prepends 'https://' if no protocol is specified.",
    },
    currency: {
      alias: "c",
      requiresArg: true,
      type: "string",
      description:
        "The currency to use for testing. Must match one of the CURRENCIES listed in the TOML file.",
    },
    "output-format": {
      alias: "o",
      requiresArg: true,
      default: "text",
      choices: ["text", "markdown", "json"],
      type: "string",
      description:
        "The output format to use when sending content to standard output.",
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
    "mainnet-master-account-secret": {
      alias: "m",
      type: "string",
      requiresArg: true,
      description:
        "The Stellar account to use when when funding temporary test accounts. Currently, 50XLM must be present in the account.",
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
        if (![1, 6, 10, 12, 24, 31].includes(sep))
          throw "error: invalid --sep value provided. Choices: 1, 6, 10, 12, 24, 31.";
      }
    }
    if (argv.mainnetMasterAccountSecret) {
      try {
        Keypair.fromSecret(argv.mainnetMasterAccountSecret).secret;
      } catch {
        throw "error: --mainnet-master-account-secret is not a secret key.";
      }
    }
    return true;
  }).argv;

(async () => {
  const config: Config = {
    homeDomain: args.homeDomain as string,
    seps: args.seps as SEP[],
    outputFormat: args.outputFormat as OutputFormat,
  };
  if (args.currency) config.currency = args.currency as string;
  if (args.verbose) config.verbose = args.verbose as boolean;
  if (args.mainnetMasterAccountSecret)
    config.mainnetMasterAccountSecret = args.mainnetMasterAccountSecret as string;
  const results: Result[] = [];
  for await (const result of run(config)) {
    results.push(result);
    printResult(result, "coloredText");
  }
  printStats(getStats(results), "coloredText");
})();
