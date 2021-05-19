import { Networks } from "stellar-sdk";
import { Request, Response } from "node-fetch";

export type SEP = 1 | 6 | 10 | 12 | 24 | 31;

export interface Config {
  homeDomain: string;
  seps: SEP[];
  verbose?: boolean;
  assetCode?: string;
  searchStrings?: string[];
  sepConfig?: SepConfig;
  networkPassphrase?: Networks.TESTNET | Networks.PUBLIC;
}

export interface SepConfig {
  6?: SEP6Config;
  12?: SEP12Config;
  31?: SEP31Config;
}

export interface SEP12Config {
  customers: Record<string, any>;
}

export interface SEP31Config {
  sendingAnchorClientSecret: string;
  sendingClientName: string;
  receivingClientName: string;
  transactionFields?: any;
}

export interface SEP6Config {
  deposit: {
    transactionFields?: any;
  };
  withdraw: {
    types?: Record<string, { transactionFields: any }>;
  };
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

export interface Context {
  expects: { [key: string]: any };
  provides: { [key: string]: any };
}

export interface Test {
  assertion: string;
  failureModes: Record<string, Failure>;
  context: Context;
  sep: SEP;
  group: string;
  dependencies?: Test[];
  before?: (config: Config) => Promise<Result | void>;
  run(config: Config): Promise<Result>;
  after?: (config: Config) => Promise<Result | void>;
}

export interface TestRun {
  test: Test;
  result: Result;
}

export interface Stats {
  total: number;
  passed: number;
  failed: number;
}
