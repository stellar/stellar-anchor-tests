import { Request } from "node-fetch";
import { Keypair } from "stellar-sdk";
import { validate } from "jsonschema";

import { Test, Result, Config, NetworkCall, Failure } from "../../types";
import { hasTransferServerUrl } from "./toml";
import { assetCodeEnabledForWithdraw } from "./info";
import { tomlExists } from "../sep1/tests";
import { hasWebAuthEndpoint, returnsValidJwt } from "../sep10/tests";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { successResponseSchema } from "../../schemas/sep24";

const withdrawTestsGroup = "/withdraw";
const withdrawEndpoint = "/transactions/withdraw/interactive";
const tests: Test[] = [];

export const invalidWithdrawSchema: Failure = {
  name: "invalid schema",
  text(args: any): string {
    return (
      "The response body returned does not comply with the schema defined for the /withdraw endpoint:\n\n" +
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#deposit-and-withdraw-shared-responses\n\n" +
      "The errors returned from the schema validation:\n\n" +
      `${args.errors}`
    );
  },
};

const withdrawRequiresToken: Test = {
  assertion: "requires a SEP-10 JWT",
  sep: 24,
  group: withdrawTestsGroup,
  dependencies: [hasTransferServerUrl, assetCodeEnabledForWithdraw],
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
    const postWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + withdrawEndpoint,
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
    result.networkCalls.push(postWithdrawCall);
    await makeRequest(postWithdrawCall, 403, result);
    return result;
  },
};
tests.push(withdrawRequiresToken);

const withdrawRequiresAssetCode: Test = {
  assertion: "requires 'asset_code' parameter",
  sep: 24,
  group: withdrawTestsGroup,
  dependencies: [
    tomlExists,
    hasWebAuthEndpoint,
    returnsValidJwt,
    hasTransferServerUrl,
    assetCodeEnabledForWithdraw,
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
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + withdrawEndpoint,
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
    result.networkCalls.push(postWithdrawCall);
    const errorResponse = await makeRequest(
      postWithdrawCall,
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

const withdrawRejectsUnsupportedAssetCode: Test = {
  assertion: "rejects unsupported 'asset_code' parameter",
  sep: 24,
  group: withdrawTestsGroup,
  dependencies: withdrawRequiresAssetCode.dependencies,
  context: withdrawRequiresAssetCode.context,
  failureModes: withdrawRequiresAssetCode.failureModes,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + withdrawEndpoint,
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
    result.networkCalls.push(postWithdrawCall);
    const errorResponse = await makeRequest(
      postWithdrawCall,
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

export const returnsProperSchemaForValidWithdrawRequest: Test = {
  assertion: "returns a proper schema for valid requests",
  sep: 24,
  group: withdrawTestsGroup,
  dependencies: withdrawRequiresAssetCode.dependencies,
  context: {
    expects: withdrawRequiresAssetCode.context.expects,
    provides: {
      withdrawTransactionId: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: invalidWithdrawSchema,
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postWithdrawCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl + withdrawEndpoint,
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
    result.networkCalls.push(postWithdrawCall);
    const responseBody = await makeRequest(
      postWithdrawCall,
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
    this.context.provides.withdrawTransactionId = responseBody.id;
    return result;
  },
};
tests.push(returnsProperSchemaForValidWithdrawRequest);

export default tests;
