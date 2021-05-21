import { Networks } from "stellar-sdk";
import { Request, Response } from "node-fetch";

/**
 * The [Stellar Ecosystem Proposals (SEPs)](https://github.com/stellar/stellar-protocol/tree/master/ecosystem) this library supports testing.
 */
export type SEP = 1 | 6 | 10 | 12 | 24 | 31;

export interface Config {
  /**
   * The domain name that hosts the [stellar.toml](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md) file.
   */
  homeDomain: string;

  /**
   * The list of Stellar Ecosystem Proposal (SEP) implementations that should be tested. Note that some SEPs are dependent on others.
   * For example, most SEP-24 endpoints require a SEP-10 authentication token. Therefore, to test most SEP-24 endpoints, tests verifying
   * a SEP-10 authentication token can be retreived are also run.
   */
  seps: SEP[];

  /**
   * Only relevant if run via the command line.
   *
   * If `true`, each web request and response made during each failed test run will be printed to standard output. This is useful for
   * debugging a failed test.
   */
  verbose?: boolean;

  /**
   * Only relevant for SEP-6, 24, & 31.
   *
   * The code of the Stellar asset to use when testing. If not specified, it will be populated by the first test that requires it.
   * Asset codes are fetched from the `GET /info` responses of the relevant SEPs. If no enabled asset code is present, the test and
   * other tests dependent on it will fail.
   */
  assetCode?: string;

  /**
   * An array of strings used by the ``run()`` and ``getTests()`` functions to filter the tests run or returned. If specified, only
   * tests whose ``assertion`` or ``group`` properties contain one of the provided strings will be run or returned. Tests required
   * as dependencies are excluded from filtering.
   */
  searchStrings?: string[];

  /**
   * Only relevant for SEP-6, 12, & 31.
   *
   * A ``SepConfig`` object.
   */
  sepConfig?: SepConfig;

  /**
   * Autopopulated as the value of the NETWORK_PASSPHRASE property from the ``homeDomain``'s stellar.toml file.
   */
  networkPassphrase?: Networks.TESTNET | Networks.PUBLIC;
}

/**
 * A container object for the configuration required for each SEP.
 */
export interface SepConfig {
  6?: Sep6Config;
  12?: Sep12Config;
  31?: Sep31Config;
}

/**
 * The configuration object for SEP-12 tests.
 */
export interface Sep12Config {
  /**
   * A map containing objects that can be used in the body of
   * [PUT /customer](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md) requests.
   *
   * SEP-6 requires one customer object.
   *
   * SEP-12 requires two customer objects.
   *
   * SEP-31 requires two customer objects.
   *
   * If binary data types are required for registering customers via SEP-12, a relative or absolute path of the
   * file should be provided as the value for the associated
   * [SEP-9](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0009.md) attribute.
   */
  customers: Record<string, any>;
}

export interface Sep31Config {
  sendingAnchorClientSecret: string;
  sendingClientName: string;
  receivingClientName: string;
  transactionFields?: any;
}

export interface Sep6Config {
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
  skipped?: boolean;
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
  run(config: Config): Promise<Result>;
}

export interface TestRun {
  test: Test;
  result: Result;
}

export interface Stats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}
