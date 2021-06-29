export interface FormData {
  homeDomain: string;
  seps: Array<number>;
  assetCode?: string;
  sepConfig?: any;
}

export enum RunState {
  noTests = "noTests",
  awaitingRun = "awaitingRun",
  running = "running",
  done = "done",
}

export interface TestCase {
  test: any; // Test from @stellar/anchor-tests
  result?: any; // Result from @stellar/anchor-tests
}

export interface TestCaseProgress {
  passed: number;
  failed: number;
  total: number;
}

export type GroupedTestCases = {
  progress: TestCaseProgress;
  sep: number;
  tests: TestCase[];
}[];
