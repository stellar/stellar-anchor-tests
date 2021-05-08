import fetch from "node-fetch";
import { Request } from "node-fetch";
import { AccountResponse, Horizon } from "stellar-sdk";

import { Result, NetworkCall } from "../types";
import {
  makeFailure,
  connectionFailure,
  unexpectedStatusCode,
} from "./failure";

const testnetHorizon = "https://horizon-testnet.stellar.org";
const pubnetHorizon = "https://horizon.stellar.org";

export const loadAccount = async (
  account: string,
  result: Result,
  pubnet: boolean = false,
): Promise<AccountResponse | void> => {
  const horizon = pubnet ? pubnetHorizon : testnetHorizon;
  const networkCall: NetworkCall = {
    request: new Request(horizon + `/accounts/${account}`),
  };
  result.networkCalls.push(networkCall);
  await makeRequest(networkCall, result);
  if (!networkCall.response) return;
  const responseJson = await networkCall.response.clone().json();
  return new AccountResponse(responseJson);
};

export const submitTransaction = async (
  transaction: string,
  result: Result,
  pubnet: boolean = false,
): Promise<Horizon.SubmitTransactionResponse | void> => {
  const horizon = pubnet ? pubnetHorizon : testnetHorizon;
  const networkCall: NetworkCall = {
    request: new Request(horizon + `/transactions`, {
      method: "POST",
      body: `tx=${encodeURIComponent(transaction)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),
  };
  result.networkCalls.push(networkCall);
  await makeRequest(networkCall, result);
  if (!networkCall.response || result.failure) return;
  const responseJson = await networkCall.response.clone().json();
  return responseJson;
};

const makeRequest = async (
  networkCall: NetworkCall,
  result: Result,
): Promise<void> => {
  try {
    networkCall.response = await fetch(networkCall.request.clone());
  } catch (e) {
    result.failure = makeFailure(connectionFailure, {
      url: networkCall.request.url,
    });
    return;
  }
  if (networkCall.response.status !== 200) {
    result.failure = makeFailure(unexpectedStatusCode, {
      url: networkCall.request.url,
    });
    result.expected = 200;
    result.actual = networkCall.response.status;
    return;
  }
  return;
};
