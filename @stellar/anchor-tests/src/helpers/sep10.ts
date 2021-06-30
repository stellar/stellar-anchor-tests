import {
  Transaction,
  TransactionBuilder,
  Keypair,
  FeeBumpTransaction,
} from "stellar-sdk";
import fetch from "node-fetch";
import { Request } from "node-fetch";
import { decode } from "jsonwebtoken";
import { validate } from "jsonschema";

import { Result, Failure, NetworkCall } from "../types";
import { makeFailure } from "./failure";
import { jwtSchema } from "../schemas/sep10";

export const friendbotFailureModes: Record<string, Failure> = {
  FRIENDBOT_CONNECTION_ERROR: {
    name: "connection error",
    text(_args: any): string {
      return (
        "A connection error occured when trying to fund a " +
        "testnet account using friendbot"
      );
    },
  },
  FRIENDBOT_UNEXPECTED_STATUS_CODE: {
    name: "unexpected status code",
    text(_args: any): string {
      return "A 200 Success code is expected for friendbot requests";
    },
  },
};

export const friendBot = async (
  account: string,
  result: Result,
): Promise<void> => {
  const friendBotNetworkCall: NetworkCall = {
    request: new Request(`https://friendbot.stellar.org/?addr=${account}`),
  };
  result.networkCalls.push(friendBotNetworkCall);
  try {
    friendBotNetworkCall.response = await fetch(
      friendBotNetworkCall.request.clone(),
    );
  } catch {
    result.failure = makeFailure(
      friendbotFailureModes.FRIENDBOT_CONNECTION_ERROR,
    );
    return;
  }
  if (friendBotNetworkCall.response.status !== 200) {
    result.failure = makeFailure(
      friendbotFailureModes.FRIENDBOT_UNEXPECTED_STATUS_CODE,
    );
    return;
  }
};

