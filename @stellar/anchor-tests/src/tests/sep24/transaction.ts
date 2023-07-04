import { Request } from "node-fetch";
import { validate } from "jsonschema";

import { Test, Config, Result, NetworkCall } from "../../types";
import { getConfigFileSchema, getTransactionSchema } from "../../schemas/sep24";
import { makeRequest } from "../../helpers/request";
import { genericFailures, makeFailure } from "../../helpers/failure";
import {
  fetchTransaction,
  invalidConfigFile,
  invalidTransactionSchema,
  unexpectedTransactionStatus,
} from "../../helpers/sep24";
import { hasTransferServerUrl } from "./toml";
import { returnsValidJwt } from "../sep10/tests";
import { returnsProperSchemaForValidDepositRequest } from "./deposit";
import { returnsProperSchemaForValidWithdrawRequest } from "./withdraw";

const transactionEndpoint = "/transaction";
const transactionTestGroup = "/transaction";
const tests: Test[] = [];

const transactionRequiresToken: Test = {
  assertion: "requires a SEP-10 JWT on /transaction",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [hasTransferServerUrl, returnsValidJwt],
  context: {
    expects: {
      transferServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const transactionCall = {
      request: new Request(
        this.context.expects.transferServerUrl + transactionEndpoint,
      ),
    };
    result.networkCalls.push(transactionCall);
    makeRequest(transactionCall, 403, result);
    return result;
  },
};
tests.push(transactionRequiresToken);

const transactionIsPresentAfterDepositRequest: Test = {
  assertion: "has a record on /transaction after a deposit request",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    returnsProperSchemaForValidDepositRequest,
  ],
  context: {
    expects: {
      token: undefined,
      transferServerUrl: undefined,
      depositTransactionId: undefined,
    },
    provides: {
      depositTransactionObj: undefined,
    },
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };

    this.context.provides.depositTransactionObj = await fetchTransaction({
      transferServerUrl: this.context.expects.transferServerUrl,
      transactionId: this.context.expects.depositTransactionId,
      authToken: this.context.expects.token,
      result,
    });

    return result;
  },
};
tests.push(transactionIsPresentAfterDepositRequest);

const transactionIsPresentAfterWithdrawRequest: Test = {
  assertion: "has a record on /transaction after a withdraw request",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    returnsProperSchemaForValidWithdrawRequest,
  ],
  context: {
    expects: {
      token: undefined,
      transferServerUrl: undefined,
      withdrawTransactionId: undefined,
    },
    provides: {
      withdrawTransactionObj: undefined,
    },
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };

    this.context.provides.withdrawTransactionObj = await fetchTransaction({
      transferServerUrl: this.context.expects.transferServerUrl,
      transactionId: this.context.expects.withdrawTransactionId,
      authToken: this.context.expects.token,
      result,
    });

    return result;
  },
};
tests.push(transactionIsPresentAfterWithdrawRequest);

export const hasProperIncompleteDepositTransactionSchema: Test = {
  assertion:
    "has proper 'incomplete' deposit transaction schema on /transaction",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [
    returnsProperSchemaForValidDepositRequest,
    transactionIsPresentAfterDepositRequest,
  ],
  context: {
    expects: {
      depositTransactionId: undefined,
      depositTransactionObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: invalidTransactionSchema,
    UNEXPECTED_STATUS: unexpectedTransactionStatus,
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const validationResult = validate(
      this.context.expects.depositTransactionObj,
      getTransactionSchema(true, false, false),
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });

      return result;
    }

    const transactionStatus =
      this.context.expects.depositTransactionObj.transaction.status;
    if (transactionStatus !== "incomplete") {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS, {
        expected: "incomplete",
        received: transactionStatus,
      });
    }
    return result;
  },
};
tests.push(hasProperIncompleteDepositTransactionSchema);

