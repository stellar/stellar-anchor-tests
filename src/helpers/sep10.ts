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

import { Result, Failure, NetworkCall, Config, Suite } from "../types";
import { makeFailure } from "./failure";
import { jwtSchema } from "../schemas/sep10";
import { noTomlFailure } from "./sep1";

export const invalidWebAuthEndpointFailure: Failure = {
  name: "invalid WEB_AUTH_ENDPOINT",
  text(_args: any): string {
    return "The TOML file's WEB_AUTH_ENDPOINT was either not present or invalid";
  },
};

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

export const getWebAuthEndpointFailureModes: Record<string, Failure> = {
  NO_TOML: noTomlFailure,
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
};

export const testWebAuthEndpoint = async (
  _config: Config,
  suite: Suite,
): Promise<Result> => {
  const result: Result = { networkCalls: [] };
  if (!suite.context.tomlObj.WEB_AUTH_ENDPOINT) {
    result.failure = makeFailure(
      getWebAuthEndpointFailureModes.WEB_AUTH_ENDPOINT_NOT_FOUND,
    );
    return result;
  }
  if (!suite.context.tomlObj.WEB_AUTH_ENDPOINT.startsWith("https")) {
    result.failure = makeFailure(getWebAuthEndpointFailureModes.NO_HTTPS);
    return result;
  }
  if (suite.context.tomlObj.WEB_AUTH_ENDPOINT.slice(-1) === "/") {
    result.failure = makeFailure(
      getWebAuthEndpointFailureModes.ENDS_WITH_SLASH,
    );
    return result;
  }
  return result;
};

export const checkWebAuthEndpoint = async (
  config: Config,
  suite: Suite,
): Promise<Result | void> => {
  const result = await testWebAuthEndpoint(config, suite);
  if (!result.failure) return;
  if (
    result.failure.name !== getWebAuthEndpointFailureModes.ENDS_WITH_SLASH.name
  ) {
    result.failure = invalidWebAuthEndpointFailure;
    return result;
  }
  suite.context.tomlObj.WEB_AUTH_ENDPOINT = suite.context.tomlObj.WEB_AUTH_ENDPOINT.slice(
    0,
    -1,
  );
};

export const getChallengeFailureModes: Record<string, Failure> = {
  NO_TOML: {
    name: "no TOML file",
    text(_args: any): string {
      return "Unable to fetch TOML";
    },
  },
  NO_WEB_AUTH_ENDPOINT: {
    name: "no WEB_AUTH_ENDPOINT",
    text(_args: any): string {
      return "No WEB_AUTH_ENDPOINT in TOML file";
    },
  },
  INVALID_WEB_AUTH_ENDPOINT: invalidWebAuthEndpointFailure,
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
        "See here for more information:\n\n" +
        "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response"
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
};

export const postChallengeFailureModes: Record<string, Failure> = {
  NO_TOKEN: {
    name: "no token",
    text(_args: any): string {
      return "A 'token' attribute must be present in responses to valid POST /auth requests";
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
  },
  JWT_NOT_JSON: {
    name: "JWT contents is not JSON",
    text(_args: any): string {
      return "jsonwebtoken was unable to parse the JWT's contents as JSON";
    },
  },
  INVALID_JWT_SCHEMA: {
    name: "invalid JWT content schema",
    text(args: any): string {
      return `${args.errors}`;
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
  },
  ...getChallengeFailureModes,
};

export async function getChallenge(
  clientKeypair: Keypair,
  tomlObj: any,
  result: Result,
): Promise<Transaction | void> {
  if (!tomlObj) {
    result.failure = makeFailure(getChallengeFailureModes.NO_TOML);
    return;
  } else if (!tomlObj.WEB_AUTH_ENDPOINT) {
    result.failure = makeFailure(getChallengeFailureModes.NO_WEB_AUTH_ENDPOINT);
    return;
  }
  const getAuthCall: NetworkCall = {
    request: new Request(
      tomlObj.WEB_AUTH_ENDPOINT + `?account=${clientKeypair.publicKey()}`,
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
  if (!getAuthContentType || getAuthContentType !== "application/json") {
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
      tomlObj.NETWORK_PASSPHRASE,
    );
  } catch {
    result.failure = makeFailure(
      getChallengeFailureModes.DESERIALIZATION_FAILED,
      {
        transaction: responseBody.transaction,
        networkPassphrase: tomlObj.NETWORK_PASSPHRASE,
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
  tomlObj: any,
  result: Result,
  useJson: boolean = false,
  challenge?: Transaction,
): Promise<string | void> {
  if (!challenge) {
    challenge = (await getChallenge(
      clientKeypair,
      tomlObj,
      result,
    )) as Transaction;
    challenge.sign(clientKeypair);
  }
  if (!challenge) return;
  let request: Request;
  if (useJson) {
    request = new Request(tomlObj.WEB_AUTH_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ transaction: challenge.toXDR() }),
      headers: { "Content-Type": "application/json" },
    });
  } else {
    request = new Request(tomlObj.WEB_AUTH_ENDPOINT, {
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
  const postAuthResponseContentType = postAuthCall.response.headers.get(
    "Content-Type",
  );
  if (
    !postAuthResponseContentType ||
    postAuthResponseContentType !== "application/json"
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
