import { Request } from "node-fetch";
import { validate } from "jsonschema";
import { Keypair } from "stellar-sdk";
import { URLSearchParams } from "url";

import { Test, Config, Result, NetworkCall } from "../../types";
import { hasNetworkPassphrase } from "../sep1/tests";
import { returnsValidJwt } from "../sep10/tests";
import { hasKycServerUrl } from "./toml";
import { makeRequest } from "../../helpers/request";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { getCustomerSchema } from "../../schemas/sep12";
import { postChallenge } from "../../helpers/sep10";
import { canCreateCustomer } from "./putCustomer";

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
    await makeRequest(getCustomerCall, [401, 403], result);
    return result;
  },
};
tests.push(requiresJwtToken);

const newCustomerValidSchema: Test = {
  assertion: "has a valid schema for a new customer",
  sep: 12,
  group: getCustomerGroup,
  dependencies: [hasNetworkPassphrase, hasKycServerUrl, returnsValidJwt],
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
      kycServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHMEA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the specification. " +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "GET Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get",
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
      links: {
        "GET Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get",
      },
    },
    INVALID_CUSTOMER_STATUS: {
      name: "invalid customer status",
      text(_args: any): string {
        return "'NEEDS_INFO' is the expected status for a customer that has not been registered";
      },
      links: {
        "GET Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get",
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (
      !config.sepConfig ||
      !config.sepConfig["12"] ||
      !config.sepConfig["12"].customers ||
      !config.sepConfig["12"].createCustomer ||
      !config.sepConfig["12"].customers[config.sepConfig["12"].createCustomer]
    ) {
      throw new Error(
        "SEP-12 configuration data is missing, expected a key within the " +
          "'customers' object matching the value assigned to 'createCustomer'",
      );
    }
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const token = await postChallenge(
      clientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (!token) return result;
    const customerType =
      config.sepConfig["12"].customers[config.sepConfig["12"].createCustomer]
        .type;
    const requestParamsObj: Record<string, string> = {
      account: clientKeypair.publicKey(),
    };
    if (customerType) requestParamsObj["type"] = customerType;
    const searchParams = new URLSearchParams(requestParamsObj);
    const getCustomerCall: NetworkCall = {
      request: new Request(
        this.context.expects.kycServerUrl +
          `/customer?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getCustomerCall);
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

export const canFetchExistingCustomerById: Test = {
  assertion: "can retrieve customer using 'id'",
  sep: 12,
  group: getCustomerGroup,
  dependencies: [canCreateCustomer],
  context: {
    expects: {
      kycServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
      customerId: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHMEA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the specification. " +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "GET Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get",
      },
    },
    UNEXPECTED_STATUS: {
      name: "unexpected customer status",
      text(_args: any): string {
        return (
          "An existing customer for which all information was provided should no longer be in the " +
          "'NEEDS_INFO' status. Ensure the customer data provided in the SEP-12 configuration includes " +
          "all required properties."
        );
      },
      links: {
        "GET Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get",
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (
      !config.sepConfig ||
      !config.sepConfig["12"] ||
      !config.sepConfig["12"].customers ||
      !config.sepConfig["12"].createCustomer ||
      !config.sepConfig["12"].customers[config.sepConfig["12"].createCustomer]
    ) {
      throw new Error(
        "SEP-12 configuration data is missing, expected a key within the " +
          "'customers' object matching the value assigned to 'createCustomer'",
      );
    }
    const result: Result = { networkCalls: [] };
    const customerType =
      config.sepConfig["12"].customers[config.sepConfig["12"].createCustomer]
        .type;
    const requestParamsObj: Record<string, string> = {
      id: this.context.expects.customerId,
    };
    if (customerType) requestParamsObj["type"] = customerType;
    const searchParams = new URLSearchParams(requestParamsObj);
    const getCustomerCall: NetworkCall = {
      request: new Request(
        this.context.expects.kycServerUrl +
          `/customer?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getCustomerCall);
    const responseBody = await makeRequest(
      getCustomerCall,
      200,
      result,
      "application/json",
    );
    if (!responseBody) return result;
    const validationResult = validate(responseBody, getCustomerSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHMEA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (responseBody.status === "NEEDS_INFO") {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS);
      return result;
    }
    return result;
  },
};
tests.push(canFetchExistingCustomerById);

const canFetchExistingCustomerByAccount: Test = {
  assertion: "can retrieve customer using 'account'",
  sep: 12,
  group: getCustomerGroup,
  dependencies: [canCreateCustomer],
  context: {
    expects: {
      kycServerUrl: undefined,
      token: undefined,
      clientKeypair: undefined,
      customerId: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHMEA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the specification. " +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "GET Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get",
      },
    },
    UNEXPECTED_STATUS: {
      name: "unexpected customer status",
      text(_args: any): string {
        return (
          "An existing customer for which all information was provided should no longer be in the " +
          "'NEEDS_INFO' status. Ensure the customer data provided in the SEP-12 configuration includes " +
          "all required properties."
        );
      },
      links: {
        "GET Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get",
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (
      !config.sepConfig ||
      !config.sepConfig["12"] ||
      !config.sepConfig["12"].customers ||
      !config.sepConfig["12"].createCustomer ||
      !config.sepConfig["12"].customers[config.sepConfig["12"].createCustomer]
    ) {
      throw new Error(
        "SEP-12 configuration data is missing, expected a key within the " +
          "'customers' object matching the value assigned to 'createCustomer'",
      );
    }
    const result: Result = { networkCalls: [] };
    const customerType =
      config.sepConfig["12"].customers[config.sepConfig["12"].createCustomer]
        .type;
    const requestParamsObj: Record<string, string> = {
      account: this.context.expects.clientKeypair.publicKey(),
    };
    if (customerType) requestParamsObj["type"] = customerType;
    const searchParams = new URLSearchParams(requestParamsObj);
    const getCustomerCall: NetworkCall = {
      request: new Request(
        this.context.expects.kycServerUrl +
          `/customer?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getCustomerCall);
    const responseBody = await makeRequest(
      getCustomerCall,
      200,
      result,
      "application/json",
    );
    if (!responseBody) return result;
    const validationResult = validate(responseBody, getCustomerSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHMEA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (responseBody.status === "NEEDS_INFO") {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS);
      return result;
    }
    return result;
  },
};
tests.push(canFetchExistingCustomerByAccount);

export default tests;
