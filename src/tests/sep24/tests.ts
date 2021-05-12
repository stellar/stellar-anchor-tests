import { Request } from "node-fetch";
import { validate } from "jsonschema";
import { Keypair } from "stellar-sdk";

import { Test, Result, NetworkCall, Config } from "../../types";
import { makeFailure, genericFailures } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import {
  infoSchema,
  successResponseSchema,
  getTransactionSchema,
  transactionsSchema,
} from "../../schemas/sep24";
import { tomlExists } from "../sep1/tests";
import { hasWebAuthEndpoint, returnsValidJwt } from "../sep10/tests";

const tomlTestsGroup = "TOML tests";
const infoTestsGroup = "/info";
const depositTestsGroup = "/deposit";
const withdrawTestsGroup = "/withdraw";
const transactionsTestGroup = "/transactions";
const transactionTestGroup = "/transaction";
const tests: Test[] = [];

const depositEndpoint = "/transactions/deposit/interactive";
const withdrawEndpoint = "/transactions/withdraw/interactive";
const transactionsEndpoint = "/transactions";
const transactionEndpoint = "/transaction";

const hasTransferServerUrl: Test = {
  assertion: "has a valid transfer server URL",
  sep: 24,
  group: tomlTestsGroup,
  dependencies: [tomlExists],
  failureModes: {
    TRANSFER_SERVER_NOT_FOUND: {
      name: "TRANSFER_SERVER_SEP0024 not found",
      text(_args: any): string {
        return "The stellar.toml file does not have a valid TRANSFER_SERVER_SEP0024 URL";
      },
    },
    NO_HTTPS: {
      name: "no https",
      text(_args: any): string {
        return "The transfer server URL must use HTTPS";
      },
    },
    ENDS_WITH_SLASH: {
      name: "ends with slash",
      text(_args: any): string {
        return "The transfer server URL cannot end with a '/'";
      },
    },
  },
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {
      transferServerUrl: undefined,
    },
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    this.context.provides.transferServerUrl =
      this.context.expects.tomlObj.TRANSFER_SERVER_SEP0024 ||
      this.context.expects.tomlObj.TRANSFER_SERVER;
    if (!this.context.provides.transferServerUrl) {
      result.failure = makeFailure(this.failureModes.TRANSFER_SERVER_NOT_FOUND);
      return result;
    }
    if (!this.context.provides.transferServerUrl.startsWith("https")) {
      result.failure = makeFailure(this.failureModes.NO_HTTPS);
      return result;
    }
    if (this.context.provides.transferServerUrl.slice(-1) === "/") {
      result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
      return result;
    }
    return result;
  },
};
tests.push(hasTransferServerUrl);

const isCompliantWithSchema: Test = {
  assertion: "response is compliant with the schema",
  sep: 24,
  group: infoTestsGroup,
  dependencies: [tomlExists, hasTransferServerUrl],
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /info endpoint:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#info\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
    ...genericFailures,
  },
  context: {
    expects: {
      transferServerUrl: undefined,
    },
    provides: {
      infoObj: undefined,
    },
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const infoCall: NetworkCall = {
      request: new Request(this.context.expects.transferServerUrl + "/info"),
    };
    result.networkCalls.push(infoCall);
    this.context.provides.infoObj = await makeRequest(
      infoCall,
      200,
      result,
      "application/json",
    );
    if (result.failure) {
      return result;
    }
    const validationResult = validate(
      this.context.provides.infoObj,
      infoSchema,
    );
    if (validationResult.errors.length > 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
    }
    return result;
  },
};
tests.push(isCompliantWithSchema);

