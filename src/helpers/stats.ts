import { default as c } from "ansi-colors";

import { Result, Stats, OutputFormat } from "../types";

export function getStats(results: Result[]): Stats {
  let failed = 0;
  let passed = 0;
  const suiteStats: { [key: string]: Stats } = {};
  for (const result of results) {
    if (result.failure) {
      failed += 1;
    } else {
      passed += 1;
    }
    if (result.suite) {
      const suiteKey = `${result.suite.sep}-${result.suite.name}`;
      if (suiteStats[suiteKey]) {
        suiteStats[suiteKey].total += 1;
        if (result.failure) {
          suiteStats[suiteKey].failed += 1;
        } else {
          suiteStats[suiteKey].passed += 1;
        }
      } else {
        suiteStats[suiteKey] = {
          total: 1,
          passed: result.failure ? 0 : 1,
          failed: result.failure ? 1 : 0,
          name: result.suite.name,
        };
        if (result.suite.sep) suiteStats[suiteKey].sep = result.suite.sep;
      }
    }
  }
  return {
    suiteStats: Object.values(suiteStats),
    total: results.length,
    passed: passed,
    failed: failed,
  };
}

export function printStats(stats: Stats, _outputFormat: OutputFormat) {
  let suitesPassed = 0;
  if (stats.suiteStats) {
    for (const suiteStat of stats.suiteStats) {
      if (suiteStat.failed === 0) suitesPassed += 1;
    }
    let testSuitesLine = "Test Suites: ";
    if (stats.suiteStats.length !== suitesPassed)
      testSuitesLine +=
        c.red(`${stats.suiteStats.length - suitesPassed} failed`) + ", ";
    if (suitesPassed !== 0)
      testSuitesLine += c.green(`${suitesPassed} passed`) + ", ";
    testSuitesLine += `${stats.suiteStats.length} total`;
    console.log(testSuitesLine);
  }
  let testsLine = "Tests:       ";
  if (stats.failed !== 0) testsLine += c.red(`${stats.failed} failed`) + ", ";
  if (stats.passed !== 0) testsLine += c.green(`${stats.passed} passed`) + ", ";
  testsLine += `${stats.total} total`;
  console.log(testsLine);
}
