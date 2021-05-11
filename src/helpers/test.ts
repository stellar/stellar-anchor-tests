import { Networks } from "stellar-sdk";

import { Test, Config, TestRun, Failure } from "../types";
import { default as sep1Tests } from "../tests/sep1/tests";
import { default as sep10Tests } from "../tests/sep10/tests";
import { default as sep24Tests } from "../tests/sep24/tests";
import { makeFailure } from "./failure";

export async function* run(config: Config): AsyncGenerator<TestRun> {
  const tests = getTests(config);
  for await (const testRun of runTests(tests, config)) {
    yield testRun;
  }
}

export function getTests(config: Config): Test[] {
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
  if (config.seps.includes(24)) {
    tests = tests.concat(sep24Tests);
  }
  return filterBySearchStrings(tests, config.searchStrings as string[]);
}

export async function* runTests(
  tests: Test[],
  config: Config,
): AsyncGenerator<TestRun> {
  for await (const testRun of runTestsRecur(tests, config, [], {}, new Set())) {
    yield testRun;
  }
}

async function* runTestsRecur(
  tests: Test[],
  config: Config,
  chain: Test[],
  globalContext: { [key: string]: any },
  ranTests: Set<string>,
): AsyncGenerator<TestRun> {
  for (const test of tests) {
    if (hasRun(test, ranTests)) continue;
    let cyclicDependency: Test | undefined = undefined;
    let failedDependency: TestRun | undefined = undefined;
    if (test.dependencies) {
      for (const dependency of test.dependencies) {
        if (containsTest(chain, dependency)) {
          cyclicDependency = dependency;
          break;
        }
      }
      if (cyclicDependency) {
        const cyclicDependencyFailure: Failure = {
          name: "cyclic dependency detected",
          text(args: any): string {
            return (
              "Mutual dependence was detected between two tests:\n\n" +
              `SEP: ${args.testOne.SEP}\n` +
              `Group: ${args.testOne.group}\n` +
              `Assertion: ${args.testOne.assertion}\n\n` +
              `and\n\n` +
              `SEP: ${args.testTwo.SEP}\n` +
              `Group: ${args.testTwo.group}\n` +
              `Assertion: ${args.testTwo.assertion}`
            );
          },
        };
        yield {
          test: test,
          result: {
            networkCalls: [],
            failure: makeFailure(cyclicDependencyFailure, {
              testOne: cyclicDependency,
              testTwo: test,
            }),
          },
        };
        continue;
      }
      chain.push(test);
      for await (const testRun of runTestsRecur(
        test.dependencies,
        config,
        chain,
        globalContext,
        ranTests,
      )) {
        yield testRun;
        if (testRun.result.failure) {
          failedDependency = testRun;
          break;
        }
      }
      chain.pop();
    }
    if (failedDependency) {
      const failedDependencyFailure: Failure = {
        name: "failed dependency",
        text(args: any): string {
          return (
            `A prior test dependency failed:\n\n` +
            `SEP: ${args.test.SEP}\n` +
            `Group: ${args.test.group}\n` +
            `Assertion: ${args.test.assertion}`
          );
        },
      };
      yield {
        test: test,
        result: {
          networkCalls: [],
          failure: makeFailure(failedDependencyFailure, {
            testRun: failedDependency,
          }),
        },
      };
    } else {
      const expectedContextFailure = provideExpectedContext(
        globalContext,
        test,
      );
      if (expectedContextFailure) {
        yield {
          test: test,
          result: {
            networkCalls: [],
            failure: expectedContextFailure,
          },
        };
        continue;
      }
      yield await runTest(test, config);
      ranTests.add(testString(test));
      const providedContextFailure = updateWithProvidedContext(
        globalContext,
        test,
      );
      if (providedContextFailure) {
        yield {
          test: test,
          result: {
            networkCalls: [],
            failure: expectedContextFailure,
          },
        };
      }
    }
  }
}

async function runTest(test: Test, config: Config): Promise<TestRun> {
  try {
    if (test.before) {
      const beforeResult = await test.before(config);
      if (beforeResult) {
        return { test: test, result: beforeResult };
      }
    }
    const result = await test.run(config);
    if (test.after) {
      const afterResult = await test.after(config);
      if (afterResult) {
        return { test: test, result: afterResult };
      }
    }
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

function containsTest(_tests: Test[], _test: Test): boolean {
  return false;
}

function provideExpectedContext(
  globalContext: { [key: string]: any },
  test: Test,
): Failure | undefined {
  for (const key in test.context.expects) {
    if (!globalContext[key]) {
      return makeFailure(
        {
          name: "missing expected context",
          text(args: any): string {
            return (
              `The following test expected context '${key}':\n\n` +
              `SEP: ${args.test.SEP}\n` +
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
    if (!test.context.provides[key]) {
      return makeFailure(
        {
          name: "missing provided context",
          text(args: any): string {
            return (
              `The following test was expected to provide context '${key}':\n\n` +
              `SEP: ${args.test.SEP}\n` +
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

function hasRun(test: Test, ranTests: Set<string>): boolean {
  return ranTests.has(testString(test));
}

function testString(test: Test): string {
  return `${test.sep}-${test.group}-${test.assertion}`;
}
