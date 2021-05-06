import { Suite, Config, Result } from "../types";
import { sep24TomlSuite, sep31TomlSuite } from "../tests/sep1/tests";
import { default as sep24Suites } from "../tests/sep24/tests";
import { default as sep10Suites } from "../tests/sep10/tests";
import { makeFailure } from "./failure";

export async function* runSuite(
  suite: Suite,
  config: Config,
): AsyncGenerator<Result> {
  for await (const test of suite.tests) {
    try {
      if (test.before) {
        const beforeResult = await test.before(config, suite);
        if (beforeResult) {
          yield beforeResult;
          continue;
        }
      }
      const result = await test.run(config, suite);
      if (test.after) {
        const afterResult = await test.after(config, suite);
        if (afterResult) {
          yield afterResult;
          continue;
        }
      }
      yield result;
    } catch (e) {
      const result: Result = {
        test: test,
        networkCalls: [],
        suite: suite,
        failure: makeFailure(
          {
            name: "unexpected exception",
            text(args: any): string {
              return (
                "An unexpected exception occurred while running:\n\n" +
                `Suite: '${suite.name}'\nTest: '${test.assertion}'\n\n` +
                `Exception message: '${args.exception}'\n\n` +
                "Please report this bug at https://github.com/stellar/stellar-anchor-tests/issues"
              );
            },
          },
          { exception: e.message },
        ),
      };
      return result;
    }
  }
}

export function getSuites(config: Config): Suite[] {
  let suites: Suite[] = [];
  if (config.seps.includes(1)) {
    if (config.seps.includes(24)) {
      suites.push(sep24TomlSuite);
    } else if (config.seps.includes(31)) {
      suites.push(sep31TomlSuite);
    }
  }
  if (config.seps.includes(10)) {
    suites = suites.concat(sep10Suites);
  }
  if (config.seps.includes(24)) {
    suites = suites.concat(sep24Suites);
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
