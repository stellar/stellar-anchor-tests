import { Request } from "node-fetch";
import { validate } from "jsonschema";
import { Keypair } from "stellar-sdk";
import { URLSearchParams } from "url";

import { Test, Result, NetworkCall, Config } from "../../types";
import { makeFailure, genericFailures } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import {
  depositSuccessResponseSchema,
  transactionsSchema,
} from "../../schemas/sep6";
import { tomlExists } from "../sep1/tests";
import { postChallenge, postChallengeFailureModes } from "../../helpers/sep10";
import { hasWebAuthEndpoint, returnsValidJwt } from "../sep10/tests";
import { hasTransferServerUrl } from "./toml";
import {
  assetCodeEnabledForDeposit,
  assetCodeEnabledForWithdraw,
} from "./info";
import {
  depositEndpoint,
  returnsProperSchemaForKnownAccounts as returnsProperDepositSchemaForKnownAccounts,
} from "./deposit";
import { returnsProperSchemaForKnownAccounts as returnsProperWithdrawSchemaForKnownAccounts } from "./withdraw";
import { hasProperWithdrawTransactionSchema } from "./transaction";

const transactionsTestGroup = "GET /transactions";
const tests: Test[] = [];

const transactionsEndpoint = "/transactions";

const invalidTransactionsSchema = {
  name: "invalid schema",
  text(args: any): string {
    return (
      "The response body returned does not comply with the schema defined for the /transactions endpoint. " +
      "The errors returned from the schema validation:\n\n" +
      `${args.errors}`
    );
  },
  links: {
    "Transactions Response":
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
  },
};

const transactionsRequiresToken: Test = {
  assertion: "requires a JWT",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    returnsProperDepositSchemaForKnownAccounts,
  ],
  context: {
    expects: {
      sep6DepositTransactionId: undefined,
      sep6TransferServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.sep6DepositTransactionId === null) {
      result.skipped = true;
      return result;
    }
    const transactionsCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl + transactionsEndpoint,
      ),
    };
    result.networkCalls.push(transactionsCall);
    makeRequest(transactionsCall, 403, result);
    return result;
  },
};
tests.push(transactionsRequiresToken);

const transactionsIsPresentAfterDepositRequest: Test = {
  assertion: "has a record on /transactions after a deposit request",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    assetCodeEnabledForDeposit,
    returnsValidJwt,
    returnsProperDepositSchemaForKnownAccounts,
  ],
  context: {
    expects: {
      token: undefined,
      clientKeypair: undefined,
      sep6TransferServerUrl: undefined,
      sep6DepositTransactionId: undefined,
    },
    provides: {
      sep6DepositTransactionsObj: undefined,
    },
  },
  failureModes: {
    TRANSACTION_NOT_FOUND: {
      name: "transaction not found",
      text(args: any): string {
        return `A transaction record with id ${args.id} was not included in the response body.`;
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.sep6DepositTransactionId === null) {
      result.skipped = true;
      return result;
    }
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${
            config.assetCode
          }&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    const transactionsBody = await makeRequest(
      getTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!transactionsBody) return result;
    if (
      !transactionsBody.transactions ||
      !Array.isArray(transactionsBody.transactions)
    ) {
      result.failure = makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
        id: this.context.expects.sep6DepositTransactionId,
      });
      return result;
    }
    let transactionFound = false;
    for (const t of transactionsBody.transactions) {
      if (t.id === this.context.expects.sep6DepositTransactionId) {
        transactionFound = true;
        break;
      }
    }
    if (!transactionFound) {
      result.failure = makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
        id: this.context.expects.sep6DepositTransactionId,
      });
      return result;
    }
    this.context.provides.sep6DepositTransactionsObj = transactionsBody;
    return result;
  },
};
tests.push(transactionsIsPresentAfterDepositRequest);

