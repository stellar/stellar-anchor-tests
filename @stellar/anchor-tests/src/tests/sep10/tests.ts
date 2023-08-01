import {
  Account,
  Keypair,
  Networks,
  Transaction,
  FeeBumpTransaction,
  TransactionBuilder,
  Utils,
  Operation,
} from "stellar-sdk";
import fetch from "node-fetch";
import { Request } from "node-fetch";
import { URL } from "url";

import { Test, Config, Result, NetworkCall, Failure } from "../../types";
import { makeRequest } from "../../helpers/request";
import { makeFailure } from "../../helpers/failure";
import { loadAccount, submitTransaction } from "../../helpers/horizon";
import {
  getChallenge,
  getChallengeFailureModes,
  postChallengeFailureModes,
  postChallenge,
  friendBot,
  friendbotFailureModes,
} from "../../helpers/sep10";
import { tomlExists } from "../sep1/tests";

const tomlTests = "TOML Tests";
const getAuthGroup = "GET /auth";
const postAuthGroup = "POST /auth";
const signerSupportGroup = "Account Signer Support";
const tests: Test[] = [];

export const hasWebAuthEndpoint: Test = {
  assertion: "has a valid WEB_AUTH_ENDPOINT in the TOML file",
  sep: 10,
  group: tomlTests,
  dependencies: [tomlExists],
  failureModes: {
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "The TOML file does not have a WEB_AUTH_ENDPOINT attribute";
      },
      links: {
        "SEP-10 Abstract":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#abstract",
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
  },
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {
      webAuthEndpoint: undefined,
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!this.context.expects.tomlObj.WEB_AUTH_ENDPOINT) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND);
      return result;
    }
    if (
      !this.context.expects.tomlObj.WEB_AUTH_ENDPOINT.startsWith("https") &&
      !(
        config.homeDomain.includes("localhost") ||
        config.homeDomain.includes("host.docker.internal")
      )
    ) {
      result.failure = makeFailure(this.failureModes.NO_HTTPS);
      return result;
    }
    this.context.provides.webAuthEndpoint =
      this.context.expects.tomlObj.WEB_AUTH_ENDPOINT;
    if (this.context.expects.tomlObj.WEB_AUTH_ENDPOINT.slice(-1) === "/") {
      this.context.provides.webAuthEndpoint =
        this.context.provides.webAuthEndpoint.slice(0, -1);
      result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
      return result;
    }
    return result;
  },
};
tests.push(hasWebAuthEndpoint);

const hasSigningKey: Test = {
  assertion: "has valid SIGNING_KEY",
  sep: 10,
  group: tomlTests,
  dependencies: [tomlExists],
  failureModes: {
    SIGNING_KEY_NOT_FOUND: {
      name: "SIGNING_KEY not found",
      text(_args: any): string {
        return (
          "A SIGNING_KEY attribute is required in stellar.toml files for SEP-10.\n" +
          "The value is the public key of the keypair used to sign SEP-10 challenge transactions."
        );
      },
      links: {
        "SEP-10 Abstract":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#abstract",
      },
    },
    INVALID_SIGNING_KEY: {
      name: "invalid SIGNING_KEY",
      text(_args: any): string {
        return (
          "The SIGNING_KEY is not a valid Stellar keypair public key." +
          "See the documentation for more information."
        );
      },
      links: {
        "Stellar Keypairs":
          "https://developers.stellar.org/docs/glossary/accounts/#keypair",
      },
    },
  },
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!this.context.expects.tomlObj.SIGNING_KEY) {
      result.failure = makeFailure(this.failureModes.SIGNING_KEY_NOT_FOUND);
      return result;
    }
    try {
      Keypair.fromPublicKey(
        this.context.expects.tomlObj.SIGNING_KEY,
      ).publicKey();
    } catch {
      result.failure = makeFailure(this.failureModes.INVALID_SIGNING_KEY);
    }
    return result;
  },
};
tests.push(hasSigningKey);

