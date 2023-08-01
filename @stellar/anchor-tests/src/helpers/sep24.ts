import { Request } from "node-fetch";

import { Result, NetworkCall, Failure } from "../types";
import { makeRequest } from "./request";

export const invalidTransactionSchema: Failure = {
  name: "invalid transaction schema",
  text(args: any): string {
    return (
      "The response body returned does not comply with the schema defined for the /transaction endpoint. " +
      "The errors returned from the schema validation:\n\n" +
      `${args.errors}.`
    );
  },
  links: {
    "Transaction Schema":
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#single-historical-transaction",
  },
};

export const unexpectedTransactionStatus: Failure = {
  name: "unexpected transaction status",
  text(args: any): string {
    return `Unexpected transaction status. Expected '${args.expected}' but received '${args.received}' instead.`;
  },
};

export const missingConfigFile: Failure = {
  name: "missing config file",
  text(args: any): string {
    return `The ${args.sep} configuration object is missing. Please make sure to upload a config file containing a ${args.sep} configuration object in order for this test to run.`;
  },
};

export const invalidConfigFile: Failure = {
  name: "invalid config file",
  text(args: any): string {
    return "The UPLOAD CONFIG file has some issues:\n\n" + `${args.errors}.`;
  },
};

export const fetchTransaction = async ({
  transferServerUrl,
  transactionId,
  stellarTransactionId,
  authToken,
  result,
}: {
  transferServerUrl: string;
  transactionId?: string;
  stellarTransactionId?: string;
  authToken: string;
  result: Result;
}) => {
  const idQuery = stellarTransactionId
    ? `stellar_transaction_id=${stellarTransactionId}`
    : `id=${transactionId}`;

  const getTransactionCall: NetworkCall = {
    request: new Request(transferServerUrl + `/transaction?${idQuery}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }),
  };
  result.networkCalls.push(getTransactionCall);
  const response = await makeRequest(
    getTransactionCall,
    200,
    result,
    "application/json",
  );

  return response;
};