const transactionsIsPresentAfterWithdrawRequest: Test = {
  assertion: "has a record on /transactions after a withdraw request",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    assetCodeEnabledForWithdraw,
    returnsValidJwt,
    returnsProperWithdrawSchemaForKnownAccounts,
  ],
  context: {
    expects: {
      token: undefined,
      clientKeypair: undefined,
      sep6TransferServerUrl: undefined,
      sep6WithdrawTransactionId: undefined,
    },
    provides: {
      sep6WithdrawTransactionsObj: undefined,
    },
  },
  failureModes: {
    TRANSACTION_NOT_FOUND: {
      name: "transaction not found",
      text(args: any): string {
        return `A transaction record with id ${args.id} was not included in the response body.`;
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.sep6WithdrawTransactionId === null) {
      result.skipped = true;
      return result;
    }
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${
            config.assetCode
          }&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    const transactionsBody = await makeRequest(
      getTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!transactionsBody) return result;
    if (
      !transactionsBody.transactions ||
      !Array.isArray(transactionsBody.transactions)
    ) {
      result.failure = makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
        id: this.context.expects.sep6WithdrawTransactionId,
      });
      return result;
    }
    let transactionFound = false;
    for (const t of transactionsBody.transactions) {
      if (t.id === this.context.expects.sep6WithdrawTransactionId) {
        transactionFound = true;
        break;
      }
    }
    if (!transactionFound) {
      result.failure = makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
        id: this.context.expects.sep6WithdrawTransactionId,
      });
      return result;
    }
    this.context.provides.sep6WithdrawTransactionsObj = transactionsBody;
    return result;
  },
};
tests.push(transactionsIsPresentAfterWithdrawRequest);

const hasProperDepositTransactionsSchema: Test = {
  assertion: "has proper deposit transaction schema on /transactions",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    returnsProperDepositSchemaForKnownAccounts,
    transactionsIsPresentAfterDepositRequest,
  ],
  context: {
    expects: {
      sep6DepositTransactionId: undefined,
      sep6DepositTransactionsObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: invalidTransactionsSchema,
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.sep6DepositTransactionId === null) {
      result.skipped = true;
      return result;
    }
    const validationResult = validate(
      this.context.expects.sep6DepositTransactionsObj,
      transactionsSchema,
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
    }
    return result;
  },
};
tests.push(hasProperDepositTransactionsSchema);

const hasProperWithdrawTransactionsSchema: Test = {
  assertion: "has proper withdraw transaction schema on /transactions",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    returnsProperWithdrawSchemaForKnownAccounts,
    transactionsIsPresentAfterWithdrawRequest,
  ],
  context: {
    expects: {
      sep6WithdrawTransactionId: undefined,
      sep6WithdrawTransactionsObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: invalidTransactionsSchema,
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.sep6WithdrawTransactionId === null) {
      result.skipped = true;
      return result;
    }
    const validationResult = validate(
      this.context.expects.sep6WithdrawTransactionsObj,
      transactionsSchema,
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
    }
    return result;
  },
};
tests.push(hasProperWithdrawTransactionsSchema);

