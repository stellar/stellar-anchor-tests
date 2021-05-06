import {
  Keypair,
  Networks,
  Transaction,
  FeeBumpTransaction,
  TransactionBuilder,
  Utils,
} from "stellar-sdk";
import fetch from "node-fetch";
import { Request } from "node-fetch";
import { URL } from "url";

import { Test, Config, Suite, Result, NetworkCall } from "../../types";
import { makeFailure } from "../../helpers/failure";
import { getTomlFailureModes, getTomlObj } from "../../helpers/sep1";
import {
  getChallenge,
  getChallengeFailureModes,
  postChallengeFailureModes,
  postChallenge,
} from "../../helpers/sep10";

let tomlObj: any;

const tomlSuite: Suite = {
  name: "SEP-10 TOML tests",
  sep: 10,
  tests: [],
};

const getAuthSuite: Suite = {
  name: "GET /auth",
  sep: 10,
  tests: [],
};

const postAuthSuite: Suite = {
  name: "POST /auth",
  sep: 10,
  tests: [],
};

const hasWebAuthEndpoint: Test = {
  assertion: "has a valid WEB_AUTH_ENDPOINT in the TOML file",
  successMessage: "has a valid WEB_AUTH_ENDPOINT in the TOML file",
  failureModes: {
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "The TOML file does not have a WEB_AUTH_ENDPOINT attribute";
      },
    },
    NO_HTTPS: {
      name: "no https",
      text(_args: any): string {
        return "The WEB_AUTH_ENDPOINT must use HTTPS";
      },
    },
    ENDS_WITH_SLASH: {
      name: "ends with slash",
      text(_args: any): string {
        return "WEB_AUTH_ENDPOINT cannot end with a '/'";
      },
    },
    ...getTomlFailureModes,
  },
  async run(config: Config, suite: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    tomlObj = await getTomlObj(config.homeDomain, result);
    if (!tomlObj) return result;
    if (!tomlObj.WEB_AUTH_ENDPOINT) {
      result.failure = makeFailure(
        this.failureModes.WEB_AUTH_ENDPOINT_NOT_FOUND,
      );
      return result;
    }
    if (!tomlObj.WEB_AUTH_ENDPOINT.startsWith("https")) {
      result.failure = makeFailure(this.failureModes.NO_HTTPS);
      return result;
    }
    if (tomlObj.WEB_AUTH_ENDPOINT.slice(-1) === "/") {
      result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
      return result;
    }
    return result;
  },
};
tomlSuite.tests.push(hasWebAuthEndpoint);

const checkTomlObj = async (
  config: Config,
  suite?: Suite,
): Promise<Result | void> => {
  if (!tomlObj) {
    const result = await hasWebAuthEndpoint.run(config, suite);
    if (result.failure) {
      // all other failure modes are blocking
      if (
        result.failure.name !==
        hasWebAuthEndpoint.failureModes.ENDS_WITH_SLASH.name
      )
        return result;
      // remove slash
      tomlObj.WEB_AUTH_ENDPOINT = tomlObj.WEB_AUTH_ENDPOINT.slice(0, -1);
    }
    if (!tomlObj)
      throw (
        "hasWebAuthEndpoint test did not assign tomlContentBuffer, " +
        "but no failure was returned"
      );
  }
};

const hasSigningKey: Test = {
  assertion: "has valid SIGNING_KEY",
  successMessage: "the TOML file has a valid SIGNING_KEY",
  failureModes: {
    SIGNING_KEY_NOT_FOUND: {
      name: "SIGNING_KEY not found",
      text(_args: any): string {
        return (
          "A SIGNING_KEY attribute is required in stellar.toml files for SEP-10.\n" +
          "The value is the public key of the keypair used to sign SEP-10 challenge transactions."
        );
      },
    },
    INVALID_SIGNING_KEY: {
      name: "invalid SIGNING_KEY",
      text(_args: any): string {
        return (
          "The SIGNING_KEY is not a valid Stellar keypair public key." +
          "See the documentation for more information:\n\n" +
          "https://developers.stellar.org/docs/glossary/accounts/#keypair"
        );
      },
    },
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    if (!tomlObj.SIGNING_KEY) {
      result.failure = makeFailure(this.failureModes.SIGNING_KEY_NOT_FOUND);
      return result;
    }
    try {
      Keypair.fromPublicKey(tomlObj.SIGNING_KEY).publicKey();
    } catch {
      result.failure = makeFailure(this.failureModes.INVALID_SIGNING_KEY);
    }
    return result;
  },
};
tomlSuite.tests.push(hasSigningKey);

