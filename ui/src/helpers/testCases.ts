import { TestCase } from "types/testCases";

export const SepUIOrder = [1, 10, 12, 6, 24, 31];

export function getTestRunId(test: any): string {
  // sep-group-assertion is unique in @stellar/anchor-tests
  return `${test.sep}:${test.group}:${test.assertion}`;
}

/*
 * `tests` should be the return value of a getTests call.
 * The return value should be assigned to testCasesArray.
 */
export function parseTests(tests: any[]): TestCase[] {
  const testRuns = [];
  // this may not be the most efficient way to reorder tests but
  // Array.sort() may not maintain order if the compare function
  // evaluates two tests as equal, which would happen for tests of
  // the same sep.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
  for (const sep of SepUIOrder) {
    for (const test of tests) {
      if (test.sep === sep) testRuns.push({ test });
    }
  }
  return testRuns;
}