const hasProperPendingDepositTransactionSchema: Test = {
  assertion: "has proper 'pending_' deposit transaction schema on /transaction",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    returnsProperSchemaForValidDepositRequest,
  ],
  context: {
    expects: {
      transferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_CONFIG: invalidConfigFile,
    INVALID_SCHEMA: invalidTransactionSchema,
    UNEXPECTED_STATUS: unexpectedTransactionStatus,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };

    const configValidationResult = validate(
      config.sepConfig?.["24"],
      getConfigFileSchema(true, true),
    );
    if (configValidationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_CONFIG, {
        errors: configValidationResult.errors.join("; "),
      });

      return result;
    }

    const pendingDepositTransactionObj = await fetchTransaction({
      transferServerUrl: this.context.expects.transferServerUrl,
      transactionId: config.sepConfig?.["24"]?.depositPendingTransaction?.id!,
      authToken: this.context.expects.token,
      result,
    });

    if (result.failure) {
      return result;
    }

    const validationResult = validate(
      pendingDepositTransactionObj,
      getTransactionSchema(true, true, false),
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });

      return result;
    }

    const transactionStatus = pendingDepositTransactionObj.transaction
      .status as string;
    if (!transactionStatus.startsWith("pending_")) {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS, {
        expected: "any of pending_",
        received: transactionStatus,
      });
    }
    return result;
  },
};
tests.push(hasProperPendingDepositTransactionSchema);

const hasProperCompletedDepositTransactionSchema: Test = {
  assertion:
    "has proper 'completed' deposit transaction schema on /transaction",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    returnsProperSchemaForValidDepositRequest,
  ],
  context: {
    expects: {
      transferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: invalidTransactionSchema,
    INVALID_CONFIG: invalidConfigFile,
    UNEXPECTED_STATUS: unexpectedTransactionStatus,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };

    const configValidationResult = validate(
      config.sepConfig?.["24"],
      getConfigFileSchema(true, false),
    );
    if (configValidationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_CONFIG, {
        errors: configValidationResult.errors.join("; "),
      });

      return result;
    }

    const completedDepositTransactionObj = await fetchTransaction({
      transferServerUrl: this.context.expects.transferServerUrl,
      transactionId: config.sepConfig?.["24"]?.depositCompletedTransaction?.id!,
      authToken: this.context.expects.token,
      result,
    });

    if (result.failure) {
      return result;
    }

    const validationResult = validate(
      completedDepositTransactionObj,
      getTransactionSchema(true, false, true),
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });

      return result;
    }

    const transactionStatus = completedDepositTransactionObj.transaction.status;
    if (transactionStatus !== "completed") {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS, {
        expected: "completed",
        received: transactionStatus,
      });
    }
    return result;
  },
};
tests.push(hasProperCompletedDepositTransactionSchema);

export const hasProperIncompleteWithdrawTransactionSchema: Test = {
  assertion:
    "has proper 'incomplete' withdraw transaction schema on /transaction",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [
    returnsProperSchemaForValidWithdrawRequest,
    transactionIsPresentAfterWithdrawRequest,
  ],
  context: {
    expects: {
      withdrawTransactionId: undefined,
      withdrawTransactionObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: invalidTransactionSchema,
    UNEXPECTED_STATUS: unexpectedTransactionStatus,
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const validationResult = validate(
      this.context.expects.withdrawTransactionObj,
      getTransactionSchema(false, false, false),
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });

      return result;
    }

    const transactionStatus =
      this.context.expects.withdrawTransactionObj.transaction.status;
    if (transactionStatus !== "incomplete") {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS, {
        expected: "incomplete",
        received: transactionStatus,
      });
    }

    return result;
  },
};
tests.push(hasProperIncompleteWithdrawTransactionSchema);

