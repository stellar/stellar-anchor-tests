import { Networks } from "stellar-sdk";

import { Test, Config, TestRun, Failure, DependenciesCaller } from "../types";
import { default as sep1Tests } from "../tests/sep1/tests";
import { default as sep6Tests } from "../tests/sep6/tests";
import { default as sep10Tests } from "../tests/sep10/tests";
import { default as sep12Tests } from "../tests/sep12/tests";
import { default as sep24Tests } from "../tests/sep24/tests";
import { default as sep31Tests } from "../tests/sep31/tests";
import { default as sep31And38Tests } from "../tests/sep31And38/tests";
import { default as sep38Tests } from "../tests/sep38/tests";
import { default as sep381Test } from "../tests/sep381/tests";
import { makeFailure } from "./failure";
import { checkConfig } from "./config";

/**
 * Gets tests based on the SEPs and search strings specified
 * in `config` and calls runTests, which ensures all depedencies are run
 * prior to each test. Each test run is yield'ed back to the caller.
 *
 * The function will raise an exception if a cycle is detected. A
 * cycle is when a test depends, directly or indirectly, on itself.

 * @param config  the [[Config]] object to pass to each [[Test.run]] method.
 * @throws [[ConfigError]]  if the `config` is invalid in some way.
 */
export async function* run(config: Config): AsyncGenerator<TestRun> {
  const tests = getTopLevelTests(config);
  for await (const testRun of runTests(tests, config)) {
    yield testRun;
  }
}

/**
 * Gets all tests that [[run]] would run for a given [[Config]] passed.
 *
 * This is helpful if you want to use test objects prior to running.
 * For example, the tests returned could be displayed in a UI prior
 * to running the tests.
 *
 * The function will raise an exception if a cycle is detected. A
 * cycle is when a test depends, directly or indirectly, on itself.
 *
 * @param config  the [[Config]] object to used to determine which tests to return.
 * @throws [[ConfigError]]  if the `config` is invalid in some way.
 */
export async function getTests(config: Config): Promise<Test[]> {
  await checkConfig(config, { checkSepConfig: false });
  const topLevelTests = getTopLevelTests(config);
  return getAllTestsRecur(config, topLevelTests, [], new Set());
}

const getDepencencies = (
  config: Config,
  dependencies?: Test[] | DependenciesCaller,
): Test[] | null => {
  if (!dependencies) {
    return null;
  }

  return Array.isArray(dependencies) ? dependencies : dependencies(config);
};

/*
 * Takes tests from getTopLevelTests() and adds their dependencies.
 *
 * Specifically, dependencies are guarunteed to be present in the
 * returned list prior to those that depend on them. The function will
 * raise an exception if a cycle is detected. A cycle is when a test
 * depends, directly or indirectly, on itself.
 */
function getAllTestsRecur(
  config: Config,
  tests: Test[],
  testDependencyStack: Test[],
  seenTests: Set<string>,
): Test[] {
  let allTests: Test[] = [];
  for (const test of tests) {
    if (containsTest(testDependencyStack, test)) {
      throw (
        "A dependency cycle was detected for test:\n\n" +
        `SEP: ${test.sep}\n` +
        `Group: ${test.group}\n` +
        `Assertion: ${test.assertion}`
      );
    } else if (seenTests.has(testString(test))) {
      continue;
    }
    const dependencies = getDepencencies(config, test.dependencies);
    if (dependencies) {
      testDependencyStack.push(test);
      allTests = allTests.concat(
        getAllTestsRecur(config, dependencies, testDependencyStack, seenTests),
      );
      testDependencyStack.pop();
    }
    seenTests.add(testString(test));
    allTests.push(test);
  }
  return allTests;
}

class FailedDependencyError extends Error {
  test: Test;

  constructor(test: Test) {
    super(
      "A test dependency failed\n\n" +
        `SEP: ${test.sep}\nGroup: ${test.group}\nAssertion: ${test.assertion}`,
    );
    this.name = "FailedDependencyError";
    this.test = test;

    Object.setPrototypeOf(this, FailedDependencyError.prototype);
  }
}

class CyclicDependencyError extends Error {
  test: Test;

  constructor(test: Test) {
    super(
      "A dependency cycle was detected\n\n" +
        `SEP: ${test.sep}\nGroup: ${test.group}\nAssertion: ${test.assertion}`,
    );
    this.name = "CyclicDependencyError";
    this.test = test;

    Object.setPrototypeOf(this, CyclicDependencyError.prototype);
  }
}

