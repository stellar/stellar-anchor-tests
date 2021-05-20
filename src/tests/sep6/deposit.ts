import { Keypair } from "stellar-sdk";
import { Request } from "node-fetch";
import { URLSearchParams } from "url";
import { validate } from "jsonschema";

import { Test, Config, Result, NetworkCall } from "../../types";
import { makeRequest } from "../../helpers/request";
import { postChallenge } from "../../helpers/sep10";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { hasWebAuthEndpoint, returnsValidJwt } from "../sep10/tests";
import { canCreateCustomer } from "../sep12/putCustomer";
import { hasTransferServerUrl } from "./toml";
import { assetCodeEnabledForDeposit, isCompliantWithSchema } from "./info";
import {
  needsInfoResponseSchema,
  depositSuccessResponseSchema,
  customerInfoStatusSchema,
} from "../../schemas/sep6";

const tests: Test[] = [];
const depositTestsGroup = "GET /deposit";
const depositEndpoint = "/deposit";

const depositRequiresToken: Test = {
  assertion:
    "requires a SEP-10 JWT if /info's 'authentication_required' is true",
  sep: 6,
  group: depositTestsGroup,
  dependencies: [
    hasTransferServerUrl,
    isCompliantWithSchema,
    assetCodeEnabledForDeposit,
  ],
  context: {
    expects: {
      sep6InfoObj: undefined,
      sep6TransferServerUrl: undefined,
    },
    provides: {
      authRequired: undefined,
    },
  },
  failureModes: {
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (!config.assetCode)
      // checked in assetCodeEnabledForDeposit
      throw "improperly configured";
    const result: Result = { networkCalls: [] };
    const depositInfo = this.context.expects.sep6InfoObj.deposit[
      config.assetCode
    ];
    this.context.provides.authRequired = Boolean(
      depositInfo.authentication_required,
    );
    if (!this.context.provides.authRequired) return result;
    const callParams = new URLSearchParams({
      account: Keypair.random().publicKey(),
      asset_code: config.assetCode,
    });
    const postDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          depositEndpoint +
          `?${callParams.toString()}`,
      ),
    };
    result.networkCalls.push(postDepositCall);
    await makeRequest(postDepositCall, 403, result);
    return result;
  },
};
tests.push(depositRequiresToken);

