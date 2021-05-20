import { Keypair, Memo } from "stellar-sdk";
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
import { assetCodeEnabledForWithdraw, isCompliantWithSchema } from "./info";
import {
  needsInfoResponseSchema,
  withdrawSuccessResponseSchema,
  customerInfoStatusSchema,
} from "../../schemas/sep6";

const tests: Test[] = [];
const withdrawTestsGroup = "GET /withdraw";
const withdrawEndpoint = "/withdraw";

const withdrawRequiresToken: Test = {
  assertion:
    "requires a SEP-10 JWT if /info's 'authentication_required' is true",
  sep: 6,
  group: withdrawTestsGroup,
  dependencies: [
    hasTransferServerUrl,
    isCompliantWithSchema,
    assetCodeEnabledForWithdraw,
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
      // checked in assetCodeEnabledForWithdraw
      throw "improperly configured";
    const result: Result = { networkCalls: [] };
    const withdrawInfo = this.context.expects.sep6InfoObj.withdraw[
      config.assetCode
    ];
    this.context.provides.authRequired = Boolean(
      withdrawInfo.authentication_required,
    );
    if (!this.context.provides.authRequired) return result;
    const withdrawType = Object.keys(withdrawInfo.types)[0];
    const withdrawTypeFields =
      withdrawInfo.types[withdrawType].transactionFields || {};
    const callParams = new URLSearchParams({
      account: Keypair.random().publicKey(),
      asset_code: config.assetCode,
      type: withdrawType,
      ...withdrawTypeFields,
    });
    const getWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          withdrawEndpoint +
          `?${callParams.toString()}`,
      ),
    };
    result.networkCalls.push(getWithdrawCall);
    await makeRequest(getWithdrawCall, 403, result);
    return result;
  },
};
tests.push(withdrawRequiresToken);