const returnsValidChallengeResponse: Test = {
  assertion: "returns a valid GET /auth response",
  successMessage: "returns a valid GET /auth response",
  failureModes: {
    CONNECTION_ERROR: {
      name: "connection error",
      text(args: any): string {
        return (
          `A connection failure occured when making a request to: ` +
          `\n\n${args.url}\n\n` +
          `Make sure that CORS is enabled.`
        );
      },
    },
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return "Responses must return a 200 status for valid requests.";
      },
    },
    BAD_CONTENT_TYPE: {
      name: "bad content type",
      text(_args: any): string {
        return "Content-Type headers for GET /auth responses must be 'application/json'";
      },
    },
    NO_TRANSACTION: {
      name: "missing 'transaction' field",
      text(_args: any): string {
        return (
          "GET /auth response bodies must include a 'transaction' attribute containing a challenge transaction." +
          "See here for more information:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response"
        );
      },
    },
    UNRECOGNIZED_RESPONSE_ATTRIBUTE: {
      name: "unrecognized response attribute",
      text(args: any): string {
        return (
          `An unrecognized response attribute(s) were included in the response: ${args.attributes}.` +
          "The accepted attributes are 'transaction' and `network_passphrase'."
        );
      },
    },
    UNRECOGNIZED_NETWORK_PASSPHRASE: {
      name: "unrecognized network passphrase",
      text(args: any): string {
        return (
          "This tool only supports testing anchors on the test and public networks.\n\n" +
          `Testnet passphrase: ${args.testnet}` +
          `Pubnet passphrase: ${args.pubnet}` +
          `Got passphrase: ${args.passphrase}`
        );
      },
    },
    DESERIALIZATION_FAILED: {
      name: "transaction deserialization failed",
      text(args: any): string {
        return (
          "Unable to decode the 'transaction' value:\n\n. " +
          `${args.transaction}\n\n` +
          `With network passphrase: ${args.networkPassphrase}\n\n` +
          "'transaction' must be a base64-encoded string of the Stellar transaction XDR."
        );
      },
    },
    INVALID_TRANSACTION_TYPE: {
      name: "invalid transaction type",
      text(_args: any): string {
        return "FeeBumpTransactions are not valid challenge transactions";
      },
    },
    NONZERO_SEQUENCE_NUMBER: {
      name: "non-zero sequence number",
      text(_args: any): string {
        return (
          "Challenge transaction must have a sequence number of 0. See the documentation:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response"
        );
      },
    },
    SOURCE_ACCOUNT_NOT_SIGNING_KEY: {
      name: "source account doesn't match signing key",
      text(_args: any): string {
        return "Challenge transactions must have a source account matching the SIGNING_KEY in the TOML file.";
      },
    },
    MIN_TIME_TOO_EARLY: {
      name: "minumum timebound too early",
      text(_args: any): string {
        return "The challenge transaction's minumum timebound is before the request for the challenge was made.";
      },
    },
    MIN_TIME_TOO_LATE: {
      name: "minimum timebound too late",
      text(_args: any): string {
        return "The challenge transaction's minimum timebound is after the challenge was received.";
      },
    },
    NO_MAX_TIME: {
      name: "no maximum timebound",
      text(_args: any): string {
        return (
          "The challenge transaction's maximum timebound was not set. " +
          "15 minutes from when the challenge was issued is recommended."
        );
      },
    },
    FIRST_OP_NOT_MANAGE_DATA: {
      name: "first operation not of type ManageData",
      text(_args: any): string {
        return "The first operation of a challenge transaction must be of type ManageData.";
      },
    },
    HOME_DOMAIN_NOT_IN_OP_KEY: {
      name: "home domain not found in first operation's key",
      text(_args: any): string {
        return (
          "The first operation within a challenge transaction must be a ManageData operation with a key matching " +
          "'<home domain> auth', where the home domain is the domain hosting the TOML file."
        );
      },
    },
    INVALID_FIRST_OP_VALUE: {
      name: "invalid first operation key value",
      text(_args: any): string {
        return "The value of the challenge's first ManageData operation must be a base64-encoded string of 48 bytes";
      },
    },
    NO_WEB_AUTH_DOMAIN_OP: {
      name: "no ManageData operation containing 'web_auth_domain'",
      text(_args: any): string {
        return (
          "Challenge transactions must contain a ManageData operation where the key is 'web_auth_domain'" +
          " and value is the domain of the service issuing the challenge transaction."
        );
      },
    },
    INVALID_WEB_AUTH_DOMAIN: {
      name: "invalid 'web_auth_domain' value",
      text(_args: any): string {
        return "The 'web_auth_domain' value must be the WEB_AUTH_ENDPOINT domain.";
      },
    },
    INCLUDES_NON_MANAGE_DATA_OP: {
      name: "non-ManageData operation included",
      text(_args: any): string {
        return "All operations within a challenge transaction must be of type ManageData";
      },
    },
    INVALID_OP_SOURCE: {
      name: "invalid operation source",
      text(_args: any): string {
        return "Exluding the first, all operation source accounts must be the SIGNING_KEY";
      },
    },
    MISSING_SERVER_SIGNATURE: {
      name: "no signature on challenge transaction",
      text(_args: any): string {
        return "Challenge transactions must be signed by the SIGNING_KEY from the TOML file.";
      },
    },
    INVALID_SERVER_SIGNATURE: {
      name: "invalid transaction signature",
      text(_args: any): string {
        return "The signature on the challenge transaction must be from the TOML's SIGNING_KEY";
      },
    },
    UNEXPECTED_SIGNATURES: {
      name: "unexpected transaction signature(s)",
      text(_args: any): string {
        return "Only one signature from SIGNING_KEY is accepted on challenge transactions.";
      },
    },
  },
  before: checkTomlObj,
  async run(config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const clientKeypair = Keypair.random();
    const getAuthCall: NetworkCall = {
      request: new Request(
        tomlObj.WEB_AUTH_ENDPOINT + `?account=${clientKeypair.publicKey()}`,
      ),
    };
    result.networkCalls.push(getAuthCall);
    const timeBeforeCall = Math.floor(Date.now() / 1000);
    try {
      getAuthCall.response = await fetch(getAuthCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: result.networkCalls[0].request.url,
      });
      return result;
    }
    const timeAfterCall = Math.floor(Date.now() / 1000);
    if (getAuthCall.response.status !== 200) {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS_CODE);
      result.expected = 200;
      result.actual = getAuthCall.response.status;
      return result;
    }
    const getAuthContentType = getAuthCall.response.headers.get("Content-Type");
    if (!getAuthContentType || getAuthContentType !== "application/json") {
      result.failure = makeFailure(this.failureModes.BAD_CONTENT_TYPE);
      if (getAuthContentType) {
        result.expected = "application/json";
        result.actual = getAuthContentType;
      }
      return result;
    }
    const responseBody = await getAuthCall.response.clone().json();
    if (!responseBody.transaction) {
      result.failure = makeFailure(this.failureModes.NO_TRANSACTION);
      return result;
    }
    if (
      ![undefined, Networks.PUBLIC, Networks.TESTNET].includes(
        responseBody.network_passphrase,
      )
    ) {
      result.failure = makeFailure(
        this.failureModes.UNRECOGNIZED_NETWORK_PASSPHRASE,
        {
          pubnet: Networks.PUBLIC,
          testnet: Networks.TESTNET,
          passphrase: responseBody.network_passphrase,
        },
      );
      return result;
    }
    const responseKeys = Object.keys(responseBody);
    if (
      (responseBody.network_passphrase && responseKeys.length > 2) ||
      (!responseBody.network_passphrase && responseKeys.length > 1)
    ) {
      result.failure = makeFailure(
        this.failureModes.UNRECOGNIZED_RESPONSE_ATTRIBUTE,
        {
          attributes: responseKeys.filter(
            (attr) => !["transaction", "network_passphrase"].includes(attr),
          ),
        },
      );
    }
    let challenge: Transaction | FeeBumpTransaction;
    try {
      challenge = TransactionBuilder.fromXDR(
        responseBody.transaction,
        tomlObj.NETWORK_PASSPHRASE,
      );
    } catch {
      result.failure = makeFailure(this.failureModes.DESERIALIZATION_FAILED, {
        transaction: responseBody.transaction,
        networkPassphrase: tomlObj.NETWORK_PASSPHRASE,
      });
      return result;
    }
    if (challenge instanceof FeeBumpTransaction) {
      result.failure = makeFailure(this.failureModes.INVALID_TRANSACTION_TYPE);
      return result;
    } else if (challenge.sequence !== "0") {
      result.failure = makeFailure(this.failureModes.NONZERO_SEQUENCE_NUMBER);
      result.expected = "0";
      result.actual = challenge.sequence;
      return result;
    } else if (challenge.source !== tomlObj.SIGNING_KEY) {
      result.failure = makeFailure(
        this.failureModes.SOURCE_ACCOUNT_NOT_SIGNING_KEY,
      );
      result.expected = tomlObj.SIGNING_KEY;
      result.actual = challenge.source;
      return result;
    } else if (!challenge.timeBounds || !challenge.timeBounds.maxTime) {
      result.failure = makeFailure(this.failureModes.NO_MAX_TIME);
      return result;
    } else if (challenge.timeBounds.minTime < timeBeforeCall.toString()) {
      result.failure = makeFailure(this.failureModes.MIN_TIME_TOO_EARLY);
      return result;
    } else if (challenge.timeBounds.minTime > timeAfterCall.toString()) {
      result.failure = makeFailure(this.failureModes.MIN_TIME_TOO_LATE);
      return result;
    } else if (challenge.operations[0].type !== "manageData") {
      console.log(challenge.operations[0]);
      result.failure = makeFailure(this.failureModes.FIRST_OP_NOT_MANAGE_DATA);
      return result;
    } else if (
      challenge.operations[0].name !== `${new URL(config.homeDomain).host} auth`
    ) {
      result.failure = makeFailure(this.failureModes.HOME_DOMAIN_NOT_IN_OP_KEY);
      result.expected = `${new URL(config.homeDomain).host} auth`;
      result.actual = challenge.operations[0].name;
      return result;
    }
    const firstOpDataValue = challenge.operations[0].value;
    if (
      !firstOpDataValue ||
      Buffer.from(firstOpDataValue.toString(), "base64").length !== 48
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_FIRST_OP_VALUE);
      if (firstOpDataValue) console.log(firstOpDataValue.length);
      return result;
    }
    let webAuthDomainOp;
    for (const op of challenge.operations.slice(1)) {
      if (op.type !== "manageData") {
        result.failure = makeFailure(
          this.failureModes.INCLUDES_NON_MANAGE_DATA_OP,
        );
        return result;
      } else if (op.source !== tomlObj.SIGNING_KEY) {
        result.failure = makeFailure(this.failureModes.INVALID_OP_SOURCE);
        result.expected = tomlObj.SIGNING_KEY;
        result.actual = op.source;
        return result;
      } else if (op.name === "web_auth_domain") {
        const expectedWebAuthDomain = new URL(tomlObj.WEB_AUTH_ENDPOINT).host;
        if (!op.value || op.value.compare(Buffer.from(expectedWebAuthDomain))) {
          result.failure = makeFailure(
            this.failureModes.INVALID_WEB_AUTH_DOMAIN,
          );
          result.expected = expectedWebAuthDomain;
          if (op.value) result.actual = op.value.toString();
          return result;
        }
        webAuthDomainOp = op;
      }
    }
    if (!webAuthDomainOp) {
      result.failure = makeFailure(this.failureModes.NO_WEB_AUTH_DOMAIN_OP);
      return result;
    }
    if (challenge.signatures.length !== 1) {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_SIGNATURES);
      return result;
    }
    if (!Utils.verifyTxSignedBy(challenge, tomlObj.SIGNING_KEY)) {
      result.failure = makeFailure(this.failureModes.INVALID_SERVER_SIGNATURE);
      return result;
    }
    return result;
  },
};
getAuthSuite.tests.push(returnsValidChallengeResponse);

