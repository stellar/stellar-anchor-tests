import fetch from "node-fetch";
import { Request } from "node-fetch";
import { Keypair, Memo } from "stellar-sdk";
import { randomBytes } from "crypto";

import { Test, Config, Result, NetworkCall } from "../../types";
import { returnsValidJwt } from "../sep10/tests";
import { hasKycServerUrl } from "./toml";
import { makeRequest } from "../../helpers/request";
import { makeFailure, genericFailures } from "../../helpers/failure";
import { postChallenge } from "../../helpers/sep10";

const putCustomerGroup = "PUT /customer";
const tests: Test[] = [];

function getCustomersFromConfig(config: Config): [string[], any[]] {
  if (
    !config.sepConfig ||
    !config.sepConfig["12"] ||
    !config.sepConfig["12"].customers
  )
    throw "SEP-12 customer data is missing from the configuration object";
  const customers = config.sepConfig["12"].customers;
  return [Object.keys(customers), Object.values(customers)];
}

const requiresJwt: Test = {
  assertion: "requires a SEP-10 JWT",
  sep: 12,
  group: putCustomerGroup,
  dependencies: [hasKycServerUrl],
  context: {
    expects: {
      kycServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const [_, customerValues] = getCustomersFromConfig(config);
    const putCustomerCall: NetworkCall = {
      request: new Request(this.context.expects.kycServerUrl + "/customer", {
        method: "PUT",
        body: customerValues[0],
      }),
    };
    result.networkCalls.push(putCustomerCall);
    await makeRequest(putCustomerCall, [401, 403], result);
    return result;
  },
};
tests.push(requiresJwt);

export const canCreateCustomer: Test = {
  assertion: "can create a customer",
  sep: 12,
  group: putCustomerGroup,
  dependencies: [hasKycServerUrl, returnsValidJwt],
  context: {
    expects: {
      token: undefined,
      clientKeypair: undefined,
      kycServerUrl: undefined,
    },
    provides: {
      customerId: undefined,
    },
  },
  failureModes: {
    NO_ID_PROVIDED: {
      name: "no 'id' provided",
      text(_args: any): string {
        return "An 'id' attribute is required for PUT /customer success responses";
      },
    },
    BAD_ID_TYPE: {
      name: "bad 'id' data type",
      text(_args: any): string {
        return "The 'id' returned in PUT /customer in responses must be a string";
      },
    },
    ...genericFailures,
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text(args: any): string {
        return (
          "The request to PUT /customer failed. This could be a result of " +
          `server error or invalid/missing data from the '${args.customer}' ` +
          "SEP-12 customer data provided."
        );
      },
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const [customerNames, customerValues] = getCustomersFromConfig(config);
    const putCustomerCall: NetworkCall = {
      request: new Request(this.context.expects.kycServerUrl + "/customer", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.context.expects.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: this.context.expects.clientKeypair.publicKey(),
          ...customerValues[0],
        }),
      }),
    };
    result.networkCalls.push(putCustomerCall);
    try {
      putCustomerCall.response = await fetch(putCustomerCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: putCustomerCall.request.url,
      });
      return result;
    }
    if (putCustomerCall.response.status !== 202) {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS_CODE, {
        customer: customerNames[0],
      });
      result.expected = 202;
      result.actual = putCustomerCall.response.status;
      return result;
    }
    const responseContentType = putCustomerCall.response.headers.get(
      "Content-Type",
    );
    if (
      !responseContentType ||
      !responseContentType.includes("application/json")
    ) {
      result.failure = makeFailure(this.failureModes.BAD_CONTENT_TYPE, {
        method: putCustomerCall.request.method,
        url: putCustomerCall.request.method,
      });
      result.expected = "application/json";
      if (responseContentType) result.actual = responseContentType;
      return result;
    }
    const responseBody = await putCustomerCall.response.clone().json();
    if (!responseBody.id) {
      result.failure = makeFailure(this.failureModes.NO_ID_PROVIDED);
      return result;
    }
    if (typeof responseBody.id !== "string") {
      result.failure = makeFailure(this.failureModes.BAD_ID_TYPE);
      return result;
    }
    this.context.provides.customerId = responseBody.id;
    return result;
  },
};
tests.push(canCreateCustomer);