const depositRequiresAssetCode: Test = {
  assertion: "requires 'asset_code' parameter",
  sep: 6,
  group: depositTestsGroup,
  dependencies: [
    hasWebAuthEndpoint,
    returnsValidJwt,
    hasTransferServerUrl,
    assetCodeEnabledForDeposit,
  ],
  context: {
    expects: {
      tomlObj: undefined,
      authRequired: undefined,
      webAuthEndpoint: undefined,
      token: undefined,
      clientKeypair: undefined,
      sep6TransferServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: {
    NO_ERROR_RESPONSE_ATTRIBUTE: {
      name: "no 'error' attribute in response",
      text(_args: any): string {
        return (
          "400 Bad Request response bodies should include a " +
          "human-readable 'error' message"
        );
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const callParams = new URLSearchParams({
      account: this.context.expects.clientKeypair.publicKey(),
    });
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        }
      : {};
    const getDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          depositEndpoint +
          `?${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getDepositCall);
    const errorResponse = await makeRequest(
      getDepositCall,
      400,
      result,
      "application/json",
    );
    if (result.failure || !errorResponse) return result;
    if (!errorResponse.error) {
      result.failure = makeFailure(
        this.failureModes.NO_ERROR_RESPONSE_ATTRIBUTE,
      );
    }
    return result;
  },
};
tests.push(depositRequiresAssetCode);

const depositRequiresAccount: Test = {
  assertion:
    "requires 'account' parameter if /info's 'authentication_required' is false",
  sep: 6,
  group: depositTestsGroup,
  dependencies: depositRequiresAssetCode.dependencies,
  context: depositRequiresAssetCode.context,
  failureModes: depositRequiresAssetCode.failureModes,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.authRequired) return result;
    const callParams = new URLSearchParams({
      asset_code: config.assetCode,
    });
    const getDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          depositEndpoint +
          `?${callParams.toString()}`,
      ),
    };
    result.networkCalls.push(getDepositCall);
    const errorResponse = await makeRequest(
      getDepositCall,
      400,
      result,
      "application/json",
    );
    if (result.failure || !errorResponse) return result;
    if (!errorResponse.error) {
      result.failure = makeFailure(
        this.failureModes.NO_ERROR_RESPONSE_ATTRIBUTE,
      );
    }
    return result;
  },
};
tests.push(depositRequiresAccount);

const depositRejectsInvalidAccount: Test = {
  assertion:
    "rejects invalid 'account' parameter if /info's 'authentication_required' is false",
  sep: 6,
  group: depositTestsGroup,
  dependencies: depositRequiresAssetCode.dependencies,
  context: depositRequiresAssetCode.context,
  failureModes: depositRequiresAssetCode.failureModes,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.authRequired) return result;
    const callParams = new URLSearchParams({
      asset_code: config.assetCode,
      account: "invalid account",
    });
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        }
      : {};
    const getDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          depositEndpoint +
          `${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getDepositCall);
    const errorResponse = await makeRequest(
      getDepositCall,
      400,
      result,
      "application/json",
    );
    if (result.failure || !errorResponse) return result;
    if (!errorResponse.error) {
      result.failure = makeFailure(
        this.failureModes.NO_ERROR_RESPONSE_ATTRIBUTE,
      );
    }
    return result;
  },
};
tests.push(depositRejectsInvalidAccount);

const depositRejectsUnsupportedAssetCode: Test = {
  assertion: "rejects unsupported 'asset_code' parameter",
  sep: 6,
  group: depositTestsGroup,
  dependencies: depositRequiresAssetCode.dependencies,
  context: depositRequiresAssetCode.context,
  failureModes: depositRequiresAssetCode.failureModes,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const callParams = new URLSearchParams({
      asset_code: "NOT_SUPPORTED",
      account: this.context.expects.clientKeypair.publicKey(),
    });
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        }
      : {};
    const getDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          depositEndpoint +
          `?${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getDepositCall);
    const errorResponse = await makeRequest(
      getDepositCall,
      400,
      result,
      "application/json",
    );
    if (result.failure || !errorResponse) return result;
    if (!errorResponse.error) {
      result.failure = makeFailure(
        this.failureModes.NO_ERROR_RESPONSE_ATTRIBUTE,
      );
    }
    return result;
  },
};
tests.push(depositRejectsUnsupportedAssetCode);

export const returnsProperSchemaForUnknownAccounts: Test = {
  assertion:
    "returns a needs info response for valid requests from unknown accounts",
  sep: 6,
  group: depositTestsGroup,
  dependencies: depositRequiresAssetCode.dependencies,
  context: {
    expects: depositRequiresAssetCode.context.expects,
    provides: {
      sep6FieldsRequired: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /deposit endpoint:\n\n" +
          `${args.reference}\n\n` +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (!config.sepConfig || !config.sepConfig["6"])
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const token = await postChallenge(
      clientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
    const callParams = new URLSearchParams({
      asset_code: config.assetCode,
      account: clientKeypair.publicKey(),
      ...config.sepConfig["6"].deposit.transactionFields,
    });
    const getDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          depositEndpoint +
          `?${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getDepositCall);
    const responseBody = await makeRequest(
      getDepositCall,
      403,
      result,
      "application/json",
    );
    if (!responseBody) return result;
    const validatorResult = validate(responseBody, needsInfoResponseSchema);
    if (validatorResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validatorResult.errors.join("\n"),
        reference:
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#2-customer-information-needed-non-interactive",
      });
      return result;
    }
    this.context.provides.sep6FieldsRequired = responseBody.fields;
    return result;
  },
};
tests.push(returnsProperSchemaForUnknownAccounts);

export const returnsProperSchemaForKnownAccounts: Test = {
  assertion:
    "returns a success or customer info status response for valid requests from KYC'ed accounts",
  sep: 6,
  group: depositTestsGroup,
  dependencies: [canCreateCustomer].concat(
    depositRequiresAssetCode.dependencies || [],
  ),
  context: {
    expects: depositRequiresAssetCode.context.expects,
    provides: {
      sep6TransactionId: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /deposit endpoint:\n\n" +
          `${args.success}\n` +
          `${args.customerInfoStatus}\n\n` +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (!config.sepConfig || !config.sepConfig["6"])
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        }
      : {};
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
        { ...headers },
      ),
    };
    result.networkCalls.push(getDepositCall);
    const responseBody = await makeRequest(
      getDepositCall,
      [200, 403],
      result,
      "application/json",
    );
    if (!responseBody || !getDepositCall.response) return result;
    let schema;
    if (getDepositCall.response.status == 200) {
      schema = depositSuccessResponseSchema;
    } else {
      schema = customerInfoStatusSchema;
    }
    const validationResult = validate(responseBody, schema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
        success:
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed",
        customerInfoStatus:
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#3-customer-information-status",
      });
      return result;
    }
    this.context.provides.sep6TransactionId = responseBody.id || null;
    return result;
  },
};
tests.push(returnsProperSchemaForKnownAccounts);

export default tests;
