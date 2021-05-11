import { TestRun, Stats } from "../types";

export function getStats(testRuns: TestRun[]): Stats {
  let failed = 0;
  let passed = 0;
  for (const testRun of testRuns) {
    if (testRun.result.failure) {
      failed += 1;
    } else {
      passed += 1;
    }
  }
  return {
    total: testRuns.length,
    passed: passed,
    failed: failed,
  };
}
