export interface TestCase {
  test: any; // Test from @stellar/anchor-tests
  result?: any; // Result from @stellar/anchor-tests
}

export type GroupedTestCases = {
  progress: { running: number; total: number };
  sep: number;
  tests: TestCase[];
}[];
