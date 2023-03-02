import fetch from "node-fetch";
import { Request, BodyInit } from "node-fetch";
import { Keypair, Memo } from "stellar-sdk";
import { randomBytes } from "crypto";

import { Test, Config, Result, NetworkCall } from "../../types";
import { returnsValidJwt } from "../sep10/tests";
import { hasKycServerUrl } from "./toml";
import { makeRequest } from "../../helpers/request";
import { makeSep12Request } from "../../helpers/sep12";
import { makeFailure, genericFailures } from "../../helpers/failure";
import { postChallenge } from "../../helpers/sep10";

const putCustomerGroup = "PUT /customer";
const tests: Test[] = [];

const getCreateCustomer = (config: Config): object =>
  config?.sepConfig?.["12"]?.customers?.[
    config?.sepConfig?.["12"]?.createCustomer
  ];

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
    const customerValues = getCreateCustomer(config);
    if (!customerValues) {
      throw new Error(
        "SEP-12 configuration data is missing, expected a key within the " +
          "'customers' object matching the value assigned to 'createCustomer'",
      );
    }
    const putCustomerCall: NetworkCall = {
      request: new Request(this.context.expects.kycServerUrl + "/customer", {
        method: "PUT",
        body: customerValues as BodyInit,
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
      links: {
        "PUT Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#response-1",
      },
    },
    BAD_ID_TYPE: {
      name: "bad 'id' data type",
      text(_args: any): string {
        return "The 'id' returned in PUT /customer in responses must be a string";
      },
      links: {
        "PUT Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#response-1",
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
      links: {
        "PUT Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#response-1",
      },
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const customerValues = getCreateCustomer(config);
    if (!customerValues) {
      throw new Error(
        "SEP-12 configuration data is missing, expected a key within the " +
          "'customers' object matching the value assigned to 'createCustomer'",
      );
    }

    // Log this to console to use secret and public key in Postman manual tests
    console.dir(this.context.expects.clientKeypair.publicKey());
    console.dir(this.context.expects.clientKeypair.secret());
    console.dir(this.context.expects.token);

    const putCustomerRequest = makeSep12Request({
      url: this.context.expects.kycServerUrl + "/customer",
      data: {
        ...customerValues,
      },
      headers: {
        Authorization: `Bearer ${this.context.expects.token}`,
      },
    });
    const putCustomerCall: NetworkCall = {
      request: putCustomerRequest,
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
        customer: config?.sepConfig?.["12"]?.createCustomer,
      });
      result.expected = 202;
      result.actual = putCustomerCall.response.status;
      return result;
    }
    const responseContentType =
      putCustomerCall.response.headers.get("Content-Type");
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
      links: {
        "PUT Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#response-1",
      },
    },
    BAD_ID_TYPE: {
      name: "bad 'id' data type",
      text(_args: any): string {
        return "The 'id' returned in PUT /customer in responses must be a string";
      },
      links: {
        "PUT Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#response-1",
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
      links: {
        "PUT Request":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#request",
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
        throw new Error("improperly configured");
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
      if (
        !config?.sepConfig?.["12"]?.sameAccountDifferentMemos ||
        !config.sepConfig["12"]?.customers[
          config.sepConfig["12"].sameAccountDifferentMemos[0]
        ] ||
        !config.sepConfig["12"].customers[
          config.sepConfig["12"].sameAccountDifferentMemos[1]
        ]
      ) {
        throw new Error(
          "SEP-12 configuration data missing, expected 'sameAccountDifferentMemos' customers",
        );
      }
      sendingCustomerData =
        config.sepConfig["12"].customers[
          config.sepConfig["12"].sameAccountDifferentMemos[0]
        ];
      receivingCustomerData =
        config.sepConfig["12"].customers[
          config.sepConfig["12"].sameAccountDifferentMemos[1]
        ];
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
    const sep12Request = makeSep12Request({
      url: this.context.expects.kycServerUrl + "/customer",
      data: {
        memo: this.context.provides.sendingCustomerMemo.value.toString(
          "base64",
        ),
        memo_type: "hash",
        ...sendingCustomerData,
      },
      headers: {
        Authorization: `Bearer ${this.context.provides.sendingAnchorToken}`,
      },
    });
    const sendingCustomerCall: NetworkCall = {
      request: sep12Request,
    };
    result.networkCalls.push(sendingCustomerCall);
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

    const sep12UpdateRequest = makeSep12Request({
      url: this.context.expects.kycServerUrl + "/customer",
      data: {
        id: sendingCustomerResponse.id,
        trusted_kyc_status: "ACCEPTED",
        ...sendingCustomerData,
      },
      headers: {
        Authorization: `Bearer ${this.context.provides.sendingAnchorToken}`,
      },
    });
    const sendingCustomerUpdateCall: NetworkCall = {
      request: sep12UpdateRequest,
    };
    result.networkCalls.push(sendingCustomerUpdateCall);
    const sendingCustomerUpdateResponse = await makeRequest(
      sendingCustomerUpdateCall,
      202,
      result,
      "application/json",
    );

    if (!sendingCustomerUpdateResponse.id) {
      result.failure = makeFailure(this.failureModes.NO_ID_PROVIDED);
      return result;
    }

    const receivingCustomerRequest = makeSep12Request({
      url: this.context.expects.kycServerUrl + "/customer",
      data: {
        memo: this.context.provides.receivingCustomerMemo.value.toString(
          "base64",
        ),
        memo_type: "hash",
        ...receivingCustomerData,
      },
      headers: {
        Authorization: `Bearer ${this.context.provides.sendingAnchorToken}`,
      },
    });
    const receivingCustomerCall: NetworkCall = {
      request: receivingCustomerRequest,
    };
    result.networkCalls.push(receivingCustomerCall);
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

    const receivingCustomerUpdateRequest = makeSep12Request({
      url: this.context.expects.kycServerUrl + "/customer",
      data: {
        trusted_kyc_status: "ACCEPTED",
        id: receivingCustomerResponse.id,
        ...receivingCustomerData,
      },
      headers: {
        Authorization: `Bearer ${this.context.provides.sendingAnchorToken}`,
      },
    });
    const receivingCustomerUpdateCall: NetworkCall = {
      request: receivingCustomerUpdateRequest,
    };
    result.networkCalls.push(receivingCustomerUpdateCall);
    const receivingCustomerUpdateResponse = await makeRequest(
      receivingCustomerUpdateCall,
      202,
      result,
      "application/json",
    );

    if (!receivingCustomerUpdateResponse.id) {
      result.failure = makeFailure(this.failureModes.NO_ID_PROVIDED);
      return result;
    }

    this.context.provides.sendingCustomerId = sendingCustomerResponse.id;
    this.context.provides.receivingCustomerId = receivingCustomerResponse.id;
    return result;
  },
};
tests.push(differentMemosSameAccount);

export const statusUpdate: Test = {
  assertion: "can update a user status",
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
      links: {
        "PUT Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#response-1",
      },
    },
    BAD_ID_TYPE: {
      name: "bad 'id' data type",
      text(_args: any): string {
        return "The 'id' returned in PUT /customer in responses must be a string";
      },
      links: {
        "PUT Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#response-1",
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
      links: {
        "PUT Request":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#request",
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
        throw new Error("improperly configured");
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
      if (
        !config?.sepConfig?.["12"]?.sameAccountDifferentMemos ||
        !config.sepConfig["12"]?.customers[
          config.sepConfig["12"].sameAccountDifferentMemos[0]
        ] ||
        !config.sepConfig["12"].customers[
          config.sepConfig["12"].sameAccountDifferentMemos[1]
        ]
      ) {
        throw new Error(
          "SEP-12 configuration data missing, expected 'sameAccountDifferentMemos' customers",
        );
      }
      sendingCustomerData =
        config.sepConfig["12"].customers[
          config.sepConfig["12"].sameAccountDifferentMemos[0]
        ];
      receivingCustomerData =
        config.sepConfig["12"].customers[
          config.sepConfig["12"].sameAccountDifferentMemos[1]
        ];
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
    const sep12Request = makeSep12Request({
      url: this.context.expects.kycServerUrl + "/customer",
      data: {
        memo: this.context.provides.sendingCustomerMemo.value.toString(
          "base64",
        ),
        memo_type: "hash",
        ...sendingCustomerData,
      },
      headers: {
        Authorization: `Bearer ${this.context.provides.sendingAnchorToken}`,
      },
    });
    const sendingCustomerCall: NetworkCall = {
      request: sep12Request,
    };
    result.networkCalls.push(sendingCustomerCall);
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
    const receivingCustomerRequest = makeSep12Request({
      url: this.context.expects.kycServerUrl + "/customer",
      data: {
        memo: this.context.provides.receivingCustomerMemo.value.toString(
          "base64",
        ),
        memo_type: "hash",
        ...receivingCustomerData,
      },
      headers: {
        Authorization: `Bearer ${this.context.provides.sendingAnchorToken}`,
      },
    });
    const receivingCustomerCall: NetworkCall = {
      request: receivingCustomerRequest,
    };
    result.networkCalls.push(receivingCustomerCall);
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
tests.push(statusUpdate);

export default tests;