const assetCodeEnabledForDeposit: Test = {
  assertion: "configured asset code is enabled for deposit",
  sep: 24,
  group: depositTestsGroup,
  dependencies: [tomlExists, isCompliantWithSchema],
  failureModes: {
    CONFIGURED_ASSET_CODE_NOT_FOUND: {
      name: "configured asset code not found",
      text(args: any): string {
        return `${args.assetCode} is not present in the /info response`;
      },
    },
    CONFIGURED_ASSET_CODE_NOT_ENABLED: {
      name: "configured asset code not enabled",
      text(args: any): string {
        return `${args.assetCode} is not enabled for SEP-24`;
      },
    },
    NO_ASSET_CODES: {
      name: "no enabled assets",
      text(_args: any): string {
        return "There are no enabled assets in the /info response";
      },
    },
    ...genericFailures,
  },
  context: {
    expects: {
      infoObj: undefined,
    },
    provides: {},
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const depositAssets = this.context.expects.infoObj.deposit;
    if (!config.assetCode) {
      for (const assetCode in depositAssets) {
        if (depositAssets[assetCode].enabled) {
          config.assetCode = assetCode;
          break;
        }
      }
      if (!config.assetCode) {
        result.failure = makeFailure(this.failureModes.NO_ASSET_CODES);
        return result;
      }
    } else {
      if (!depositAssets[config.assetCode]) {
        result.failure = makeFailure(
          this.failureModes.CONFIGURED_ASSET_CODE_NOT_FOUND,
          { assetCode: config.assetCode },
        );
        return result;
      } else if (!depositAssets[config.assetCode].enabled) {
        result.failure = makeFailure(
          this.failureModes.CONFIGURED_ASSET_CODE_NOT_ENABLED,
          { assetCode: config.assetCode },
        );
        return result;
      }
    }
    return result;
  },
};
tests.push(assetCodeEnabledForDeposit);

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