export const getChallengeFailureModes: Record<string, Failure> = {
  NO_TOML: {
    name: "no TOML file",
    text(_args: any): string {
      return "Unable to fetch TOML";
    },
    links: {
      "SEP-1 Specification":
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md",
    },
  },
  NO_WEB_AUTH_ENDPOINT: {
    name: "no WEB_AUTH_ENDPOINT",
    text(_args: any): string {
      return "No WEB_AUTH_ENDPOINT in TOML file";
    },
    links: {
      "SEP-1 Specification":
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md",
    },
  },
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
      return "200 Success is expected for valid requests";
    },
  },
  BAD_CONTENT_TYPE: {
    name: "bad content type",
    text(_args: any): string {
      return "Content-Type headers for responses must be 'application/json'";
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
    links: {
      "SEP-10 Response":
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response",
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
};

export const postChallengeFailureModes: Record<string, Failure> = {
  NO_TOKEN: {
    name: "no token",
    text(_args: any): string {
      return "A 'token' attribute must be present in responses to valid POST /auth requests";
    },
    links: {
      "SEP-10 Token":
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#token",
    },
  },
  JWT_DECODE_FAILURE: {
    name: "JWT decode failure",
    text(args: any): string {
      return (
        "Unable to decode the JWT.\n\n" +
        `The jsonwebtoken library returned: ${args.error}`
      );
    },
    links: {
      "SEP-10 Token":
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#token",
    },
  },
  JWT_NOT_JSON: {
    name: "JWT contents is not JSON",
    text(_args: any): string {
      return "Unable to parse the JWT's contents as JSON";
    },
    links: {
      "SEP-10 Token":
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#token",
    },
  },
  INVALID_JWT_SCHEMA: {
    name: "invalid JWT content schema",
    text(args: any): string {
      return `${args.errors}`;
    },
    links: {
      "SEP-10 Token":
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#token",
    },
  },
  INVALID_JWT_SUB: {
    name: "invalid jwt 'sub' attribute",
    text(_args: any): string {
      return (
        "The 'sub' attribute must be the public key of the account " +
        "authenticating via SEP-10 - the client's public key."
      );
    },
    links: {
      "SEP-10 Token":
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#token",
    },
  },
  ...getChallengeFailureModes,
};

export async function getChallenge(
  clientKeypair: Keypair,
  webAuthEndpoint: string,
  networkPassphrase: string,
  result: Result,
): Promise<Transaction | void> {
  if (!webAuthEndpoint) {
    result.failure = makeFailure(getChallengeFailureModes.NO_WEB_AUTH_ENDPOINT);
    return;
  }
  const getAuthCall: NetworkCall = {
    request: new Request(
      webAuthEndpoint + `?account=${clientKeypair.publicKey()}`,
    ),
  };
  result.networkCalls.push(getAuthCall);
  try {
    getAuthCall.response = await fetch(getAuthCall.request.clone());
  } catch {
    result.failure = makeFailure(getChallengeFailureModes.CONNECTION_ERROR, {
      url: getAuthCall.request.url,
    });
    return;
  }
  if (getAuthCall.response.status !== 200) {
    result.failure = makeFailure(
      getChallengeFailureModes.UNEXPECTED_STATUS_CODE,
    );
    result.expected = 200;
    result.actual = getAuthCall.response.status;
    return;
  }
  const getAuthContentType = getAuthCall.response.headers.get("Content-Type");
  if (!getAuthContentType || !getAuthContentType.includes("application/json")) {
    result.failure = makeFailure(getChallengeFailureModes.BAD_CONTENT_TYPE);
    result.expected = "application/json";
    if (getAuthContentType) result.actual = getAuthContentType;
    return;
  }
  const responseBody = await getAuthCall.response.clone().json();
  if (!responseBody.transaction) {
    result.failure = makeFailure(getChallengeFailureModes.NO_TRANSACTION);
    return;
  }
  let challenge: Transaction | FeeBumpTransaction;
  try {
    challenge = TransactionBuilder.fromXDR(
      responseBody.transaction,
      networkPassphrase,
    );
  } catch {
    result.failure = makeFailure(
      getChallengeFailureModes.DESERIALIZATION_FAILED,
      {
        transaction: responseBody.transaction,
        networkPassphrase: networkPassphrase,
      },
    );
    return;
  }
  if (challenge instanceof FeeBumpTransaction) {
    result.failure = makeFailure(
      getChallengeFailureModes.INVALID_TRANSACTION_TYPE,
    );
    return;
  } else if (challenge.sequence !== "0") {
    result.failure = makeFailure(
      getChallengeFailureModes.NONZERO_SEQUENCE_NUMBER,
    );
    return;
  }
  return challenge;
}

export async function postChallenge(
  clientKeypair: Keypair,
  webAuthEndpoint: string,
  networkPassphrase: string,
  result: Result,
  useJson: boolean = false,
  challenge?: Transaction,
): Promise<string | void> {
  if (!challenge) {
    challenge = (await getChallenge(
      clientKeypair,
      webAuthEndpoint,
      networkPassphrase,
      result,
    )) as Transaction;
    if (!challenge) return;
    challenge.sign(clientKeypair);
  }
  let request: Request;
  if (useJson) {
    request = new Request(webAuthEndpoint, {
      method: "POST",
      body: JSON.stringify({ transaction: challenge.toXDR() }),
      headers: { "Content-Type": "application/json" },
    });
  } else {
    request = new Request(webAuthEndpoint, {
      method: "POST",
      body: `transaction=${encodeURIComponent(challenge.toXDR())}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }
  const postAuthCall: NetworkCall = { request: request };
  result.networkCalls.push(postAuthCall);
  try {
    postAuthCall.response = await fetch(postAuthCall.request.clone());
  } catch {
    result.failure = makeFailure(postChallengeFailureModes.CONNECTION_ERROR, {
      url: postAuthCall.request.url,
    });
    return;
  }
  if (postAuthCall.response.status !== 200) {
    result.failure = makeFailure(
      postChallengeFailureModes.UNEXPECTED_STATUS_CODE,
    );
    result.expected = 200;
    result.actual = postAuthCall.response.status;
    return;
  }
  const postAuthResponseContentType =
    postAuthCall.response.headers.get("Content-Type");
  if (
    !postAuthResponseContentType ||
    !postAuthResponseContentType.includes("application/json")
  ) {
    result.failure = makeFailure(postChallengeFailureModes.BAD_CONTENT_TYPE);
    result.expected = "application/json";
    if (postAuthResponseContentType)
      result.actual = postAuthResponseContentType;
    return;
  }
  const responseBody = await postAuthCall.response.clone().json();
  if (!responseBody.token) {
    result.failure = makeFailure(postChallengeFailureModes.NO_TOKEN);
    return;
  }
  let jwtContents;
  try {
    jwtContents = decode(responseBody.token);
  } catch (e) {
    result.failure = makeFailure(postChallengeFailureModes.JWT_DECODE_FAILURE, {
      error: e.message,
    });
    return;
  }
  if (!jwtContents || typeof jwtContents !== "object") {
    result.failure = makeFailure(postChallengeFailureModes.JWT_NOT_JSON);
    return;
  }
  const validatorResult = validate(jwtContents, jwtSchema);
  if (validatorResult.errors.length !== 0) {
    result.failure = makeFailure(postChallengeFailureModes.INVALID_JWT_SCHEMA, {
      errors: validatorResult.errors.join("\n"),
    });
    return;
  }
  try {
    Keypair.fromPublicKey(jwtContents.sub);
  } catch {
    result.failure = makeFailure(postChallengeFailureModes.INVALID_JWT_SUB);
    return;
  }
  return responseBody.token;
}
