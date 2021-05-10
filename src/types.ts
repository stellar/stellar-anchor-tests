import { Networks } from "stellar-sdk";
import { Request, Response } from "node-fetch";

export type SEP = 1 | 6 | 10 | 12 | 24 | 31;
export type SepConfig = { [key in SEP]: object };

export interface Config {
  homeDomain: string;
  seps: SEP[];
  verbose?: boolean;
  assetCode?: string;
  searchStrings?: string[];
  sepConfig?: SepConfig;
  networkPassphrase?: Networks.TESTNET | Networks.PUBLIC;
}

export interface NetworkCall {
  request: Request;
  response?: Response;
}

export interface Failure {
  name: string;
  text: (args?: object) => string;
  message?: string;
}

export interface Result {
  networkCalls: NetworkCall[];
  failure?: Failure;
  expected?: string | number | object;
  actual?: string | number | object;
}

export interface Test {
  assertion: string;
  successMessage: string;
  failureModes: Record<string, Failure>;
  before?: (config: Config, suite: Suite) => Promise<Result | void>;
  run(config: Config, suite: Suite): Promise<Result>;
  after?: (config: Config, suite: Suite) => Promise<Result | void>;
}

export interface Suite {
  name: string;
  tests: Test[];
  sep?: SEP;
  context?: any;
}

export interface TestRun {
  test: Test;
  result: Result;
  suite: Suite;
}

export interface Stats {
  total: number;
  passed: number;
  failed: number;
  sep?: SEP;
  name?: string;
  suiteStats?: Stats[];
}