/**
 * Runs the tests passed, including dependencies, and yields them
 * back to the caller.
 *
 * Maintains a global context object. Expects each test to provide
 * the data defined in [[Context.provides]] to the global context
 * and ensures the global context has the data defined in each
 * [[Context.expects]].
 *
 * If a test directly or indirectly depends on itself or if one of
 * its dependencies fails, a relevant [[Faliure]] will be added to the
 * test's result and yielded and the test will not be run.
 *
 * @param tests  the list of tests to run in order.
 * @param config  the [[Config]] object to pass to each [[Test.run]] method.
 * @throws [[ConfigError]]  if the `config` is invalid in some way.
 */
export async function* runTests(
  tests: Test[],
  config: Config,
): AsyncGenerator<TestRun> {
  await checkConfig(config);
  for await (const testRun of runTestsRecur(tests, config, [], {}, {})) {
    yield testRun;
  }
}

async function* runTestsRecur(
  tests: Test[],
  config: Config,
  chain: Test[],
  globalContext: { [key: string]: any },
  ranTestsPassFail: Record<string, boolean>,
): AsyncGenerator<TestRun> {
  for (const test of tests) {
    if (containsTest(chain, test)) {
      throw new CyclicDependencyError(test);
    } else if (testString(test) in ranTestsPassFail) {
      if (ranTestsPassFail[testString(test)]) {
        continue;
      } else {
        throw new FailedDependencyError(test);
      }
    }
    ranTestsPassFail[testString(test)] = true;
    let failedDependencyError: FailedDependencyError | undefined = undefined;
    let cycleError: CyclicDependencyError | undefined = undefined;
    const dependencies = getDepencencies(config, test.dependencies);
    if (dependencies) {
      chain.push(test);
      try {
        for await (const testRun of runTestsRecur(
          dependencies,
          config,
          chain,
          globalContext,
          ranTestsPassFail,
        )) {
          yield testRun;
          if (testRun.result.failure) {
            chain.pop();
            throw new FailedDependencyError(testRun.test);
          }
        }
      } catch (error) {
        if (error instanceof CyclicDependencyError) {
          if (testString(error.test) === testString(test)) {
            cycleError = error;
          } else {
            chain.pop();
            throw error;
          }
        } else if (error instanceof FailedDependencyError) {
          failedDependencyError = error;
        } else {
          // unexpected exception
          chain.pop();
          throw error;
        }
      }
      chain.pop();
    }
    if (cycleError) {
      const cycleDetectedFailure: Failure = {
        name: "dependency cycle detected",
        text(_args: any): string {
          return (cycleError as CyclicDependencyError).message;
        },
      };
      ranTestsPassFail[testString(test)] = false;
      yield {
        test: test,
        result: {
          networkCalls: [],
          failure: makeFailure(cycleDetectedFailure),
        },
      };
    } else if (failedDependencyError) {
      const failedDependencyFailure: Failure = {
        name: "failed dependency",
        text(_args: any): string {
          return (failedDependencyError as FailedDependencyError).message;
        },
      };
      ranTestsPassFail[testString(test)] = false;
      yield {
        test: test,
        result: {
          networkCalls: [],
          failure: makeFailure(failedDependencyFailure),
        },
      };
    } else {
      const expectedContextFailure = provideExpectedContext(
        globalContext,
        test,
      );
      if (expectedContextFailure) {
        ranTestsPassFail[testString(test)] = false;
        yield {
          test: test,
          result: {
            networkCalls: [],
            failure: expectedContextFailure,
          },
        };
        continue;
      }
      const testRun = await runTest(test, config);
      if (!testRun.result.failure) {
        const providedContextFailure = updateWithProvidedContext(
          globalContext,
          test,
        );
        if (providedContextFailure) {
          ranTestsPassFail[testString(test)] = false;
          yield {
            test: test,
            result: {
              networkCalls: [],
              failure: providedContextFailure,
            },
          };
          continue;
        }
      } else {
        ranTestsPassFail[testString(test)] = false;
      }
      yield testRun;
    }
  }
}

/*
 * Runs the `test` passed, including the before() and after() methods
 * if present, and returns the corresponding TestRun object.
 *
 * Note that dependencies are not run prior to running `test`.
 */
