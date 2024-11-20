import { Request } from "node-fetch";
import { validate } from "jsonschema";
import { Keypair, Memo } from "stellar-sdk";

import { Test, Result, Config, NetworkCall } from "../../types";
import { hasDirectPaymentServer } from "../sep31/toml";
import { differentMemosSameAccount } from "../sep12/putCustomer";
import { canCreateQuote } from "../sep38/postQuote";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import {
  getTransactionSchema,
  postTransactionsSchema,
} from "../../schemas/sep31";
import { hasExpectedAssetEnabled } from "../sep31/info";
import { getQuotesSupportedFromInfo } from "../../helpers/sep31";

const postTransactionsGroup = "POST /transactions";
const getTransactionsGroup = "GET /transactions/:id";
const tests: Test[] = [];

let quotesSupported: boolean;

const canCreateTransaction: Test = {
  assertion: "[with SEP-38, quotes_required]  can create a transaction",
  sep: 31,
  group: postTransactionsGroup,
  dependencies: [
    hasDirectPaymentServer,
    hasExpectedAssetEnabled,
    differentMemosSameAccount,
    canCreateQuote,
  ],
  context: {
    expects: {
      directPaymentServerUrl: undefined,
      sendingAnchorClientKeypair: undefined,
      sendingAnchorToken: undefined,
      sendingCustomerId: undefined,
      sep38QuoteResponseObj: undefined,
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
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!config.sepConfig || !config.sepConfig["31"]) {
      // this configuration is checked prior to running tests
      // but to satisfy TypeScript we make these checks here.
      throw "improperly configured";
    }

    let assetCode = config.assetCode;
    if (assetCode === undefined) {
      throw "asset not configured";
    }
    quotesSupported = getQuotesSupportedFromInfo(
      this.context.expects.sep31InfoObj,
      assetCode,
    );

    // If quotes are not supported, ignore this test, this will be addressed in SEP 31 tests
    if (!quotesSupported) {
      this.context.provides.transactionId = null;
      return result;
    }

    const splitAsset =
      this.context.expects.sep38QuoteResponseObj.sell_asset.split(":", 3);
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
            asset_code: splitAsset[1],
            quote_id: this.context.expects.sep38QuoteResponseObj.id,
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
    const responseBody = await makeRequest(
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

const canFetchTransaction: Test = {
  assertion: "[with SEP-38, quotes_required] can fetch a created transaction",
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

    // If quotes are not supported, ignore this test, this will be addressed in SEP 31 tests
    if (!quotesSupported) {
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
  assertion:
    "[with SEP-38, quotes_required] response body complies with protocol schema",
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
    // If quotes are not supported, ignore this test, this will be addressed in SEP 31 tests
    if (!quotesSupported) {
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

export default tests;
