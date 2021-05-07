import { TestRun, Stats } from "../types";

export function getStats(testRuns: TestRun[]): Stats {
  let failed = 0;
  let passed = 0;
  const suiteStats: { [key: string]: Stats } = {};
  for (const testRun of testRuns) {
    if (testRun.result.failure) {
      failed += 1;
    } else {
      passed += 1;
    }
    if (testRun.suite) {
      const suiteKey = `${testRun.suite.sep}-${testRun.suite.name}`;
      if (suiteStats[suiteKey]) {
        suiteStats[suiteKey].total += 1;
        if (testRun.result.failure) {
          suiteStats[suiteKey].failed += 1;
        } else {
          suiteStats[suiteKey].passed += 1;
        }
      } else {
        suiteStats[suiteKey] = {
          total: 1,
          passed: testRun.result.failure ? 0 : 1,
          failed: testRun.result.failure ? 1 : 0,
          name: testRun.suite.name,
        };
        if (testRun.suite.sep) suiteStats[suiteKey].sep = testRun.suite.sep;
      }
    }
  }
  return {
    suiteStats: Object.values(suiteStats),
    total: testRuns.length,
    passed: passed,
    failed: failed,
  };
}