async function runTest(test: Test, config: Config): Promise<TestRun> {
  try {
    const result = await test.run(config);
    return { test: test, result: result };
  } catch (e) {
    const failure: Failure = {
      name: "unexpected exception",
      text(args: any): string {
        return (
          "An unexpected exception occurred while running:\n\n" +
          `SEP: '${test.sep}'\nGroup: '${test.group}'\nTest: '${test.assertion}'\n\n` +
          `Exception message: '${args.exception}'\n\n` +
          "Please report this bug at https://github.com/stellar/stellar-anchor-tests/issues"
        );
      },
    };
    return {
      test: test,
      result: {
        networkCalls: [],
        failure: makeFailure(failure, { exception: e.message }),
      },
    };
  }
}

/*
 * Returns the tests that should run for the given `config`, not
 * including dependencies.
 */
function getTopLevelTests(config: Config): Test[] {
  let tests: Test[] = [];
  if (config.seps.includes(1)) {
    tests = tests.concat(sep1Tests);
  }
  if (config.seps.includes(10)) {
    if (config.networkPassphrase === Networks.PUBLIC) {
      // signer support tests not yet supported on pubnet
      const filteredSep10Suites = sep10Tests.filter(
        (test: Test) => !test.group.includes("Account Signer Support"),
      );
      tests = tests.concat(filteredSep10Suites);
    } else {
      tests = tests.concat(sep10Tests);
    }
  }
  if (config.seps.includes(12)) {
    tests = tests.concat(sep12Tests);
  }
  if (config.seps.includes(6)) {
    tests = tests.concat(sep6Tests);
  }
  if (config.seps.includes(24)) {
    tests = tests.concat(sep24Tests);
  }
  if (config.seps.includes(31)) {
    tests = tests.concat(sep31Tests);
  }
  if (config.seps.includes(38)) {
    tests = tests.concat(sep38Tests);
  }
  if (config.seps.includes(381)) {
    tests = tests.concat(sep381Test);
  }
  if (config.seps.includes(31) && config.seps.includes(38)) {
    tests = tests.concat(sep31And38Tests);
  }
  return filterBySearchStrings(tests, config.searchStrings as string[]);
}

/*
 * Returns a subset of `tests` which match one of the `searchStrings`
 * provided.
 *
 * A test matches one of the search strings if `Test.assertion` or
 * `Test.group` contains one of the `searchStrings`.
 */
function filterBySearchStrings(tests: Test[], searchStrings: string[]): Test[] {
  if (!searchStrings) {
    return tests;
  }
  const filteredTests: Test[] = [];
  for (const test of tests) {
    const groupNameLower = test.group.toLowerCase();
    const assertionLower = test.assertion.toLowerCase();
    for (const searchString of searchStrings) {
      const searchStringLower = searchString.toLowerCase();
      if (
        groupNameLower.includes(searchStringLower) ||
        assertionLower.includes(searchStringLower)
      ) {
        filteredTests.push(test);
        break;
      }
    }
  }
  return filteredTests;
}

function containsTest(tests: Test[], test: Test): boolean {
  for (const t of tests) {
    if (testString(t) === testString(test)) return true;
  }
  return false;
}

function provideExpectedContext(
  globalContext: { [key: string]: any },
  test: Test,
): Failure | undefined {
  for (const key in test.context.expects) {
    if (globalContext[key] === undefined) {
      return makeFailure(
        {
          name: "missing expected context",
          text(args: any): string {
            return (
              `The following test expected context '${key}':\n\n` +
              `SEP: ${args.test.sep}\n` +
              `Group: ${args.test.group}\n` +
              `Assertion: ${args.test.assertion}`
            );
          },
        },
        { test: test, key: key },
      );
    }
    test.context.expects[key] = globalContext[key];
  }
  return;
}

function updateWithProvidedContext(
  globalContext: { [key: string]: any },
  test: Test,
): Failure | undefined {
  for (const key in test.context.provides) {
    if (test.context.provides[key] === undefined) {
      return makeFailure(
        {
          name: "missing provided context",
          text(args: any): string {
            return (
              `The following test was expected to provide context '${key}':\n\n` +
              `SEP: ${args.test.sep}\n` +
              `Group: ${args.test.group}\n` +
              `Assertion: ${args.test.assertion}`
            );
          },
        },
        { test: test, key: key },
      );
    }
    globalContext[key] = test.context.provides[key];
  }
  return;
}

function testString(test: Test): string {
  return `${test.sep}-${test.group}-${test.assertion}`;
}
