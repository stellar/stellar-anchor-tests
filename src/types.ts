import { Request, Response } from "node-fetch";

export type SEP = 1 | 6 | 10 | 12 | 24 | 31;
export type SepConfig = { [key in SEP]: object };
export type OutputFormat = "coloredText" | "text" | "json";

export interface Config {
  homeDomain: string;
  seps: SEP[];
  verbose?: boolean;
  currency?: string;
  searchStrings?: [string];
  sepConfig?: SepConfig;
  mainnetMasterAccountSecret?: string;
  outputFormat?: OutputFormat;
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
  test: Test;
  networkCalls: NetworkCall[];
  suite?: Suite;
  expected?: string | number | object;
  actual?: string | number | object;
  failure?: Failure;
}

export interface Test {
  assertion: string;
  successMessage: string;
  failureModes: Record<string, Failure>;
  before?: () => Promise<void>;
  run(config: Config, suite?: Suite): Promise<Result>;
  after?: () => Promise<void>;
}

export interface Suite {
  name: string;
  tests: Test[];
  sep?: SEP;
  before?: () => Promise<void>;
  after?: () => Promise<void>;
}

export interface Stats {
  total: number;
  passed: number;
  failed: number;
  sep?: SEP;
  name?: string;
  suiteStats?: Stats[];
}
