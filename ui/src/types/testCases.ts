import { Response, Request } from "node-fetch";

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

export interface NetworkCall {
  request: Request & { headers: { [key: string]: string[] } };
  response: Response;
}

export interface Result {
  actual: string;
  expected: string;
  failureMessage: string;
  failureMode: string;
  networkCalls: NetworkCall[];
  resourceLinks: {
    [key: string]: string;
  };
  skipped: boolean;
}

export interface TestCase {
  test: any; // Test from @stellar/anchor-tests
  result?: Result; // Result from @stellar/anchor-tests
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