const returnsValidChallengeResponse: Test = {
  assertion: "returns a valid GET /auth response",
  sep: 10,
  group: getAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
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
      links: {
        "Cross-Origin Resource Sharing (CORS)":
          "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
      },
    },
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return "Responses must return a 200 status for valid requests.";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    BAD_CONTENT_TYPE: {
      name: "bad content type",
      text(_args: any): string {
        return "Content-Type headers for GET /auth responses must be 'application/json'";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    NO_TRANSACTION: {
      name: "missing 'transaction' field",
      text(_args: any): string {
        return (
          "GET /auth response bodies must include a 'transaction' attribute containing a challenge transaction." +
          "See the documentation for more information."
        );
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
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
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
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
      links: {
        "Network Passphrases":
          "https://developers.stellar.org/docs/glossary/network-passphrase/",
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
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
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
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    SOURCE_ACCOUNT_NOT_SIGNING_KEY: {
      name: "source account doesn't match signing key",
      text(_args: any): string {
        return "Challenge transactions must have a source account matching the SIGNING_KEY in the TOML file.";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    MIN_TIME_TOO_EARLY: {
      name: "minumum timebound too early",
      text(_args: any): string {
        return "The challenge transaction's minumum timebound is before the request for the challenge was made.";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    MIN_TIME_TOO_LATE: {
      name: "minimum timebound too late",
      text(_args: any): string {
        return "The challenge transaction's minimum timebound is after the challenge was received.";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
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
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    FIRST_OP_NOT_MANAGE_DATA: {
      name: "first operation not of type ManageData",
      text(_args: any): string {
        return "The first operation of a challenge transaction must be of type ManageData.";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
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
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    INVALID_FIRST_OP_VALUE: {
      name: "invalid first operation key value",
      text(_args: any): string {
        return "The value of the challenge's first ManageData operation must be a base64-encoded string of 48 bytes";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
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
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    INVALID_WEB_AUTH_DOMAIN: {
      name: "invalid 'web_auth_domain' value",
      text(_args: any): string {
        return "The 'web_auth_domain' value must be the WEB_AUTH_ENDPOINT domain.";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    INCLUDES_NON_MANAGE_DATA_OP: {
      name: "non-ManageData operation included",
      text(_args: any): string {
        return "All operations within a challenge transaction must be of type ManageData";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    INVALID_OP_SOURCE: {
      name: "invalid operation source",
      text(_args: any): string {
        return "Exluding the first, all operation source accounts must be the SIGNING_KEY";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    MISSING_SERVER_SIGNATURE: {
      name: "no signature on challenge transaction",
      text(_args: any): string {
        return "Challenge transactions must be signed by the SIGNING_KEY from the TOML file.";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    INVALID_SERVER_SIGNATURE: {
      name: "invalid transaction signature",
      text(_args: any): string {
        return "The signature on the challenge transaction must be from the TOML's SIGNING_KEY";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    UNEXPECTED_SIGNATURES: {
      name: "unexpected transaction signature(s)",
      text(_args: any): string {
        return "Only one signature from SIGNING_KEY is accepted on challenge transactions.";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
  },
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const getAuthCall: NetworkCall = {
      request: new Request(
        this.context.expects.webAuthEndpoint +
          `?account=${clientKeypair.publicKey()}`,
      ),
    };
    result.networkCalls.push(getAuthCall);
    const timeBeforeCall = Math.floor(Date.now() / 1000);
    const responseBody = await makeRequest(
      getAuthCall,
      200,
      result,
      "application/json",
    );
    const timeAfterCall = Math.floor(Date.now() / 1000);
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
        this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      );
    } catch {
      result.failure = makeFailure(this.failureModes.DESERIALIZATION_FAILED, {
        transaction: responseBody.transaction,
        networkPassphrase: this.context.expects.tomlObj.NETWORK_PASSPHRASE,
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
    } else if (challenge.source !== this.context.expects.tomlObj.SIGNING_KEY) {
      result.failure = makeFailure(
        this.failureModes.SOURCE_ACCOUNT_NOT_SIGNING_KEY,
      );
      result.expected = this.context.expects.tomlObj.SIGNING_KEY;
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
      return result;
    }
    let webAuthDomainOp;
    for (const op of challenge.operations.slice(1)) {
      if (op.type !== "manageData") {
        result.failure = makeFailure(
          this.failureModes.INCLUDES_NON_MANAGE_DATA_OP,
        );
        return result;
      } else if (op.source !== this.context.expects.tomlObj.SIGNING_KEY) {
        result.failure = makeFailure(this.failureModes.INVALID_OP_SOURCE);
        result.expected = this.context.expects.tomlObj.SIGNING_KEY;
        result.actual = op.source;
        return result;
      } else if (op.name === "web_auth_domain") {
        const expectedWebAuthDomain = new URL(
          this.context.expects.webAuthEndpoint,
        ).host;
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
    if (
      !Utils.verifyTxSignedBy(
        challenge,
        this.context.expects.tomlObj.SIGNING_KEY,
      )
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_SERVER_SIGNATURE);
      return result;
    }
    return result;
  },
};
tests.push(returnsValidChallengeResponse);

const noAccount: Test = {
  assertion: "rejects requests with no 'account' parameter",
  sep: 10,
  group: getAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
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
      links: {
        "Cross-Origin Resource Sharing (CORS)":
          "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
      },
    },
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return "400 Bad Request is expected for requests without an 'account' parameter";
      },
      links: {
        "SEP-10 Request":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#challenge",
      },
    },
    INVALID_ERROR_SCHEMA: {
      name: "invalid error schema",
      text(_args: any): string {
        return "Error responses must contain an 'error' key and string value";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
    BAD_CONTENT_TYPE: {
      name: "bad content type",
      text(_args: any): string {
        return "Content-Type headers for GET /auth responses must be 'application/json'";
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
      },
    },
  },
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getAuthCall: NetworkCall = {
      request: new Request(this.context.expects.webAuthEndpoint),
    };
    result.networkCalls.push(getAuthCall);
    const responseBody = await makeRequest(
      getAuthCall,
      400,
      result,
      "application/json",
    );
    if (!responseBody) return result;
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
tests.push(noAccount);

const invalidAccount: Test = {
  assertion: "rejects requests with an invalid 'account' parameter",
  sep: 10,
  group: getAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  failureModes: noAccount.failureModes,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getAuthCall: NetworkCall = {
      request: new Request(
        this.context.expects.webAuthEndpoint + "?account=invalid-account",
      ),
    };
    result.networkCalls.push(getAuthCall);
    const responseBody = await makeRequest(
      getAuthCall,
      400,
      result,
      "application/json",
    );
    if (!responseBody) return result;
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
tests.push(invalidAccount);

export const returnsValidJwt: Test = {
  assertion: "returns a valid JWT",
  sep: 10,
  group: postAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {
      token: undefined,
      clientKeypair: undefined,
    },
  },
  failureModes: postChallengeFailureModes,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    this.context.provides.clientKeypair = Keypair.random();

    const sep24AccountSigner = config.sepConfig?.["24"]?.account?.secretKey;
    if (sep24AccountSigner) {
      const signerKeypair = Keypair.fromSecret(sep24AccountSigner);

      // If the optional 'publicKey' value is provided let's use that for the
      // 'clientKeypair', otherwise let's infer the publicKey value from the
      // provided 'secretKey'
      const sep24AccountAddress = config.sepConfig?.["24"]?.account?.publicKey;
      this.context.provides.clientKeypair = sep24AccountAddress
        ? Keypair.fromPublicKey(sep24AccountAddress)
        : signerKeypair;

      const challenge = (await getChallenge(
        this.context.provides.clientKeypair.publicKey(),
        this.context.expects.webAuthEndpoint,
        this.context.expects.tomlObj.NETWORK_PASSPHRASE,
        result,
      )) as Transaction;

      challenge.sign(signerKeypair);

      this.context.provides.token = await postChallenge(
        this.context.provides.clientKeypair,
        this.context.expects.webAuthEndpoint,
        this.context.expects.tomlObj.NETWORK_PASSPHRASE,
        result,
        false,
        challenge,
      );

      return result;
    }

    if (config?.sepConfig?.["31"]?.sendingAnchorClientSecret) {
      this.context.provides.clientKeypair = Keypair.fromSecret(
        config.sepConfig["31"].sendingAnchorClientSecret,
      );
    }

    this.context.provides.token = await postChallenge(
      this.context.provides.clientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );

    return result;
  },
};
tests.push(returnsValidJwt);

const acceptsJson: Test = {
  assertion: "accepts JSON requests",
  sep: 10,
  group: postAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  failureModes: postChallengeFailureModes,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    await postChallenge(
      clientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
      true,
    );
    return result;
  },
};
tests.push(acceptsJson);

const postAuthBadRequest = async (
  result: Result,
  webAuthEndpoint: string,
  requestBody: any,
  unexpectedStatusCodeFailure: Failure,
): Promise<Result> => {
  const postAuthRequest = new Request(webAuthEndpoint, {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: { "Content-Type": "application/json" },
  });
  const postAuthCall: NetworkCall = { request: postAuthRequest };
  result.networkCalls.push(postAuthCall);
  try {
    postAuthCall.response = await fetch(postAuthCall.request.clone());
  } catch {
    result.failure = makeFailure(postChallengeFailureModes.CONNECTION_ERROR, {
      url: postAuthCall.request.url,
    });
    return result;
  }
  if (postAuthCall.response.status !== 400) {
    result.failure = makeFailure(unexpectedStatusCodeFailure);
    result.expected = 400;
    result.actual = postAuthCall.response.status;
    return result;
  }
  return result;
};

const failsWithNoBody: Test = {
  assertion: "fails with no 'transaction' key in the body",
  sep: 10,
  group: postAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  failureModes: {
    CONNECTION_ERROR: getChallengeFailureModes.CONNECTION_ERROR,
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected for requests with no " +
          "'transaction' attribute in the body."
        );
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response-1",
      },
    },
  },
  context: {
    expects: {
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    return await postAuthBadRequest(
      result,
      this.context.expects.webAuthEndpoint,
      {},
      this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
    );
  },
};
tests.push(failsWithNoBody);

const failsWithNoClientSignature: Test = {
  assertion: "fails if the challenge is not signed by the client",
  sep: 10,
  group: postAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  failureModes: {
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected if the challenge " +
          " is not signed by the client."
        );
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response-1",
      },
    },
    ...getChallengeFailureModes,
  },
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const challenge = await getChallenge(
      clientKeypair.publicKey(),
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (!challenge) return result;
    return await postAuthBadRequest(
      result,
      this.context.expects.webAuthEndpoint,
      { transaction: challenge.toXDR() },
      this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
    );
  },
};
tests.push(failsWithNoClientSignature);

const failsWithInvalidTransactionValue: Test = {
  assertion: "fails if the 'transaction' value is invalid",
  sep: 10,
  group: postAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  failureModes: {
    CONNECTION_ERROR: getChallengeFailureModes.CONNECTION_ERROR,
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected if the 'transaction' " +
          "value is not a base64-encoded transaction string."
        );
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response-1",
      },
    },
  },
  context: {
    expects: {
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    return await postAuthBadRequest(
      result,
      this.context.expects.webAuthEndpoint,
      { transaction: { "not a transaction string": true } },
      this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
    );
  },
};
tests.push(failsWithInvalidTransactionValue);

const failsIfChallengeNotSignedByServer: Test = {
  assertion: "fails if the challenge is not signed by SIGNING_KEY",
  sep: 10,
  group: postAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  failureModes: {
    CONNECTION_ERROR: getChallengeFailureModes.CONNECTION_ERROR,
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected if the challenge " +
          " is not signed by the SIGNING_KEY from the TOML."
        );
      },
      links: {
        "SEP-10 Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response-1",
      },
    },
  },
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const anchorHost = new URL(config.homeDomain).host;
    const challengeXdr = Utils.buildChallengeTx(
      clientKeypair,
      clientKeypair.publicKey(),
      anchorHost,
      15,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      anchorHost,
    );
    return await postAuthBadRequest(
      result,
      this.context.expects.webAuthEndpoint,
      { transaction: challengeXdr },
      this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
    );
  },
};
tests.push(failsIfChallengeNotSignedByServer);

const extraClientSigners: Test = {
  assertion:
    "fails if a challenge for a nonexistent account has extra client signatures",
  sep: 10,
  group: postAuthGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  failureModes: {
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return "A 400 Bad Request is expected if the challenge has extra signatures.";
      },
      links: {
        "SEP-10 Challenge Verification":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#verification",
      },
    },
    ...getChallengeFailureModes,
  },
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const challenge = await getChallenge(
      clientKeypair.publicKey(),
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (!challenge) return result;
    challenge.sign(clientKeypair);
    challenge.sign(Keypair.random());
    return await postAuthBadRequest(
      result,
      this.context.expects.webAuthEndpoint,
      { transaction: challenge.toXDR() },
      this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
    );
  },
};
tests.push(extraClientSigners);

const failsIfWeighBelowMediumThreshold: Test = {
  assertion:
    "fails if the challenge signature weight is less than the account's medium threshold",
  sep: 10,
  group: signerSupportGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  failureModes: {
    POST_AUTH_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "A 400 Bad Request is expected if the signature weight on the challenge is not greater than " +
          "or equal to the account's medium threshold."
        );
      },
      links: {
        "SEP-10 Challenge Verification":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#verification",
      },
    },
    ...getChallengeFailureModes,
    ...friendbotFailureModes,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    await friendBot(clientKeypair.publicKey(), result);
    if (result.failure) return result;
    const clientAccountResponse = await loadAccount(
      clientKeypair.publicKey(),
      result,
    );
    if (!clientAccountResponse) return result;
    const clientAccount = new Account(
      clientAccountResponse.account_id,
      clientAccountResponse.sequenceNumber(),
    );
    const raiseThresoldsTx = new TransactionBuilder(clientAccount, {
      fee: "10000",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.setOptions({
          lowThreshold: 2,
          medThreshold: 2,
          highThreshold: 2,
        }),
      )
      .setTimeout(30)
      .build();
    raiseThresoldsTx.sign(clientKeypair);
    const horizonResponse = await submitTransaction(
      raiseThresoldsTx.toXDR(),
      result,
    );
    if (!horizonResponse) return result;
    const challenge = await getChallenge(
      clientKeypair.publicKey(),
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (!challenge) return result;
    challenge.sign(clientKeypair);
    return await postAuthBadRequest(
      result,
      this.context.expects.webAuthEndpoint,
      { transaction: challenge.toXDR() },
      this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE,
    );
  },
};
tests.push(failsIfWeighBelowMediumThreshold);

const signedByNonMasterSigner: Test = {
  assertion: "succeeds with a signature from a non-master signer",
  sep: 10,
  group: signerSupportGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  failureModes: {
    ...postChallengeFailureModes,
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "Challenge transactions signed by non-master signer(s) with weight greater than " +
          "or equal to the account's medium threshold are valid, but the request was rejected."
        );
      },
      links: {
        "SEP-10 Challenge Verification":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#verification",
      },
    },
  },
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const clientSignerKeypair = Keypair.random();
    await friendBot(clientKeypair.publicKey(), result);
    if (result.failure) return result;
    const clientAccountResponse = await loadAccount(
      clientKeypair.publicKey(),
      result,
    );
    if (!clientAccountResponse) return result;
    const clientAccount = new Account(
      clientAccountResponse.account_id,
      clientAccountResponse.sequenceNumber(),
    );
    const raiseThresholdsTx = new TransactionBuilder(clientAccount, {
      fee: "10000",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.setOptions({
          lowThreshold: 1,
          medThreshold: 1,
          highThreshold: 1,
          signer: {
            ed25519PublicKey: clientSignerKeypair.publicKey(),
            weight: 1,
          },
        }),
      )
      .setTimeout(30)
      .build();
    raiseThresholdsTx.sign(clientKeypair);
    await submitTransaction(raiseThresholdsTx.toXDR(), result);
    if (result.failure) return result;
    const challenge = await getChallenge(
      clientKeypair.publicKey(),
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (!challenge) return result;
    challenge.sign(clientSignerKeypair);
    await postChallenge(
      clientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
      false,
      challenge,
    );
    return result;
  },
};
tests.push(signedByNonMasterSigner);

const failsWithDuplicateSignatures: Test = {
  assertion: "fails for challenges signed more than once by the same signer",
  sep: 10,
  group: signerSupportGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  failureModes: {
    ...postChallengeFailureModes,
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "The weight of a signer's signature should only be used once when " +
          "calculating the cumulative weight of the signatures on a challenge. " +
          "Not checking for duplicate signatures enables a signer to get a " +
          "token that can be used for operations the signer is not authenticated " +
          "to perform without signatures from other signers."
        );
      },
      links: {
        "SEP-10 Challenge Verification":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#verification",
      },
    },
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const clientSignerKeypair = Keypair.random();
    await friendBot(clientKeypair.publicKey(), result);
    if (result.failure) return result;
    const clientAccountResponse = await loadAccount(
      clientKeypair.publicKey(),
      result,
    );
    if (!clientAccountResponse) return result;
    const clientAccount = new Account(
      clientAccountResponse.account_id,
      clientAccountResponse.sequenceNumber(),
    );
    const raiseThresholdsTx = new TransactionBuilder(clientAccount, {
      fee: "10000",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.setOptions({
          lowThreshold: 2,
          medThreshold: 2,
          highThreshold: 2,
          signer: {
            ed25519PublicKey: clientSignerKeypair.publicKey(),
            weight: 1,
          },
        }),
      )
      .setTimeout(30)
      .build();
    raiseThresholdsTx.sign(clientKeypair);
    await submitTransaction(raiseThresholdsTx.toXDR(), result);
    if (result.failure) return result;
    const challenge = await getChallenge(
      clientKeypair.publicKey(),
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (!challenge) return result;
    challenge.sign(clientSignerKeypair);
    challenge.sign(clientSignerKeypair);
    await postAuthBadRequest(
      result,
      this.context.expects.webAuthEndpoint,
      { transaction: challenge.toXDR() },
      this.failureModes.UNEXPECTED_STATUS_CODE,
    );
    return result;
  },
};
tests.push(failsWithDuplicateSignatures);

const multipleNonMasterSigners: Test = {
  assertion:
    "returns a token for challenges with sufficient signatures from multiple non-master signers",
  sep: 10,
  group: signerSupportGroup,
  dependencies: [tomlExists, hasWebAuthEndpoint],
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  failureModes: {
    ...postChallengeFailureModes,
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(_args: any): string {
        return (
          "Challenges can be signed by multiple signers to reach the medium threshold of the account. " +
          "However, the SEP-10 server did not return a token for such a challenge."
        );
      },
      links: {
        "SEP-10 Challenge Verification":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#verification",
      },
    },
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const clientSignerKeypair = Keypair.random();
    const clientSigner2Keypair = Keypair.random();
    await friendBot(clientKeypair.publicKey(), result);
    if (result.failure) return result;
    const clientAccountResponse = await loadAccount(
      clientKeypair.publicKey(),
      result,
    );
    if (!clientAccountResponse) return result;
    const clientAccount = new Account(
      clientAccountResponse.account_id,
      clientAccountResponse.sequenceNumber(),
    );
    const raiseThresholdsTx = new TransactionBuilder(clientAccount, {
      fee: "10000",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.setOptions({
          lowThreshold: 2,
          medThreshold: 2,
          highThreshold: 2,
          signer: {
            ed25519PublicKey: clientSignerKeypair.publicKey(),
            weight: 1,
          },
        }),
      )
      .addOperation(
        Operation.setOptions({
          signer: {
            ed25519PublicKey: clientSigner2Keypair.publicKey(),
            weight: 1,
          },
        }),
      )
      .setTimeout(30)
      .build();
    raiseThresholdsTx.sign(clientKeypair);
    await submitTransaction(raiseThresholdsTx.toXDR(), result);
    if (result.failure) return result;
    const challenge = await getChallenge(
      clientKeypair.publicKey(),
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (!challenge) return result;
    challenge.sign(clientSignerKeypair);
    challenge.sign(clientSigner2Keypair);
    await postChallenge(
      clientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
      false,
      challenge,
    );
    return result;
  },
};
tests.push(multipleNonMasterSigners);

export default tests;
