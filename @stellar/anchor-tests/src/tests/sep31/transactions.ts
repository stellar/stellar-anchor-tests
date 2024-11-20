import { Request } from "node-fetch";
import { validate } from "jsonschema";
import { Keypair, Memo } from "stellar-sdk";

import { Test, Result, Config, NetworkCall } from "../../types";
import { hasDirectPaymentServer } from "./toml";
import { differentMemosSameAccount } from "../sep12/putCustomer";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { getQuotesRequiredFromInfo } from "../../helpers/sep31";
import {
  postTransactionsSchema,
  getTransactionSchema,
} from "../../schemas/sep31";
import { hasExpectedAssetEnabled } from "./info";
import { URLSearchParams } from "url";
import { hasKycServerUrl } from "../sep12/toml";

const postTransactionsGroup = "POST /transactions";
const getTransactionsGroup = "GET /transactions/:id";
const tests: Test[] = [];

const requiresJwt: Test = {
  assertion: "requires a SEP-10 JWT",
  sep: 31,
  group: postTransactionsGroup,
  dependencies: [hasDirectPaymentServer],
  context: {
    expects: {
      directPaymentServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.directPaymentServerUrl + "/transactions",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      ),
    };
    result.networkCalls.push(postTransactionsCall);
    await makeRequest(postTransactionsCall, 403, result);
    return result;
  },
};
tests.push(requiresJwt);

let quotesRequired: boolean;