const noAccount: Test = {
  assertion: "rejects requests with no 'account' parameter",
  successMessage: "rejects requests with no 'account' parameter",
  failureModes: {
    CONNECTION_ERROR: {
      name: "connection error",
      text(args: any): string {
        return (
          `A connection failure occured when making a request to: ` +
          `\n\n${args.url}\n\n` +
          `Make sure that CORS is enabled.`
        );
      },
    },
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return "400 Bad Request is expected for requests without an 'account' parameter";
      },
    },
    INVALID_ERROR_SCHEMA: {
      name: "invalid error schema",
      text(_args: any): string {
        return "Error responses must contain an 'error' key and string value";
      },
    },
    BAD_CONTENT_TYPE: {
      name: "bad content type",
      text(_args: any): string {
        return "Content-Type headers for GET /auth responses must be 'application/json'";
      },
    },
  },
  before: checkTomlObj,
  async run(_config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const getAuthCall: NetworkCall = {
      request: new Request(tomlObj.WEB_AUTH_ENDPOINT),
    };
    result.networkCalls.push(getAuthCall);
    try {
      getAuthCall.response = await fetch(getAuthCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: getAuthCall.request.url,
      });
      return result;
    }
    if (getAuthCall.response.status !== 400) {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS_CODE);
      result.expected = 400;
      result.actual = getAuthCall.response.status;
      return result;
    }
    const getAuthContentType = getAuthCall.response.headers.get("Content-Type");
    if (!getAuthContentType || getAuthContentType !== "application/json") {
      result.failure = makeFailure(this.failureModes.BAD_CONTENT_TYPE);
      result.expected = "application/json";
      if (getAuthContentType) result.actual = getAuthContentType;
      return result;
    }
    const responseBody = await getAuthCall.response.clone().json();
    if (
      !responseBody.error ||
      !(
        typeof responseBody.error === "string" ||
        responseBody.error instanceof String
      )
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_ERROR_SCHEMA);
      return result;
    }
    return result;
  },
};
getAuthSuite.tests.push(noAccount);

