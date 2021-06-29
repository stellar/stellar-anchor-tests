import { Request } from "node-fetch";
import { Keypair } from "stellar-sdk";
import { validate } from "jsonschema";

import { Test, Result, Config, NetworkCall, Failure } from "../../types";
import { hasTransferServerUrl } from "./toml";
import { assetCodeEnabledForDeposit } from "./info";
import { tomlExists } from "../sep1/tests";
import { hasWebAuthEndpoint, returnsValidJwt } from "../sep10/tests";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { successResponseSchema } from "../../schemas/sep24";

const depositTestsGroup = "/deposit";
export const depositEndpoint = "/transactions/deposit/interactive";
const tests: Test[] = [];

export const invalidDepositSchema: Failure = {
  name: "invalid schema",
  text(args: any): string {
    return (
      "The response body returned does not comply with the schema defined for the /deposit endpoint. " +
      "The errors returned from the schema validation:\n\n" +
      `${args.errors}`
    );
  },
  links: {
    "Deposit Response":
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#2-interactive-customer-information-needed",
  },
};

const depositRequiresToken: Test = {
  assertion: "requires a SEP-10 JWT",
  sep: 24,
  group: depositTestsGroup,
  dependencies: [hasTransferServerUrl, assetCodeEnabledForDeposit],
  context: {
    expects: {
      transferServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: {
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + depositEndpoint,
        {
          method: "POST",
          body: JSON.stringify({
            account: Keypair.random().publicKey(),
            asset_code: config.assetCode,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
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
  sep: 24,
  group: depositTestsGroup,
  dependencies: [
    tomlExists,
    hasWebAuthEndpoint,
    returnsValidJwt,
    hasTransferServerUrl,
    assetCodeEnabledForDeposit,
  ],
  context: {
    expects: {
      tomlObj: undefined,
      webAuthEndpoint: undefined,
      token: undefined,
      clientKeypair: undefined,
      transferServerUrl: undefined,
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
      links: {
        "Error Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#6-error",
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + depositEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.context.expects.token}`,
          },
          body: JSON.stringify({
            account: this.context.expects.clientKeypair.publicKey(),
          }),
        },
      ),
    };
    result.networkCalls.push(postDepositCall);
    const errorResponse = await makeRequest(
      postDepositCall,
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
  assertion: "requires 'account' parameter",
  sep: 24,
  group: depositTestsGroup,
  dependencies: depositRequiresAssetCode.dependencies,
  context: depositRequiresAssetCode.context,
  failureModes: depositRequiresAssetCode.failureModes,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + depositEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.context.expects.token}`,
          },
          body: JSON.stringify({ asset_code: config.assetCode }),
        },
      ),
    };
    result.networkCalls.push(postDepositCall);
    const errorResponse = await makeRequest(
      postDepositCall,
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
  assertion: "rejects invalid 'account' parameter",
  sep: 24,
  group: depositTestsGroup,
  dependencies: depositRequiresAssetCode.dependencies,
  context: depositRequiresAssetCode.context,
  failureModes: depositRequiresAssetCode.failureModes,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + depositEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.context.expects.token}`,
          },
          body: JSON.stringify({
            asset_code: config.assetCode,
            account: "not a valid account",
          }),
        },
      ),
    };
    result.networkCalls.push(postDepositCall);
    const errorResponse = await makeRequest(
      postDepositCall,
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
  sep: 24,
  group: depositTestsGroup,
  dependencies: depositRequiresAssetCode.dependencies,
  context: depositRequiresAssetCode.context,
  failureModes: depositRequiresAssetCode.failureModes,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + depositEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.context.expects.token}`,
          },
          body: JSON.stringify({
            asset_code: "NOT_SUPPORTED",
            account: this.context.expects.clientKeypair.publicKey(),
          }),
        },
      ),
    };
    result.networkCalls.push(postDepositCall);
    const errorResponse = await makeRequest(
      postDepositCall,
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

export const returnsProperSchemaForValidDepositRequest: Test = {
  assertion: "returns a proper schema for valid requests",
  sep: 24,
  group: depositTestsGroup,
  dependencies: depositRequiresAssetCode.dependencies,
  context: {
    expects: depositRequiresAssetCode.context.expects,
    provides: {
      depositTransactionId: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: invalidDepositSchema,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postDepositCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + depositEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.context.expects.token}`,
          },
          body: JSON.stringify({
            asset_code: config.assetCode,
            account: this.context.expects.clientKeypair.publicKey(),
          }),
        },
      ),
    };
    result.networkCalls.push(postDepositCall);
    const responseBody = await makeRequest(
      postDepositCall,
      200,
      result,
      "application/json",
    );
    if (!responseBody) return result;
    const validatorResult = validate(responseBody, successResponseSchema);
    if (validatorResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validatorResult.errors.join("\n"),
      });
    }
    this.context.provides.depositTransactionId = responseBody.id;
    return result;
  },
};
tests.push(returnsProperSchemaForValidDepositRequest);

export default tests;
