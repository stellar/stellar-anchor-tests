import { Request } from "node-fetch";
import { validate } from "jsonschema";

import { Test, Config, Result, NetworkCall, Failure } from "../../types";
import { getTransactionSchema } from "../../schemas/sep24";
import { makeRequest } from "../../helpers/request";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { hasTransferServerUrl } from "./toml";
import { returnsValidJwt } from "../sep10/tests";
import { returnsProperSchemaForValidDepositRequest } from "./deposit";
import { returnsProperSchemaForValidWithdrawRequest } from "./withdraw";

const transactionEndpoint = "/transaction";
const transactionTestGroup = "/transaction";
const tests: Test[] = [];

const invalidTransactionSchema: Failure = {
  name: "invalid schema",
  text(args: any): string {
    return (
      "The response body returned does not comply with the schema defined for the /transaction endpoint. " +
      "The errors returned from the schema validation:\n\n" +
      `${args.errors}`
    );
  },
  links: {
    "Transaction Schema":
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#single-historical-transaction",
  },
};

const transactionRequiresToken: Test = {
  assertion: "requires a JWT",
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
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl +
          transactionEndpoint +
          `?id=${this.context.expects.depositTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionCall);
    this.context.provides.depositTransactionObj = await makeRequest(
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
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl +
          transactionEndpoint +
          `?id=${this.context.expects.withdrawTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionCall);
    this.context.provides.withdrawTransactionObj = await makeRequest(
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

const hasValidMoreInfoUrl: Test = {
  assertion: "has a valid 'more_info_url'",
  sep: 24,
  group: transactionTestGroup,
  dependencies: [hasProperDepositTransactionSchema],
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