const invalidAccount: Test = {
  assertion: "rejects requests with an invalid 'account' parameter",
  successMessage: "rejects requests with an invalid 'account' parameter",
  failureModes: noAccount.failureModes,
  before: checkTomlObj,
  async run(_config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const getAuthCall: NetworkCall = {
      request: new Request(
        tomlObj.WEB_AUTH_ENDPOINT + "?account=invalid-account",
      ),
    };
    result.networkCalls.push(getAuthCall);
    try {
      getAuthCall.response = await fetch(getAuthCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: getAuthCall.request.url,
      });
      return result;
    }
    if (getAuthCall.response.status !== 400) {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS_CODE);
      result.expected = 400;
      result.actual = getAuthCall.response.status;
      return result;
    }
    const getAuthContentType = getAuthCall.response.headers.get("Content-Type");
    if (!getAuthContentType || getAuthContentType !== "application/json") {
      result.failure = makeFailure(this.failureModes.BAD_CONTENT_TYPE);
      result.expected = "application/json";
      if (getAuthContentType) result.actual = getAuthContentType;
      return result;
    }
    const responseBody = await getAuthCall.response.clone().json();
    if (
      !responseBody.error ||
      !(
        typeof responseBody.error === "string" ||
        responseBody.error instanceof String
      )
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_ERROR_SCHEMA);
      return result;
    }
    return result;
  },
};
getAuthSuite.tests.push(invalidAccount);

