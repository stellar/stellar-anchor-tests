import { Request } from "node-fetch";
import { validate } from "jsonschema";

import { Test, Config, Result, NetworkCall, Failure } from "../../types";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { returnsValidJwt } from "../sep10/tests";
import { hasTransferServerUrl } from "./toml";
import { assetCodeEnabledForDeposit } from "./info";
import { returnsProperSchemaForKnownAccounts as returnsProperDepositSchemaForKnownAccounts } from "./deposit";
import { returnsProperSchemaForKnownAccounts as returnsProperWithdrawSchemaForKnownAccounts } from "./withdraw";
import { getTransactionSchema } from "../../schemas/sep6";

const transactionEndpoint = "/transaction";
const transactionTestGroup = "GET /transaction";
const tests: Test[] = [];

const invalidTransactionSchema: Failure = {
  name: "invalid schema",
  text(args: any): string {
    return (
      "The response body returned does not comply with the schema defined for the /transaction endpoint:\n\n" +
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#single-historical-transaction\n\n" +
      "The errors returned from the schema validation:\n\n" +
      `${args.errors}`
    );
  },
};

const requiresJwt: Test = {
  assertion: "requires a JWT",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    assetCodeEnabledForDeposit,
    returnsProperDepositSchemaForKnownAccounts,
  ],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      sep6InfoObj: undefined,
      sep6DepositTransactionId: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.sep6TransactionId === null) {
      result.skipped = true;
      return result;
    }
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionEndpoint +
          `?id=${this.context.expects.sep6DepositTransactionId}`,
      ),
    };
    await makeRequest(getTransactionCall, 403, result);
    return result;
  },
};
tests.push(requiresJwt);

const transactionIsPresentAfterDepositRequest: Test = {
  assertion: "has a record on /transaction after a deposit request",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsProperDepositSchemaForKnownAccounts,
  ],
  context: {
    expects: {
      token: undefined,
      sep6TransferServerUrl: undefined,
      sep6DepositTransactionId: undefined,
    },
    provides: {
      sep6DepositTransactionObj: undefined,
    },
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!this.context.expects.sep6DepositTransactionId === null) {
      result.skipped = true;
      return result;
    }
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionEndpoint +
          `?id=${this.context.expects.sep6DepositTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionCall);
    this.context.provides.sep6DepositTransactionObj = await makeRequest(
      getTransactionCall,
      200,
      result,
      "application/json",
    );
    return result;
  },
};
tests.push(transactionIsPresentAfterDepositRequest);

const transactionIsPresentAfterWithdrawRequest: Test = {
  assertion: "has a record on /transaction after a withdraw request",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsProperWithdrawSchemaForKnownAccounts,
  ],
  context: {
    expects: {
      token: undefined,
      sep6TransferServerUrl: undefined,
      sep6WithdrawTransactionId: undefined,
    },
    provides: {
      sep6WithdrawTransactionObj: undefined,
    },
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionEndpoint +
          `?id=${this.context.expects.sep6WithdrawTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionCall);
    this.context.provides.sep6WithdrawTransactionObj = await makeRequest(
      getTransactionCall,
      200,
      result,
      "application/json",
    );
    return result;
  },
};
tests.push(transactionIsPresentAfterWithdrawRequest);

const hasProperDepositTransactionSchema: Test = {
  assertion: "has proper deposit transaction schema on /transaction",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [
    returnsProperDepositSchemaForKnownAccounts,
    transactionIsPresentAfterDepositRequest,
  ],
  context: {
    expects: {
      sep6DepositTransactionId: undefined,
      sep6DepositTransactionObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: invalidTransactionSchema,
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const validationResult = validate(
      this.context.expects.depositTransactionObj,
      getTransactionSchema(true),
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
    }
    return result;
  },
};
tests.push(hasProperDepositTransactionSchema);

export const hasProperWithdrawTransactionSchema: Test = {
  assertion: "has proper withdraw transaction schema on /transaction",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [
    returnsProperWithdrawSchemaForKnownAccounts,
    transactionIsPresentAfterWithdrawRequest,
  ],
  context: {
    expects: {
      sep6WithdrawTransactionId: undefined,
      sep6WithdrawTransactionObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: invalidTransactionSchema,
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const validationResult = validate(
      this.context.expects.depositTransactionObj,
      getTransactionSchema(false),
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
    }
    return result;
  },
};
tests.push(hasProperWithdrawTransactionSchema);

const returns404ForBadId: Test = {
  assertion: "returns 404 for a nonexistent transaction ID",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [hasTransferServerUrl, returnsValidJwt],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionEndpoint +
          "?id=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    await makeRequest(getTransactionCall, 404, result);
    return result;
  },
};
tests.push(returns404ForBadId);

const returns404ForBadExternalId: Test = {
  assertion: "returns 404 for a nonexistent external transaction ID",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [hasTransferServerUrl, returnsValidJwt],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionEndpoint +
          "?external_transaction_id=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    await makeRequest(getTransactionCall, 404, result);
    return result;
  },
};
tests.push(returns404ForBadExternalId);

const returns404ForBadStellarId: Test = {
  assertion: "returns 404 for a nonexistent Stellar transaction ID",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [hasTransferServerUrl, returnsValidJwt],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionEndpoint +
          "?stellar_transaction_id=021581089cb614be94b0ac5dc71cadf23a1cd96a2584152268de505ee2e5e999",
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    await makeRequest(getTransactionCall, 404, result);
    return result;
  },
};
tests.push(returns404ForBadStellarId);

export default tests;