const withdrawRequiresAssetCode: Test = {
  assertion: "requires 'asset_code' parameter",
  sep: 6,
  group: withdrawTestsGroup,
  dependencies: [
    hasWebAuthEndpoint,
    returnsValidJwt,
    hasTransferServerUrl,
    assetCodeEnabledForWithdraw,
  ],
  context: {
    expects: {
      tomlObj: undefined,
      sep6InfoObj: undefined,
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
  async run(config: Config): Promise<Result> {
    if (!config.assetCode)
      // checked in assetCodeEnabledForWithdraw
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        }
      : {};
    const withdrawInfo = this.context.expects.sep6InfoObj.withdraw[
      config.assetCode
    ];
    const withdrawType = Object.keys(withdrawInfo.types)[0];
    const withdrawTypeFields =
      withdrawInfo.types[withdrawType].transactionFields || {};
    const callParams = new URLSearchParams({
      account: Keypair.random().publicKey(),
      type: withdrawType,
      ...withdrawTypeFields,
    });
    const getWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          withdrawEndpoint +
          `?${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getWithdrawCall);
    const errorResponse = await makeRequest(
      getWithdrawCall,
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
tests.push(withdrawRequiresAssetCode);

const withdrawRequiresAccount: Test = {
  assertion:
    "requires 'account' parameter if /info's 'authentication_required' is false",
  sep: 6,
  group: withdrawTestsGroup,
  dependencies: withdrawRequiresAssetCode.dependencies,
  context: withdrawRequiresAssetCode.context,
  failureModes: withdrawRequiresAssetCode.failureModes,
  async run(config: Config): Promise<Result> {
    if (!config.assetCode)
      // checked in assetCodeEnabledForWithdraw
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    if (this.context.expects.authRequired) return result;
    const withdrawInfo = this.context.expects.sep6InfoObj.withdraw[
      config.assetCode
    ];
    const withdrawType = Object.keys(withdrawInfo.types)[0];
    const withdrawTypeFields =
      withdrawInfo.types[withdrawType].transactionFields || {};
    const callParams = new URLSearchParams({
      asset_code: config.assetCode,
      type: withdrawType,
      ...withdrawTypeFields,
    });
    const getWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          withdrawEndpoint +
          `?${callParams.toString()}`,
      ),
    };
    result.networkCalls.push(getWithdrawCall);
    const errorResponse = await makeRequest(
      getWithdrawCall,
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
tests.push(withdrawRequiresAccount);

const withdrawRejectsInvalidAccount: Test = {
  assertion:
    "rejects invalid 'account' parameter if /info's 'authentication_required' is false",
  sep: 6,
  group: withdrawTestsGroup,
  dependencies: withdrawRequiresAssetCode.dependencies,
  context: withdrawRequiresAssetCode.context,
  failureModes: withdrawRequiresAssetCode.failureModes,
  async run(config: Config): Promise<Result> {
    if (!config.assetCode)
      // checked in assetCodeEnabledForWithdraw
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    if (this.context.expects.authRequired) return result;
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        }
      : {};
    const withdrawInfo = this.context.expects.sep6InfoObj.withdraw[
      config.assetCode
    ];
    const withdrawType = Object.keys(withdrawInfo.types)[0];
    const withdrawTypeFields =
      withdrawInfo.types[withdrawType].transactionFields || {};
    const callParams = new URLSearchParams({
      asset_code: config.assetCode,
      account: "invalid account",
      type: withdrawType,
      ...withdrawTypeFields,
    });
    const getWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          withdrawEndpoint +
          `${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getWithdrawCall);
    const errorResponse = await makeRequest(
      getWithdrawCall,
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
tests.push(withdrawRejectsInvalidAccount);

const withdrawRejectsUnsupportedAssetCode: Test = {
  assertion: "rejects unsupported 'asset_code' parameter",
  sep: 6,
  group: withdrawTestsGroup,
  dependencies: withdrawRequiresAssetCode.dependencies,
  context: withdrawRequiresAssetCode.context,
  failureModes: withdrawRequiresAssetCode.failureModes,
  async run(config: Config): Promise<Result> {
    if (!config.assetCode)
      // checked in assetCodeEnabledForWithdraw
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        }
      : {};
    const withdrawInfo = this.context.expects.sep6InfoObj.withdraw[
      config.assetCode
    ];
    const withdrawType = Object.keys(withdrawInfo.types)[0];
    const withdrawTypeFields =
      withdrawInfo.types[withdrawType].transactionFields || {};
    const callParams = new URLSearchParams({
      asset_code: "NOT_SUPPORTED",
      account: this.context.expects.clientKeypair.publicKey(),
      type: withdrawType,
      ...withdrawTypeFields,
    });
    const getWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          withdrawEndpoint +
          `?${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getWithdrawCall);
    const errorResponse = await makeRequest(
      getWithdrawCall,
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
tests.push(withdrawRejectsUnsupportedAssetCode);

export const returnsProperSchemaForUnknownAccounts: Test = {
  assertion:
    "returns a needs info response for valid requests from unknown accounts",
  sep: 6,
  group: withdrawTestsGroup,
  dependencies: withdrawRequiresAssetCode.dependencies,
  context: {
    expects: withdrawRequiresAssetCode.context.expects,
    provides: {
      sep6FieldsRequired: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /withdraw endpoint:\n\n" +
          `${args.reference}\n\n` +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    if (
      !config.sepConfig ||
      !config.sepConfig["6"] ||
      !config.assetCode ||
      !config.sepConfig["6"].withdraw.types
    )
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
    const withdrawInfo = this.context.expects.sep6InfoObj.withdraw[
      config.assetCode
    ];
    const withdrawType = Object.keys(withdrawInfo.types)[0];
    const withdrawTypeFields =
      config.sepConfig["6"].withdraw.types[withdrawType].transactionFields ||
      {};
    const callParams = new URLSearchParams({
      asset_code: config.assetCode,
      account: clientKeypair.publicKey(),
      type: withdrawType,
      ...withdrawTypeFields,
    });
    const getWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          withdrawEndpoint +
          `?${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getWithdrawCall);
    const responseBody = await makeRequest(
      getWithdrawCall,
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

const returnsProperSchemaForKnownAccounts: Test = {
  assertion:
    "returns a success or customer info status response for valid requests from KYC'ed accounts",
  sep: 6,
  group: withdrawTestsGroup,
  dependencies: [canCreateCustomer].concat(
    withdrawRequiresAssetCode.dependencies || [],
  ),
  context: {
    expects: withdrawRequiresAssetCode.context.expects,
    provides: {
      sep6TransactionId: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /withdraw endpoint:\n\n" +
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
    if (
      !config.sepConfig ||
      !config.sepConfig["6"] ||
      !config.assetCode ||
      !config.sepConfig["6"].withdraw.types
    )
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    const headers = this.context.expects.authRequired
      ? {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        }
      : {};
    const withdrawInfo = this.context.expects.sep6InfoObj.withdraw[
      config.assetCode
    ];
    const withdrawType = Object.keys(withdrawInfo.types)[0];
    const withdrawTypeFields =
      config.sepConfig["6"].withdraw.types[withdrawType].transactionFields ||
      {};
    const callParams = new URLSearchParams({
      asset_code: config.assetCode,
      account: this.context.expects.clientKeypair.publicKey(),
      type: withdrawType,
      ...withdrawTypeFields,
    });
    const getWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          withdrawEndpoint +
          `?${callParams.toString()}`,
        { ...headers },
      ),
    };
    result.networkCalls.push(getWithdrawCall);
    const responseBody = await makeRequest(
      getWithdrawCall,
      200,
      result,
      "application/json",
    );
    if (!responseBody || !getWithdrawCall.response) return result;
    let schema;
    if (getWithdrawCall.response.status == 200) {
      schema = withdrawSuccessResponseSchema;
    } else {
      schema = customerInfoStatusSchema;
    }
    const validatorResult = validate(responseBody, schema);
    if (validatorResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validatorResult.errors.join("\n"),
        success:
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed-1",
        customerInfoStatus:
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#3-customer-information-status",
      });
      return result;
    }
    this.context.provides.sep6TransactionId = responseBody.id || null;
    if (getWithdrawCall.response.status === 200) {
      try {
        Keypair.fromPublicKey(responseBody.account_id);
      } catch {
        result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
          errors: "invalid Stellar public key",
          success:
            "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed-1",
          customerInfoStatus: "N/A",
        });
        return result;
      }
      let memoValue = responseBody.memo;
      if (responseBody.memo_type === "hash") {
        memoValue = Buffer.from(responseBody.memo, "base64");
      }
      try {
        new Memo(responseBody.memo_type, memoValue);
      } catch {
        result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
          errors: "invalid 'memo' for 'memo_type'",
          success:
            "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed-1",
          customerInfoStatus: "N/A",
        });
        return result;
      }
    }
    return result;
  },
};
tests.push(returnsProperSchemaForKnownAccounts);

export default tests;