const returnsEmptyListForNewAccount: Test = {
  assertion: "returns an empty list for accounts with no transactions",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    tomlExists,
    hasTransferServerUrl,
    hasWebAuthEndpoint,
    assetCodeEnabledForDeposit,
    returnsValidJwt,
  ],
  context: {
    expects: {
      tomlObj: undefined,
      sep6TransferServerUrl: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  failureModes: {
    LIST_NOT_EMPTY: {
      name: "transactions list is not empty",
      text(_args: any): string {
        return (
          "The transactions returned from /transactions should only be for the authenticated account. " +
          "When an account has not initiated any transactions, /transactions should return an empty list."
        );
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    INVALID_SCHEMA: invalidTransactionsSchema,
    ...postChallengeFailureModes,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const token = await postChallenge(
      clientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (!token) return result;
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${
            config.assetCode
          }&account=${clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    const responseBody = await makeRequest(
      getTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!responseBody) return result;
    const validationResult = validate(responseBody, transactionsSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (responseBody.transactions.length > 0) {
      result.failure = makeFailure(this.failureModes.LIST_NOT_EMPTY);
    }
    return result;
  },
};
tests.push(returnsEmptyListForNewAccount);

const honorsLimitParam: Test = {
  assertion:
    "returns proper number of transactions when 'limit' parameter is given",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    returnsProperDepositSchemaForKnownAccounts,
  ],
  context: {
    expects: {
      sep6DepositTransactionId: undefined,
      sep6TransferServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
    },
    provides: {},
  },
  failureModes: {
    NO_TRANSACTIONS: {
      name: "transaction list empty",
      text(_args: any): string {
        return (
          "No transactions were returned in the /transactions response, but the authenticated " +
          "account has initiated two transactions. " +
          "One transaction was expected because the 'limit=1' parameter was specified."
        );
      },
      links: {
        "Transactions Request":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    LIMIT_NOT_HONORED: {
      name: "limit parameter not honored",
      text(_args: any): string {
        return (
          "Too many transactions were returned in the /transactions response. " +
          "One transaction was expected because the 'limit=1' parameter was specified."
        );
      },
      links: {
        "Transactions Request":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    DEPOSIT_INVALID_SCHEMA:
      returnsProperDepositSchemaForKnownAccounts.failureModes.INVALID_SCHEMA,
    TRANSACTIONS_INVALID_SCHEMA: invalidTransactionsSchema,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (!config.sepConfig || !config.sepConfig["6"])
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    if (!this.context.expects.sep6DepositTransactionId === null) {
      result.skipped = true;
      return result;
    }
    let callParams = new URLSearchParams({
      asset_code: config.assetCode,
      account: this.context.expects.clientKeypair.publicKey(),
      ...config.sepConfig["6"].deposit.transactionFields,
    });
    const getDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          depositEndpoint +
          `?${callParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getDepositCall);
    const depositResponseBody = await makeRequest(
      getDepositCall,
      200,
      result,
      "application/json",
    );
    if (!depositResponseBody) return result;
    const validatorResult = validate(
      depositResponseBody,
      depositSuccessResponseSchema,
    );
    if (validatorResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.DEPOSIT_INVALID_SCHEMA, {
        errors: validatorResult.errors.join("\n"),
      });
      return result;
    }
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${
            config.assetCode
          }&limit=1&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    const transactionsResponseBody = await makeRequest(
      getTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!transactionsResponseBody) return result;
    const transactionsValidatorResult = validate(
      transactionsResponseBody,
      transactionsSchema,
    );
    if (transactionsValidatorResult.errors.length !== 0) {
      result.failure = makeFailure(
        this.failureModes.TRANSACTIONS_INVALID_SCHEMA,
        {
          errors: transactionsValidatorResult.errors.join("\n"),
        },
      );
      return result;
    }
    if (transactionsResponseBody.transactions.length === 0) {
      result.failure = makeFailure(this.failureModes.NO_TRANSACTIONS);
      return result;
    }
    if (transactionsResponseBody.transactions.length > 1) {
      result.failure = makeFailure(this.failureModes.LIMIT_NOT_HONORED);
      result.expected = 1;
      result.actual = transactionsResponseBody.transactions.length;
      return result;
    }
    return result;
  },
};
tests.push(honorsLimitParam);

const transactionsAreInDescendingOrder: Test = {
  assertion: "transactions are returned in descending order of creation",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    assetCodeEnabledForDeposit,
    transactionsIsPresentAfterDepositRequest,
  ],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
    },
    provides: {},
  },
  failureModes: {
    NO_TRANSACTIONS: {
      name: "transaction list empty",
      text(_args: any): string {
        return (
          "No transactions were returned in the /transactions response, but the authenticated " +
          "account has initiated two transactions. " +
          "One transaction was expected because the 'limit=1' parameter was specified."
        );
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    DEPOSIT_INVALID_SCHEMA:
      returnsProperDepositSchemaForKnownAccounts.failureModes.INVALID_SCHEMA,
    TRANSACTIONS_INVALID_SCHEMA: invalidTransactionsSchema,
    MISSING_TRANSACTIONS: {
      name: "missing transactions",
      text(_args: any): string {
        return (
          "More than one transaction has been successfully initiated, but only one transaction was returned. " +
          "A transaction record must be created for every successful POST /deposit request."
        );
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    NOT_DESCENDING_TRANSACTIONS: {
      name: "transaction are not in descending order",
      text(_args: any): string {
        return "The transaction recoreds returned were now in descending order by 'start_time'";
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (!config.sepConfig || !config.sepConfig["6"])
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    const callParams = new URLSearchParams({
      asset_code: config.assetCode,
      account: this.context.expects.clientKeypair.publicKey(),
      ...config.sepConfig["6"].deposit.transactionFields,
    });
    const getDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          depositEndpoint +
          `?${callParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getDepositCall);
    const depositResponseBody = await makeRequest(
      getDepositCall,
      200,
      result,
      "application/json",
    );
    if (!depositResponseBody) return result;
    const validatorResult = validate(
      depositResponseBody,
      depositSuccessResponseSchema,
    );
    if (validatorResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.DEPOSIT_INVALID_SCHEMA, {
        errors: validatorResult.errors.join("\n"),
      });
      return result;
    }
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${
            config.assetCode
          }&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    const transactionsResponseBody = await makeRequest(
      getTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!transactionsResponseBody) return result;
    const transactionsValidatorResult = validate(
      transactionsResponseBody,
      transactionsSchema,
    );
    if (transactionsValidatorResult.errors.length !== 0) {
      result.failure = makeFailure(
        this.failureModes.TRANSACTIONS_INVALID_SCHEMA,
        {
          errors: validatorResult.errors.join("\n"),
        },
      );
      return result;
    }
    if (transactionsResponseBody.transactions.length === 0) {
      result.failure = makeFailure(this.failureModes.NO_TRANSACTIONS);
      return result;
    }
    if (transactionsResponseBody.transactions.length < 2) {
      result.failure = makeFailure(this.failureModes.MISSING_TRANSACTIONS);
      return result;
    }
    const previousStartTime = new Date(
      transactionsResponseBody.transactions[0].started_at,
    );
    for (const transaction of transactionsResponseBody.transactions) {
      const dateTime = new Date(transaction.started_at);
      if (dateTime > previousStartTime) {
        result.failure = makeFailure(
          this.failureModes.NOT_DESCENDING_TRANSACTIONS,
        );
        return result;
      }
    }
    return result;
  },
};
tests.push(transactionsAreInDescendingOrder);

const honorsNoOlderThanParam: Test = {
  assertion:
    "returns proper transactions when 'no_older_than' parameter is given",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    hasProperDepositTransactionsSchema,
    honorsLimitParam,
    transactionsAreInDescendingOrder,
    returnsValidJwt,
  ],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
    },
    provides: {},
  },
  failureModes: {
    NO_TRANSACTIONS: {
      name: "no transactions returned",
      text(_args: any): string {
        return (
          "No transactions were returned, even though a transaction was created after " +
          "the 'no_older_than' parameter given."
        );
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    MISSING_TRANSACTIONS: {
      name: "missing transactions",
      text(_args: any): string {
        return (
          "Three transaction have been successfully initiated, but less than three " +
          "transactions were returned. A transaction record must be created for every " +
          "successful POST /deposit request."
        );
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    MISSING_TRANSACTIONS_NO_OLDER_THAN: {
      name: "missing transactions",
      text(_args: any): string {
        return (
          "Two transaction were initiated at or before the 'no_older_than' parameter given, " +
          "But less than two transactions were returned."
        );
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    TRANSACTION_EARLIER_THAN_PARAM: {
      name: "invalid transaction returned",
      text(_args: any): string {
        return (
          "A transaction that was created earlier than the 'no_older_than' parameter was " +
          "included in the response."
        );
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    TRANSACTIONS_INVALID_SCHEMA: invalidTransactionsSchema,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${
            config.assetCode
          }&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    const allTransactionsBody = await makeRequest(
      getTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!allTransactionsBody) return result;
    if (allTransactionsBody.transactions.length < 3) {
      result.failure = makeFailure(this.failureModes.MISSING_TRANSACTIONS);
      return result;
    }
    const validationResult = validate(allTransactionsBody, transactionsSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(
        this.failureModes.TRANSACTIONS_INVALID_SCHEMA,
        { errors: validationResult.errors.join("\n") },
      );
      return result;
    }
    const notEarliestTransaction =
      allTransactionsBody.transactions[
        allTransactionsBody.transactions.length - 2
      ];
    const getTransactionsOlderThanCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${config.assetCode}&no_older_than=${
            notEarliestTransaction.started_at
          }&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    const noOlderThanBody = await makeRequest(
      getTransactionsOlderThanCall,
      200,
      result,
      "application/json",
    );
    if (!noOlderThanBody) return result;
    const noOlderThanValidationResult = validate(
      noOlderThanBody,
      transactionsSchema,
    );
    if (noOlderThanValidationResult.errors.length !== 0) {
      result.failure = makeFailure(
        this.failureModes.TRANSACTIONS_INVALID_SCHEMA,
        { errors: noOlderThanValidationResult.errors.join("\n") },
      );
      return result;
    }
    if (noOlderThanBody.transactions.length < 2) {
      result.failure = makeFailure(
        this.failureModes.MISSING_TRANSACTIONS_NO_OLDER_THAN,
      );
      return result;
    }
    for (const transaction of noOlderThanBody.transactions) {
      if (
        new Date(transaction.started_at) <
        new Date(notEarliestTransaction.started_at)
      ) {
        result.failure = makeFailure(
          this.failureModes.TRANSACTION_EARLIER_THAN_PARAM,
        );
        return result;
      }
    }
    return result;
  },
};
tests.push(honorsNoOlderThanParam);

const honorsWithdrawTransactionKind: Test = {
  assertion: "only returns withdraw transactions when kind=withdrawal",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    hasProperDepositTransactionsSchema,
    hasProperWithdrawTransactionSchema,
    returnsValidJwt,
  ],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
    },
    provides: {},
  },
  failureModes: {
    BAD_KIND: {
      name: "deposit transaction returned",
      text(_args: any): string {
        return "Deposit transactions should not be returned when kind=withdrawal";
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    NO_TRANSACTIONS: {
      name: "no transactions returned",
      text(_args: any): string {
        return "No transactions were returned, even though a withdraw transaction was created";
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    INVALID_TRANSACTIONS_SCHMEA: invalidTransactionsSchema,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getWithdrawTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${
            config.assetCode
          }&kind=withdrawal&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getWithdrawTransactionsCall);
    const withdrawTransactions = await makeRequest(
      getWithdrawTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!withdrawTransactions) return result;
    const validationResult = validate(withdrawTransactions, transactionsSchema);
    if (validationResult.errors.length !== 0) {
      console.dir(validationResult.errors);
      result.failure = makeFailure(
        this.failureModes.INVALID_TRANSACTIONS_SCHMEA,
        { errors: validationResult.errors.join("\n") },
      );
      return result;
    }
    if (withdrawTransactions.transactions.length === 0) {
      result.failure = makeFailure(this.failureModes.NO_TRANSACTIONS);
      return result;
    }
    for (const transaction of withdrawTransactions.transactions) {
      if (transaction.kind !== "withdrawal") {
        result.failure = makeFailure(this.failureModes.BAD_KIND);
        return result;
      }
    }
    return result;
  },
};
tests.push(honorsWithdrawTransactionKind);

const honorsDepositTransactionKind: Test = {
  assertion: "only returns deposit transactions when kind=deposit",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    hasProperDepositTransactionsSchema,
    hasProperWithdrawTransactionSchema,
    returnsValidJwt,
  ],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
    },
    provides: {},
  },
  failureModes: {
    BAD_KIND: {
      name: "deposit transaction returned",
      text(_args: any): string {
        return "Withdraw transactions should not be returned when kind=deposit";
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    NO_TRANSACTIONS: {
      name: "no transactions returned",
      text(_args: any): string {
        return "No transactions were returned, even though a deposit transaction was created";
      },
      links: {
        "Transactions Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#transaction-history",
      },
    },
    INVALID_TRANSACTIONS_SCHMEA: invalidTransactionsSchema,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getDepositTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=${
            config.assetCode
          }&kind=deposit&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getDepositTransactionsCall);
    const depositTransactions = await makeRequest(
      getDepositTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!depositTransactions) return result;
    const validationResult = validate(depositTransactions, transactionsSchema);
    if (validationResult.errors.length !== 0) {
      console.dir(validationResult.errors);
      result.failure = makeFailure(
        this.failureModes.INVALID_TRANSACTIONS_SCHMEA,
        { errors: validationResult.errors.join("\n") },
      );
      return result;
    }
    if (depositTransactions.transactions.length === 0) {
      result.failure = makeFailure(this.failureModes.NO_TRANSACTIONS);
      return result;
    }
    for (const transaction of depositTransactions.transactions) {
      if (transaction.kind !== "deposit") {
        result.failure = makeFailure(this.failureModes.BAD_KIND);
        return result;
      }
    }
    return result;
  },
};
tests.push(honorsDepositTransactionKind);

const rejectsBadAssetCode: Test = {
  assertion: "rejects requests with a bad 'asset_code' parameter",
  sep: 6,
  group: transactionsTestGroup,
  dependencies: [hasTransferServerUrl, returnsValidJwt],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionsEndpoint +
          `?asset_code=BADCODE&account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    await makeRequest(getTransactionsCall, 400, result);
    return result;
  },
};
tests.push(rejectsBadAssetCode);

export default tests;