const returnsValidJwt: Test = {
  assertion: "returns a valid JWT",
  successMessage: "returns a valid JWT",
  failureModes: postChallengeFailureModes,
  before: checkTomlObj,
  async run(_config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const clientKeypair = Keypair.random();
    await postChallenge(clientKeypair, tomlObj, result);
    return result;
  },
};
postAuthSuite.tests.push(returnsValidJwt);

const acceptsJson: Test = {
  assertion: "accepts JSON requests",
  successMessage: "accepts JSON requests",
  failureModes: postChallengeFailureModes,
  before: checkTomlObj,
  async run(_config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const clientKeypair = Keypair.random();
    await postChallenge(clientKeypair, tomlObj, result, true);
    return result;
  },
};
postAuthSuite.tests.push(acceptsJson);

const failsWithNoBody: Test = {
  assertion: "fails with no 'transaction' key in the body",
  successMessage: "fails with no 'transaction' key in the body",
  failureModes: {
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected for requests with no " +
          "'transaction' attribute in the body."
        );
      },
    },
    ...getChallengeFailureModes,
  },
  before: checkTomlObj,
  async run(_config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const clientKeypair = Keypair.random();
    const challenge = await getChallenge(clientKeypair, tomlObj, result);
    if (!challenge) return result;
    const postAuthRequest = new Request(tomlObj.WEB_AUTH_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const postAuthCall: NetworkCall = { request: postAuthRequest };
    result.networkCalls.push(postAuthCall);
    try {
      postAuthCall.response = await fetch(postAuthCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: postAuthCall.request.url,
      });
      return result;
    }
    if (postAuthCall.response.status !== 400) {
      result.failure = makeFailure(
        this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
      );
      result.expected = 400;
      result.actual = postAuthCall.response.status;
      return result;
    }
    return result;
  },
};
postAuthSuite.tests.push(failsWithNoBody);

