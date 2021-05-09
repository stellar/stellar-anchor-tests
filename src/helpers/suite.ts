import { Networks } from "stellar-sdk";

import { Suite, Config, TestRun } from "../types";
import {
  sep1TomlSuite,
  sep24TomlSuite,
  sep31TomlSuite,
} from "../tests/sep1/tests";
import { default as sep24Suites } from "../tests/sep24/tests";
import { default as sep10Suites } from "../tests/sep10/tests";
import { makeFailure } from "./failure";

export async function* runSuite(
  suite: Suite,
  config: Config,
): AsyncGenerator<TestRun> {
  for await (const test of suite.tests) {
    try {
      if (test.before) {
        const beforeResult = await test.before(config, suite);
        if (beforeResult) {
          yield { test: test, result: beforeResult, suite: suite };
          continue;
        }
      }
      const result = await test.run(config, suite);
      if (test.after) {
        const afterResult = await test.after(config, suite);
        if (afterResult) {
          yield { test: test, result: afterResult, suite: suite };
          continue;
        }
      }
      yield { test: test, result: result, suite: suite };
    } catch (e) {
      const failure = {
        name: "unexpected exception",
        text(args: any): string {
          return (
            "An unexpected exception occurred while running:\n\n" +
            `Suite: '${suite.name}'\nTest: '${test.assertion}'\n\n` +
            `Exception message: '${args.exception}'\n\n` +
            "Please report this bug at https://github.com/stellar/stellar-anchor-tests/issues"
          );
        },
      };
      yield {
        test: test,
        result: {
          networkCalls: [],
          failure: makeFailure(failure, { exception: e.message }),
        },
        suite: suite,
      };
    }
  }
}

export function getSuites(config: Config): Suite[] {
  let suites: Suite[] = [];
  if (config.seps.includes(1)) {
    suites.push(sep1TomlSuite);
  }
  if (config.seps.includes(10)) {
    console.log("SEP-10 tests selected");
    if (config.networkPassphrase === Networks.PUBLIC) {
      // signer support tests not yet supported on pubnet
      const filteredSep10Suites = sep10Suites.filter(
        (suite: Suite) => !suite.name.includes("Account Signer Support"),
      );
      suites = suites.concat(filteredSep10Suites);
    } else {
      suites = suites.concat(sep10Suites);
    }
  }
  if (config.seps.includes(24)) {
    suites.push(sep24TomlSuite);
    suites = suites.concat(sep24Suites);
  }
  if (config.seps.includes(31)) {
    suites.push(sep31TomlSuite);
  }
  return filterBySearchStrings(suites, config);
}

function filterBySearchStrings(suites: Suite[], config: Config): Suite[] {
  if (!config.searchStrings) {
    return suites;
  }
  const filteredSuites: Suite[] = [];
  for (const suite of suites) {
    let suiteMatched = false;
    const suiteNameLower = suite.name.toLowerCase();
    for (const searchString of config.searchStrings) {
      const searchStringLower = searchString.toLowerCase();
      if (suiteNameLower.includes(searchStringLower)) {
        filteredSuites.push(suite);
        suiteMatched = true;
        break;
      }
    }
    if (suiteMatched) {
      continue;
    }
    const filteredSuite: Suite = {
      name: suite.name,
      tests: [],
    };
    if (suite.sep) filteredSuite.sep = suite.sep;
    for (const test of suite.tests) {
      const assertionLower = test.assertion.toLowerCase();
      for (const searchString of config.searchStrings) {
        const searchStringLower = searchString.toLowerCase();
        if (assertionLower.includes(searchStringLower)) {
          filteredSuite.tests.push(test);
          break;
        }
      }
    }
    if (filteredSuite.tests) {
      filteredSuites.push(filteredSuite);
    }
  }
  return filteredSuites;
}