const returnsProperSchemaForValidDepositRequest: Test = {
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
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /deposit endpoint:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#deposit-and-withdraw-shared-responses\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
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

const assetCodeEnabledForWithdraw: Test = {
  assertion: "configured asset code is enabled for withdraw",
  sep: 24,
  group: withdrawTestsGroup,
  dependencies: [tomlExists, isCompliantWithSchema],
  failureModes: {
    CONFIGURED_ASSET_CODE_NOT_FOUND: {
      name: "configured asset code not found",
      text(args: any): string {
        return `${args.assetCode} is not present in the /info response`;
      },
    },
    CONFIGURED_ASSET_CODE_NOT_ENABLED: {
      name: "configured asset code not enabled",
      text(args: any): string {
        return `${args.assetCode} is not enabled for SEP-24`;
      },
    },
    NO_ASSET_CODES: {
      name: "no enabled assets",
      text(_args: any): string {
        return "There are no enabled assets in the /info response";
      },
    },
    ...genericFailures,
  },
  context: {
    expects: {
      infoObj: undefined,
    },
    provides: {},
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const withdrawAssets = this.context.expects.infoObj.withdraw;
    if (!config.assetCode) {
      for (const assetCode in withdrawAssets) {
        if (withdrawAssets[assetCode].enabled) {
          config.assetCode = assetCode;
          break;
        }
      }
      if (!config.assetCode) {
        result.failure = makeFailure(this.failureModes.NO_ASSET_CODES);
        return result;
      }
    } else {
      if (!withdrawAssets[config.assetCode]) {
        result.failure = makeFailure(
          this.failureModes.CONFIGURED_ASSET_CODE_NOT_FOUND,
          { assetCode: config.assetCode },
        );
        return result;
      } else if (!withdrawAssets[config.assetCode].enabled) {
        result.failure = makeFailure(
          this.failureModes.CONFIGURED_ASSET_CODE_NOT_ENABLED,
          { assetCode: config.assetCode },
        );
        return result;
      }
    }
    return result;
  },
};
tests.push(assetCodeEnabledForWithdraw);

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

const returnsProperSchemaForValidWithdrawRequest: Test = {
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
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /withdraw endpoint:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#deposit-and-withdraw-shared-responses\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
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
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /transaction endpoint:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#single-historical-transaction\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
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

const hasProperWithdrawTransactionSchema: Test = {
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
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /transaction endpoint:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#single-historical-transaction\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
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

const transactionsRequiresToken: Test = {
  assertion: "requires a JWT",
  sep: 24,
  group: transactionsTestGroup,
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
    const transactionsCall = {
      request: new Request(
        this.context.expects.transferServerUrl + transactionsEndpoint,
      ),
    };
    result.networkCalls.push(transactionsCall);
    makeRequest(transactionsCall, 403, result);
    return result;
  },
};
tests.push(transactionsRequiresToken);

const transactionsIsPresentAfterDepositRequest: Test = {
  assertion: "has a record on /transactions after a deposit request",
  sep: 24,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    assetCodeEnabledForDeposit,
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
      depositTransactionsObj: undefined,
    },
  },
  failureModes: {
    TRANSACTION_NOT_FOUND: {
      name: "transaction not found",
      text(args: any): string {
        return `A transaction record with id ${args.id} was not included in the response body.`;
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl +
          transactionsEndpoint +
          `?asset_code=${config.assetCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    const transactionsBody = await makeRequest(
      getTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!transactionsBody) return result;
    if (
      !transactionsBody.transactions ||
      !Array.isArray(transactionsBody.transactions)
    ) {
      result.failure = makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
        id: this.context.expects.depositTransactionId,
      });
      return result;
    }
    let transactionFound = false;
    for (const t of transactionsBody.transactions) {
      if (t.id === this.context.expects.depositTransactionId) {
        transactionFound = true;
        break;
      }
    }
    if (!transactionFound) {
      result.failure = makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
        id: this.context.expects.depositTransactionId,
      });
      return result;
    }
    this.context.provides.depositTransactionsObj = transactionsBody;
    return result;
  },
};
tests.push(transactionsIsPresentAfterDepositRequest);

const transactionsIsPresentAfterWithdrawRequest: Test = {
  assertion: "has a record on /transactions after a withdraw request",
  sep: 24,
  group: transactionsTestGroup,
  dependencies: [
    hasTransferServerUrl,
    assetCodeEnabledForWithdraw,
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
      withdrawTransactionsObj: undefined,
    },
  },
  failureModes: {
    TRANSACTION_NOT_FOUND: {
      name: "transaction not found",
      text(args: any): string {
        return `A transaction record with id ${args.id} was not included in the response body.`;
      },
    },
    ...genericFailures,
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTransactionsCall: NetworkCall = {
      request: new Request(
        this.context.expects.transferServerUrl +
          transactionsEndpoint +
          `?asset_code=${config.assetCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getTransactionsCall);
    const transactionsBody = await makeRequest(
      getTransactionsCall,
      200,
      result,
      "application/json",
    );
    if (!transactionsBody) return result;
    if (
      !transactionsBody.transactions ||
      !Array.isArray(transactionsBody.transactions)
    ) {
      result.failure = makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
        id: this.context.expects.withdrawTransactionId,
      });
      return result;
    }
    let transactionFound = false;
    for (const t of transactionsBody.transactions) {
      if (t.id === this.context.expects.withdrawTransactionId) {
        transactionFound = true;
        break;
      }
    }
    if (!transactionFound) {
      result.failure = makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
        id: this.context.expects.withdrawTransactionId,
      });
      return result;
    }
    this.context.provides.withdrawTransactionsObj = transactionsBody;
    return result;
  },
};
tests.push(transactionsIsPresentAfterWithdrawRequest);

const hasProperDepositTransactionsSchema: Test = {
  assertion: "has proper deposit transaction schema on /transactions",
  sep: 24,
  group: transactionsTestGroup,
  dependencies: [
    returnsProperSchemaForValidDepositRequest,
    transactionsIsPresentAfterDepositRequest,
  ],
  context: {
    expects: {
      depositTransactionsObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /transactions endpoint:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#transaction-history\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const validationResult = validate(
      this.context.expects.depositTransactionsObj,
      transactionsSchema,
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
    }
    return result;
  },
};
tests.push(hasProperDepositTransactionsSchema);

const hasProperWithdrawTransactionsSchema: Test = {
  assertion: "has proper withdraw transaction schema on /transactions",
  sep: 24,
  group: transactionsTestGroup,
  dependencies: [
    returnsProperSchemaForValidWithdrawRequest,
    transactionsIsPresentAfterWithdrawRequest,
  ],
  context: {
    expects: {
      withdrawTransactionsObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /transactions endpoint:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#transaction-history\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const validationResult = validate(
      this.context.expects.withdrawTransactionsObj,
      transactionsSchema,
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
    }
    return result;
  },
};
tests.push(hasProperWithdrawTransactionsSchema);

export default tests;