export const differentMemosSameAccount: Test = {
  assertion: "memos differentiate customers registered by the same account",
  sep: 12,
  group: putCustomerGroup,
  dependencies: [hasKycServerUrl, returnsValidJwt],
  context: {
    expects: {
      webAuthEndpoint: undefined,
      kycServerUrl: undefined,
      tomlObj: undefined,
    },
    provides: {
      sendingAnchorClientKeypair: undefined,
      sendingAnchorToken: undefined,
      sendingCustomerId: undefined,
      sendingCustomerMemo: undefined,
      receivingCustomerId: undefined,
      receivingCustomerMemo: undefined,
    },
  },
  failureModes: {
    NO_ID_PROVIDED: {
      name: "no 'id' provided",
      text(_args: any): string {
        return "An 'id' attribute is required for PUT /customer success responses";
      },
    },
    BAD_ID_TYPE: {
      name: "bad 'id' data type",
      text(_args: any): string {
        return "The 'id' returned in PUT /customer in responses must be a string";
      },
    },
    MEMO_DOESNT_DIFFERENTIATE: {
      name: "memos do not differentiate customers",
      text(_args: any): string {
        return (
          "Two PUT /customer requests were made with the same account and " +
          "different memos, but the same customer ID was returned in both responses. " +
          "Memos are used to uniquely identify customers registered by the same account."
        );
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    let sendingCustomerData;
    let receivingCustomerData;
    if (config.seps.includes(31)) {
      if (
        !config.sepConfig ||
        !config.sepConfig["31"] ||
        !config.sepConfig["31"].sendingAnchorClientSecret ||
        !config.sepConfig["12"]
      ) {
        // this configuration is checked prior to running tests
        // but to satisfy TypeScript we make these checks here.
        throw { message: "improperly configured" };
      }
      sendingCustomerData =
        config.sepConfig["12"].customers[
          config.sepConfig["31"].sendingClientName
        ];
      receivingCustomerData =
        config.sepConfig["12"].customers[
          config.sepConfig["31"].receivingClientName
        ];
      this.context.provides.sendingAnchorClientKeypair = Keypair.fromSecret(
        config.sepConfig["31"].sendingAnchorClientSecret,
      );
    } else {
      const [_, customerValues] = getCustomersFromConfig(config);
      sendingCustomerData = customerValues[1];
      receivingCustomerData = customerValues[2];
      this.context.provides.sendingAnchorClientKeypair = Keypair.random();
    }
    this.context.provides.sendingCustomerMemo = Memo.hash(
      randomBytes(32).toString("hex"),
    );
    this.context.provides.receivingCustomerMemo = Memo.hash(
      randomBytes(32).toString("hex"),
    );
    this.context.provides.sendingAnchorToken = await postChallenge(
      this.context.provides.sendingAnchorClientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    const sendingCustomerCall: NetworkCall = {
      request: new Request(this.context.expects.kycServerUrl + "/customer", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.context.provides.sendingAnchorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: this.context.provides.sendingAnchorClientKeypair.publicKey(),
          memo: this.context.provides.sendingCustomerMemo.value.toString(
            "base64",
          ),
          memo_type: "hash",
          ...sendingCustomerData,
        }),
      }),
    };
    const sendingCustomerResponse = await makeRequest(
      sendingCustomerCall,
      202,
      result,
      "application/json",
    );
    if (!sendingCustomerResponse) return result;
    if (!sendingCustomerResponse.id) {
      result.failure = makeFailure(this.failureModes.NO_ID_PROVIDED);
      return result;
    }
    if (typeof sendingCustomerResponse.id !== "string") {
      result.failure = makeFailure(this.failureModes.BAD_ID_TYPE);
      return result;
    }
    const receivingCustomerCall: NetworkCall = {
      request: new Request(this.context.expects.kycServerUrl + "/customer", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.context.provides.sendingAnchorToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: this.context.provides.sendingAnchorClientKeypair.publicKey(),
          memo: this.context.provides.receivingCustomerMemo.value.toString(
            "base64",
          ),
          memo_type: "hash",
          ...receivingCustomerData,
        }),
      }),
    };
    const receivingCustomerResponse = await makeRequest(
      receivingCustomerCall,
      202,
      result,
      "application/json",
    );
    if (!receivingCustomerResponse) return result;
    if (!receivingCustomerResponse.id) {
      result.failure = makeFailure(this.failureModes.NO_ID_PROVIDED);
      return result;
    }
    if (typeof receivingCustomerResponse.id !== "string") {
      result.failure = makeFailure(this.failureModes.BAD_ID_TYPE);
      return result;
    }
    if (receivingCustomerResponse.id === sendingCustomerResponse.id) {
      result.failure = makeFailure(this.failureModes.MEMO_DOESNT_DIFFERENTIATE);
      return result;
    }
    this.context.provides.sendingCustomerId = sendingCustomerResponse.id;
    this.context.provides.receivingCustomerId = receivingCustomerResponse.id;
    return result;
  },
};
tests.push(differentMemosSameAccount);

export default tests;
