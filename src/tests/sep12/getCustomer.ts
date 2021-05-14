import { Request } from "node-fetch";
import { validate } from "jsonschema";

import { Test, Config, Result, NetworkCall } from "../../types";
import { returnsValidJwt } from "../sep10/tests";
import { hasKycServerUrl } from "./toml";
import { makeRequest } from "../../helpers/request";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { getCustomerSchema } from "../../schemas/sep12";

const getCustomerGroup = "GET /customer";
const tests: Test[] = [];

const requiresJwtToken: Test = {
  assertion: "requires a SEP-10 JWT",
  sep: 12,
  group: getCustomerGroup,
  dependencies: [hasKycServerUrl],
  context: {
    expects: {
      kycServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getCustomerCall: NetworkCall = {
      request: new Request(this.context.expects.kycServerUrl + "/customer"),
    };
    result.networkCalls.push(getCustomerCall);
    await makeRequest(getCustomerCall, 403, result);
    return result;
  },
};
tests.push(requiresJwtToken);

const newCustomerValidSchema: Test = {
  assertion: "has a valid schema for a new customer",
  sep: 12,
  group: getCustomerGroup,
  dependencies: [hasKycServerUrl, returnsValidJwt],
  context: {
    expects: {
      kycServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHMEA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the specification:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
    UNEXPECTED_CUSTOMER_ID: {
      name: "unexpected customer 'id'",
      text(_args: any): string {
        return (
          "Customers for which an anchor has not yet collected KYC information for should not " +
          "have an 'id' attribute in the response."
        );
      },
    },
    INVALID_CUSTOMER_STATUS: {
      name: "invalid customer status",
      text(_args: any): string {
        return "'NEEDS_INFO' is the expected status for a customer that has not been registered";
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getCustomerCall: NetworkCall = {
      request: new Request(
        this.context.expects.kycServerUrl +
          `/customer?account=${this.context.expects.clientKeypair.publicKey()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    const getCustomerBody = await makeRequest(
      getCustomerCall,
      200,
      result,
      "application/json",
    );
    if (!getCustomerBody) return result;
    const validationResult = validate(getCustomerBody, getCustomerSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHMEA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (getCustomerBody.id) {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_CUSTOMER_ID);
      return result;
    }
    if (getCustomerBody.status !== "NEEDS_INFO") {
      result.failure = makeFailure(this.failureModes.INVALID_CUSTOMER_STATUS);
      result.expected = "NEEDS_INFO";
      result.actual = getCustomerBody.status;
      return result;
    }
    return result;
  },
};
tests.push(newCustomerValidSchema);

export default tests;
