import { Suite, Config, Result } from "../types";
import { suites as sep1Suites } from "../tests/sep1/tests";

export async function* runSuite(
  suite: Suite,
  config: Config,
): AsyncGenerator<Result> {
  if (suite.before) {
    await suite.before();
  }
  for await (const test of suite.tests) {
    if (test.before) {
      await test.before();
    }
    const result = await test.run(config);
    if (test.after) {
      await test.after();
    }
    yield result;
  }
  if (suite.after) {
    await suite.after();
  }
}

export function getSuites(config: Config): Suite[] {
  let suites: Suite[] = [];
  if (config.seps.includes(1)) {
    suites = suites.concat(sep1Suites);
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
    if (suite.before) filteredSuite.before = suite.before;
    if (suite.after) filteredSuite.after = suite.after;
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
