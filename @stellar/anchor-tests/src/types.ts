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
   * An array of strings used by the [[run]] and [[getTests]] functions to filter the tests run or returned. If specified, only
   * tests whose [[Test.assertion]] or [[Test.group]] properties contain one of the provided strings will be run or returned. Tests required
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
   * Autopopulated as the value of the NETWORK_PASSPHRASE property from the [[homeDomain]]'s stellar.toml file.
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

/**
 * The configuration object for SEP-31 tests.
 */
export interface Sep31Config {
  /**
   * The secret key of the Stellar keypair to use when making requests to the SEP-31 receiving anchor. This is
   * required because only trusted parties (with known Stellar account(s)) should be able to consume a receiving
   * anchor's API.
   */
  sendingAnchorClientSecret: string;

  /**
   * A key present in the [[Sep12Config.customers]] object. A `SEP-12 PUT /customer` request will be made with the
   * object contents included in the body, and the `id` returned will be used in `SEP-31 POST /transactions` requests
   * as the `sender_id`.
   */
  sendingClientName: string;

  /**
   * A key present in the [[Sep12Config.customers]] object. A `SEP-12 PUT /customer` request will be made with the
   * object contents included in the body, and the `id` returned will be used in `SEP-31 POST /transactions` requests
   * as the `receiver_id`.
   */
  receivingClientName: string;

  /**
   * The `fields.transaction` object to use in
   * [`POST /transactions`](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#post-transactions)
   * requests. This object will be compared to the `fields.transaction` object returned by
   * [`GET /info`](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#get-info) and is expected to
   * contain a value for every required field.
   */
  transactionFields?: any;
}

/**
 * The configuration object for SEP-6 tests.
 */
export interface Sep6Config {
  /**
   * The configuration object for SEP-6 deposits.
   */
  deposit: {
    /**
     * Additional arguments to use in
     * [`GET /deposit`](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#deposit)
     * requests. This object will be compared to the `fields` object returned by
     * [`GET /info`](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#info) and is expected to
     * contain a value for every required field.
     */
    transactionFields?: any;
  };
  /**
   * The configuration object for SEP-6 deposits.
   */
  withdraw: {
    /**
     * Sets of additional arguments to use in
     * [`GET /withdraw`](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#withdraw)
     * requests by type. Currently only one type value is required. This object will be compared to the matching `types`
     * object returned by [`GET /info`](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#info)
     * and is expected to contain a value for every required field.
     */
    types?: Record<string, { transactionFields: any }>;
  };
}

/**
 * An object containing a Fetch [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and
 * [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) for every request made during a test.
 * Every `NetworkCall` will have a `request` but will not have a `response` in the event of a connection error.
 * If such an error occurs the test will fail.
 */
export interface NetworkCall {
  request: Request;
  response?: Response;
}

/**
 * An object describing a potential failure mode for a test.
 */
export interface Failure {
  /**
   * A short name describing the failure.
   */
  name: string;

  /**
   * Returns the string to be assigned to [[Failure.message]].
   *
   * @param args?  An object containing the values for the placeholders of the string to be returned.
   */
  text: (args?: object) => string;

  /**
   * A human-readable string describing the failure. Will be undefined until a [[Failure.text]] call
   * populates it, which is done in the [[Test.run]] method.
   */
  message?: string;

  /**
   * A set of labeled links containing information relevant to the test failure.
   */
  links?: Record<string, string>;
}

/**
 * An object containing test result data.
 */
export interface Result {
  /**
   * The network calls made during the test run in the order they were made.
   */
  networkCalls: NetworkCall[];

  /**
   * The object describing the test failure. If undefined, the test passed or was skipped [[Failure.message]]
   * will always be defined if this property is also defined.
   */
  failure?: Failure;

  /**
   * The value expected by the test in the event of a failure. This property may still be undefined when
   * [[Result.failure]] is present.
   */
  expected?: string | number | object;

  /**
   * The value received by the test in the event of a failure. This property may still be undefined when
   * [[Result.failure]] is present.
   */
  actual?: string | number | object;

  /**
   * If `true`, the test was skipped. Tests are skipped if it is determined not to be relevant at runtime.
   * For example, some SEP-6 anchors may require manual review of KYC data passed. In this case, deposit and
   * withdraw transactions cannot be created immediately and the tests making those requests will be skipped.
   */
  skipped?: boolean;
}

/**
 * An object containing the data expected and provided by the test before and after [[Test.run]] executes,
 * respectively. The data provided by a test is used (i.e. expected) by tests that include it in it's
 * [[Test.dependencies]] array.
 */
export interface Context {
  /**
   * Prior to the test running, every property defined in this object has a value of `undefined`. If a value
   * for each property was not provided by a prior test, the test fails. See [[runTests]] for more information.
   */
  expects: { [key: string]: any };

  /**
   * Prior to the test running, every property defined in this object has a value of `undefined`. If a value
   * for any property is still `undefined` after the test run, the test fails. See [[runTests]] for more information.
   */
  provides: { [key: string]: any };
}

/**
 * An object representing a test case.
 */
export interface Test {
  /**
   * A short description of what this test expects.
   */
  assertion: string;

  /**
   * A object containg [[Failure]] objects for the possible reasons this test could fail. The [[Result.failure]]
   * associated with this test will be one of the object defined here.
   */
  failureModes: Record<string, Failure>;

  /**
   * The [[Context]] for this test.
   */
  context: Context;

  /*
   * One of the values defined by the [[SEP]] type.
   */
  sep: SEP;

  /**
   * A short description of the group this test belongs to.
   */
  group: string;

  /**
   * The [[Test]] objects that must run prior to calling this object's [[Test.run]] method. [[runTests]] and
   * [[getTests]] recursively traverse each test's dependency lists until a test with no dependencies is found.
   * Tests that directly or indirectly depend on themselves, creating a cycle, will always fail. If a test expects
   * a value provided by another test, the latter must be included in the former's dependencies array.
   */
  dependencies?: Test[];

  /**
   * Runs the test logic and returns a [[Result]] object.
   *
   * @param config  the [[Config]] object passed to [[run]] or [[runTests]].
   */
  run(config: Config): Promise<Result>;
}

/**
 * An object containing [[Test]] and it's [[Result]]
 */
export interface TestRun {
  test: Test;
  result: Result;
}

/**
 * An object used internally to count result states and output them to standard output.
 */
export interface Stats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}