const failsWithNoClientSignature: Test = {
  assertion: "fails if the challenge is not signed by the client",
  successMessage: "fails if the challenge is not signed by the client",
  failureModes: {
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected if the challenge " +
          " is not signed by the client."
        );
      },
    },
    ...getChallengeFailureModes,
  },
  before: checkTomlObj,
  async run(_config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const clientKeypair = Keypair.random();
    const challenge = await getChallenge(clientKeypair, tomlObj, result);
    if (!challenge) return result;
    const postAuthRequest = new Request(tomlObj.WEB_AUTH_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ transaction: challenge.toXDR() }),
      headers: { "Content-Type": "application/json" },
    });
    const postAuthCall: NetworkCall = { request: postAuthRequest };
    result.networkCalls.push(postAuthCall);
    try {
      postAuthCall.response = await fetch(postAuthCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: postAuthCall.request.url,
      });
      return result;
    }
    if (postAuthCall.response.status !== 400) {
      result.failure = makeFailure(
        this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
      );
      result.expected = 400;
      result.actual = postAuthCall.response.status;
      return result;
    }
    return result;
  },
};
postAuthSuite.tests.push(failsWithNoClientSignature);

const failsWithInvalidTransactionValue: Test = {
  assertion: "fails if the 'transaction' value is invalid",
  successMessage: "fails if the 'transaction' value is invalid",
  failureModes: {
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected if the 'transaction' " +
          " value is not a base64-encoded transaction string."
        );
      },
    },
    ...getChallengeFailureModes,
  },
  before: checkTomlObj,
  async run(_config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const clientKeypair = Keypair.random();
    const challenge = await getChallenge(clientKeypair, tomlObj, result);
    if (!challenge) return result;
    const postAuthRequest = new Request(tomlObj.WEB_AUTH_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        transaction: { "not a transaction string": true },
      }),
      headers: { "Content-Type": "application/json" },
    });
    const postAuthCall: NetworkCall = { request: postAuthRequest };
    result.networkCalls.push(postAuthCall);
    try {
      postAuthCall.response = await fetch(postAuthCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: postAuthCall.request.url,
      });
      return result;
    }
    if (postAuthCall.response.status !== 400) {
      result.failure = makeFailure(
        this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
      );
      result.expected = 400;
      result.actual = postAuthCall.response.status;
      return result;
    }
    return result;
  },
};
postAuthSuite.tests.push(failsWithInvalidTransactionValue);

export const failsIfChallengeNotSignedByServer: Test = {
  assertion: "fails if the challenge is not signed by SIGNING_KEY",
  successMessage: "fails if the challenge is not signed by SIGNING_KEY",
  failureModes: {
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected if the challenge " +
          " is not signed by the SIGNING_KEY from the TOML."
        );
      },
    },
    INVALID_NETWORK_PASSPHRASE: {
      name: "invalid network passphrase",
      text(_args: any): string {
        return "The TOML file must have a valid NETWORK_PASSPHRASE";
      },
    },
    ...getChallengeFailureModes,
  },
  before: checkTomlObj,
  async run(config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const clientKeypair = Keypair.random();
    const anchorHost = new URL(config.homeDomain).host;
    if (!tomlObj) {
      result.failure = makeFailure(this.failureModes.NO_TOML);
      return result;
    } else if (
      ![Networks.PUBLIC, Networks.TESTNET].includes(tomlObj.NETWORK_PASSPHRASE)
    ) {
      result.failure = makeFailure(
        this.failureModes.INVALID_NETWORK_PASSPHRASE,
      );
      result.expected = `'${Networks.PUBLIC}' or '${Networks.TESTNET}'`;
      return result;
    } else if (!tomlObj.WEB_AUTH_ENDPOINT) {
      result.failure = makeFailure(this.failureModes.NO_WEB_AUTH_ENDPOINT);
      return result;
    }
    const challengeXdr = Utils.buildChallengeTx(
      clientKeypair,
      clientKeypair.publicKey(),
      anchorHost,
      15,
      tomlObj.NETWORK_PASSPHRASE,
      anchorHost,
    );
    const postAuthRequest = new Request(tomlObj.WEB_AUTH_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        transaction: challengeXdr,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const postAuthCall: NetworkCall = { request: postAuthRequest };
    result.networkCalls.push(postAuthCall);
    try {
      postAuthCall.response = await fetch(postAuthCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: postAuthCall.request.url,
      });
      return result;
    }
    if (postAuthCall.response.status !== 400) {
      result.failure = makeFailure(
        this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
      );
      result.expected = 400;
      result.actual = postAuthCall.response.status;
      return result;
    }
    return result;
  },
};
postAuthSuite.tests.push(failsIfChallengeNotSignedByServer);

export default [tomlSuite, getAuthSuite, postAuthSuite];