export const hasProperPendingWithdrawTransactionSchema: Test = {
  assertion:
    "has proper 'pending_user_transfer_start' withdraw transaction schema on /transaction",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    returnsProperSchemaForValidWithdrawRequest,
  ],
  context: {
    expects: {
      transferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_CONFIG: invalidConfigFile,
    INVALID_SCHEMA: invalidTransactionSchema,
    UNEXPECTED_STATUS: unexpectedTransactionStatus,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };

    const configValidationResult = validate(
      config.sepConfig?.["24"],
      getConfigFileSchema(false, true),
    );
    if (configValidationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_CONFIG, {
        errors: configValidationResult.errors.join("; "),
      });

      return result;
    }

    const pendingWithdrawTransactionObj = await fetchTransaction({
      transferServerUrl: this.context.expects.transferServerUrl,
      transactionId:
        config.sepConfig?.["24"]?.withdrawPendingUserTransferStartTransaction
          ?.id!,
      authToken: this.context.expects.token,
      result,
    });

    if (result.failure) {
      return result;
    }

    const validationResult = validate(
      pendingWithdrawTransactionObj,
      getTransactionSchema(false, true, false),
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });

      return result;
    }

    const transactionStatus = pendingWithdrawTransactionObj.transaction.status;
    if (transactionStatus !== "pending_user_transfer_start") {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS, {
        expected: "pending_user_transfer_start",
        received: transactionStatus,
      });
    }
    return result;
  },
};
tests.push(hasProperPendingWithdrawTransactionSchema);

export const hasProperCompletedWithdrawTransactionSchema: Test = {
  assertion:
    "has proper 'completed' withdraw transaction schema on /transaction",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    returnsValidJwt,
    returnsProperSchemaForValidWithdrawRequest,
  ],
  context: {
    expects: {
      transferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_CONFIG: invalidConfigFile,
    INVALID_SCHEMA: invalidTransactionSchema,
    UNEXPECTED_STATUS: unexpectedTransactionStatus,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };

    const configValidationResult = validate(
      config.sepConfig?.["24"],
      getConfigFileSchema(false, false),
    );
    if (configValidationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_CONFIG, {
        errors: configValidationResult.errors.join("; "),
      });

      return result;
    }

    const completedWithdrawTransactionObj = await fetchTransaction({
      transferServerUrl: this.context.expects.transferServerUrl,
      transactionId:
        config.sepConfig?.["24"]?.withdrawCompletedTransaction?.id!,
      authToken: this.context.expects.token,
      result,
    });

    if (result.failure) {
      return result;
    }

    const validationResult = validate(
      completedWithdrawTransactionObj,
      getTransactionSchema(false, false, true),
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });

      return result;
    }

    const transactionStatus =
      completedWithdrawTransactionObj.transaction.status;
    if (transactionStatus !== "completed") {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS, {
        expected: "completed",
        received: transactionStatus,
      });
    }
    return result;
  },
};
tests.push(hasProperCompletedWithdrawTransactionSchema);

const hasValidMoreInfoUrl: Test = {
  assertion: "has a valid 'more_info_url'",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [hasProperIncompleteDepositTransactionSchema],
  context: {
    expects: {
      depositTransactionObj: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getMoreInfoCall: NetworkCall = {
      request: new Request(
        this.context.expects.depositTransactionObj.transaction.more_info_url,
      ),
    };
    await makeRequest(getMoreInfoCall, 200, result, "text/html");
    return result;
  },
};
tests.push(hasValidMoreInfoUrl);

const returns404ForBadId: Test = {
  assertion: "returns 404 for a nonexistent transaction ID",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [hasTransferServerUrl, returnsValidJwt],
  context: {
    expects: {
      transferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl +
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
  sep: 24,
  group: transactionTestGroup,
  dependencies: [hasTransferServerUrl, returnsValidJwt],
  context: {
    expects: {
      transferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl +
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
  sep: 24,
  group: transactionTestGroup,
  dependencies: [hasTransferServerUrl, returnsValidJwt],
  context: {
    expects: {
      transferServerUrl: undefined,
      token: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl +
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