const canCreateTransaction: Test = {
  assertion: "can create a transaction",
  sep: 31,
  group: postTransactionsGroup,
  dependencies: [
    hasDirectPaymentServer,
    hasKycServerUrl,
    hasExpectedAssetEnabled,
    differentMemosSameAccount,
  ],
  context: {
    expects: {
      directPaymentServerUrl: undefined,
      kycServerUrl: undefined,
      sendingAnchorClientKeypair: undefined,
      sendingAnchorToken: undefined,
      sendingCustomerId: undefined,
      receivingCustomerId: undefined,
      sep31InfoObj: undefined,
    },
    provides: {
      transactionId: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body from POST /transactions does not match " +
          "the schema defined by the protocol. " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "POST Transaction Schema":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#post-transactions",
      },
    },
    CUSTOMER_NOT_ACCEPTED: {
      name: "customer's status not accepted",
      text(args: any): string {
        return (
          "Timed out waiting for customer(s) specified for the SEP31 transaction to be in " +
          "'ACCEPTED' status " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!config.sepConfig || !config.sepConfig["31"]) {
      // this configuration is checked prior to running tests
      // but to satisfy TypeScript we make these checks here.
      throw "improperly configured";
    }

    async function pollCustomerAccepted(
      getCustomerNetworkCall: NetworkCall,
      timeout: number,
    ) {
      let startedAt = Date.now();
      let timeoutMs = timeout * 1000;
      while (startedAt + timeoutMs > Date.now()) {
        const resBody = await makeRequest(
          getCustomerNetworkCall,
          200,
          result,
          "application/json",
        );
        if (resBody.status === "ACCEPTED") {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      let customerId = getCustomerNetworkCall.request.url.split("id=")[1];
      throw `timed out pulling customer ${customerId} for ACCEPTED status`;
    }

    function generateGetCustomerNetworkCall(
      kycServerUrl: string,
      customerId: string,
      token: string,
    ): NetworkCall {
      const requestParamsObj: Record<string, string> = {
        id: customerId,
      };

      const customerType =
        config?.sepConfig?.["12"]?.customers?.[
          config?.sepConfig?.["12"]?.createCustomer
        ].type;

      if (customerType) requestParamsObj["type"] = customerType;
      const searchParams = new URLSearchParams(requestParamsObj);

      const getCustomerCall: NetworkCall = {
        request: new Request(
          kycServerUrl + `/customer?${searchParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      };
      return getCustomerCall;
    }

    const getSendingCustomerNetworkCall = generateGetCustomerNetworkCall(
      this.context.expects.kycServerUrl,
      this.context.expects.sendingCustomerId,
      this.context.expects.sendingAnchorToken,
    );

    const getReceivingCustomerNetworkCall = generateGetCustomerNetworkCall(
      this.context.expects.kycServerUrl,
      this.context.expects.receivingCustomerId,
      this.context.expects.sendingAnchorToken,
    );

    const customerPollingTimeout =
      config.sepConfig["31"].customerPollingTimeout || 30;

    try {
      await Promise.all([
        pollCustomerAccepted(
          getReceivingCustomerNetworkCall,
          customerPollingTimeout,
        ),
        pollCustomerAccepted(
          getSendingCustomerNetworkCall,
          customerPollingTimeout,
        ),
      ]);
    } catch (err) {
      result.failure = makeFailure(this.failureModes.CUSTOMER_NOT_ACCEPTED, {
        errors: err,
      });
      return result;
    }

    const postTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.directPaymentServerUrl + "/transactions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.context.expects.sendingAnchorToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_id: this.context.expects.sendingCustomerId,
            receiver_id: this.context.expects.receivingCustomerId,
            amount: 100,
            asset_code: config.assetCode,
            funding_method: "SEPA",
            fields: {
              transaction: {
                ...config.sepConfig["31"].transactionFields,
              },
            },
          }),
        },
      ),
    };
    result.networkCalls.push(postTransactionsCall);

    let assetCode = config.assetCode;
    if (assetCode === undefined) {
      throw "asset not configured";
    }
    quotesRequired = getQuotesRequiredFromInfo(
      this.context.expects.sep31InfoObj,
      assetCode,
    );

    // If quotes are required, ignore this test, this will be addressed in SEP 31+38 tests
    if (quotesRequired) {
      await makeRequest(postTransactionsCall, 400, result, "application/json");
      this.context.provides.transactionId = null;
      return result;
    }

    // if quotes are not required, test this as usual.
    let responseBody = await makeRequest(
      postTransactionsCall,
      201,
      result,
      "application/json",
    );
    if (!responseBody) return result;
    const validationResult = validate(responseBody, postTransactionsSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    try {
      if (responseBody.stellar_account_id) {
        Keypair.fromPublicKey(responseBody.stellar_account_id);
      }
    } catch {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: "'stellar_account_id' must be a valid Stellar public key",
      });
      return result;
    }
    let memoValue = responseBody.stellar_memo;
    if (responseBody.stellar_memo_type === "hash") {
      memoValue = Buffer.from(responseBody.stellar_memo, "base64");
    }
    try {
      if (memoValue) {
        new Memo(responseBody.stellar_memo_type, memoValue);
      }
    } catch {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: "invalid 'stellar_memo' for 'stellar_memo_type'",
      });
      return result;
    }
    this.context.provides.transactionId = responseBody.id;
    return result;
  },
};
tests.push(canCreateTransaction);

const failsWithNoAmount: Test = {
  assertion: "returns 400 when no amount is given",
  sep: 31,
  group: postTransactionsGroup,
  dependencies: [canCreateTransaction],
  context: {
    expects: {
      sendingAnchorToken: undefined,
      directPaymentServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!config.sepConfig || !config.sepConfig["31"]) {
      // this configuration is checked prior to running tests
      // but to satisfy TypeScript we make these checks here.
      throw "improperly configured";
    }
    const postTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.directPaymentServerUrl + "/transactions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.context.expects.sendingAnchorToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_id: this.context.expects.sendingCustomerId,
            receiver_id: this.context.expects.receivingCustomerId,
            asset_code: config.assetCode,
            funding_method: "SEPA",
            fields: {
              transaction: {
                ...config.sepConfig["31"].transactionFields,
              },
            },
          }),
        },
      ),
    };
    result.networkCalls.push(postTransactionsCall);
    await makeRequest(postTransactionsCall, 400, result, "application/json");
    return result;
  },
};
tests.push(failsWithNoAmount);

const failsWithNoAssetCode: Test = {
  assertion: "returns 400 when no asset_code is given",
  sep: 31,
  group: postTransactionsGroup,
  dependencies: [canCreateTransaction],
  context: {
    expects: {
      sendingAnchorToken: undefined,
      directPaymentServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!config.sepConfig || !config.sepConfig["31"]) {
      // this configuration is checked prior to running tests
      // but to satisfy TypeScript we make these checks here.
      throw "improperly configured";
    }
    const postTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.directPaymentServerUrl + "/transactions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.context.expects.sendingAnchorToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_id: this.context.expects.sendingCustomerId,
            receiver_id: this.context.expects.receivingCustomerId,
            amount: 100,
            funding_method: "SEPA",
            fields: {
              transaction: {
                ...config.sepConfig["31"].transactionFields,
              },
            },
          }),
        },
      ),
    };
    result.networkCalls.push(postTransactionsCall);
    await makeRequest(postTransactionsCall, 400, result, "application/json");
    return result;
  },
};
tests.push(failsWithNoAssetCode);

const canFetchTransaction: Test = {
  assertion: "can fetch a created transaction",
  sep: 31,
  group: getTransactionsGroup,
  dependencies: [hasDirectPaymentServer, canCreateTransaction],
  context: {
    expects: {
      sendingAnchorToken: undefined,
      directPaymentServerUrl: undefined,
      transactionId: undefined,
    },
    provides: {
      transactionJson: undefined,
    },
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };

    // If quotes are required, ignore this test, this will be addressed in SEP 31+38 tests
    if (quotesRequired) {
      this.context.provides.transactionJson = null;
      return result;
    }

    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.directPaymentServerUrl +
          `/transactions/${this.context.expects.transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.sendingAnchorToken}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionCall);
    this.context.provides.transactionJson = await makeRequest(
      getTransactionCall,
      200,
      result,
      "application/json",
    );
    return result;
  },
};
tests.push(canFetchTransaction);

const hasValidTransactionJson: Test = {
  assertion: "response body complies with protocol schema",
  sep: 31,
  group: getTransactionsGroup,
  dependencies: [canFetchTransaction],
  context: {
    expects: {
      transactionId: undefined,
      transactionJson: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body from GET /transactions/:id does not match " +
          "the schema defined by the protocol. " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "Transactions Schema":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#get-transaction",
      },
    },
    INVALID_ID: {
      name: "invalid 'id'",
      text(_args: any): string {
        return "The 'id' value returned in the response body does match the ID used to fetch the transaction";
      },
      links: {
        "Transactions Schema":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#get-transaction",
      },
    },
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    // If quotes are required, ignore this test, this will be addressed in SEP 31+38 tests
    if (quotesRequired) {
      this.context.provides.transactionJson = null;
      return result;
    }
    const validationResult = validate(
      this.context.expects.transactionJson,
      getTransactionSchema,
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (
      this.context.expects.transactionId !==
      this.context.expects.transactionJson.transaction.id
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_ID);
      result.expected = this.context.expects.transactionId;
      result.actual = this.context.expects.transactionJson.transaction.id;
      return result;
    }
    return result;
  },
};
tests.push(hasValidTransactionJson);

const returns404ForBadId: Test = {
  assertion: "returns 404 for a non-existent transaction",
  sep: 31,
  group: getTransactionsGroup,
  dependencies: [hasDirectPaymentServer, differentMemosSameAccount],
  context: {
    expects: {
      sendingAnchorToken: undefined,
      directPaymentServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.directPaymentServerUrl + `/transactions/not-an-id`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.sendingAnchorToken}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionCall);
    await makeRequest(getTransactionCall, 404, result);
    return result;
  },
};
tests.push(returns404ForBadId);

export default tests;
