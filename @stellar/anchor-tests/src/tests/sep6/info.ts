import { Request } from "node-fetch";
import { validate } from "jsonschema";

import { Test, Result, Config, NetworkCall } from "../../types";
import { tomlExists } from "../sep1/tests";
import { hasTransferServerUrl } from "./toml";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { infoSchema } from "../../schemas/sep6";

const infoTestsGroup = "GET /info";

export const isCompliantWithSchema: Test = {
  assertion: "response is compliant with the schema",
  sep: 6,
  group: infoTestsGroup,
  dependencies: [tomlExists, hasTransferServerUrl],
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body returned does not comply with the schema defined for the /info endpoint. " +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#info",
      },
    },
    ...genericFailures,
  },
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
    },
    provides: {
      sep6InfoObj: undefined,
    },
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const infoCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl + "/info",
      ),
    };
    result.networkCalls.push(infoCall);
    this.context.provides.sep6InfoObj = await makeRequest(
      infoCall,
      200,
      result,
      "application/json",
    );
    if (result.failure) {
      return result;
    }
    const validationResult = validate(
      this.context.provides.sep6InfoObj,
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

export const assetCodeEnabledForDeposit: Test = {
  assertion: "configured asset code is enabled for deposit",
  sep: 6,
  group: infoTestsGroup,
  dependencies: [tomlExists, isCompliantWithSchema],
  failureModes: {
    CONFIGURED_ASSET_CODE_NOT_FOUND: {
      name: "configured asset code not found",
      text(args: any): string {
        return `${args.assetCode} is not present in the /info response`;
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#response-2",
      },
    },
    CONFIGURED_ASSET_CODE_NOT_ENABLED: {
      name: "configured asset code not enabled",
      text(args: any): string {
        return `${args.assetCode} is not enabled for SEP-6`;
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#response-2",
      },
    },
    NO_ASSET_CODES: {
      name: "no enabled assets",
      text(_args: any): string {
        return "There are no enabled assets in the /info response";
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#response-2",
      },
    },
    ...genericFailures,
  },
  context: {
    expects: {
      sep6InfoObj: undefined,
    },
    provides: {
      sep6DepositFieldsRequired: undefined,
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const depositAssets = this.context.expects.sep6InfoObj.deposit;
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
    this.context.provides.sep6DepositFieldsRequired = [];
    if (depositAssets[config.assetCode].fields) {
      for (const fieldName in depositAssets[config.assetCode].fields) {
        if (!depositAssets[config.assetCode].fields[fieldName].optional)
          this.context.provides.sep6DepositFieldsRequired.push(fieldName);
      }
    }
    return result;
  },
};

export const assetCodeEnabledForWithdraw: Test = {
  assertion: "configured asset code is enabled for withdraw",
  sep: 6,
  group: infoTestsGroup,
  dependencies: [tomlExists, isCompliantWithSchema],
  failureModes: {
    CONFIGURED_ASSET_CODE_NOT_FOUND: {
      name: "configured asset code not found",
      text(args: any): string {
        return `${args.assetCode} is not present in the /info response`;
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#response-2",
      },
    },
    CONFIGURED_ASSET_CODE_NOT_ENABLED: {
      name: "configured asset code not enabled",
      text(args: any): string {
        return `${args.assetCode} is not enabled for SEP-6`;
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#response-2",
      },
    },
    NO_ASSET_CODES: {
      name: "no enabled assets",
      text(_args: any): string {
        return "There are no enabled assets in the /info response";
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#response-2",
      },
    },
    ...genericFailures,
  },
  context: {
    expects: {
      sep6InfoObj: undefined,
    },
    provides: {},
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const withdrawAssets = this.context.expects.sep6InfoObj.withdraw;
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

const requiredDepositFieldsMatchConfiguration: Test = {
  assertion:
    "SEP-9 fields required for deposit match those provided in configuration",
  sep: 6,
  group: infoTestsGroup,
  dependencies: [assetCodeEnabledForDeposit],
  context: {
    expects: {
      sep6DepositFieldsRequired: undefined,
    },
    provides: {},
  },
  failureModes: {
    FIELD_NOT_FOUND: {
      name: "field not found",
      text(_args: any): string {
        return (
          "A field specified in SEP-6's configuration is not specified " +
          "in the 'non_interactive_customer_info_needed' response body."
        );
      },
      links: {
        "Deposit Fields":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#for-each-deposit-asset-response-contains",
      },
    },
    UNEXPECTED_FIELD: {
      name: "unexpected field",
      text(args: any): string {
        return (
          `${args.field} is specified in 'non_interactive_customer_info_needed' ` +
          "response body but is not present in SEP-6's configuration"
        );
      },
    },
  },
  async run(config: Config): Promise<Result> {
    if (!config.sepConfig || !config.sepConfig["6"])
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    const depositFieldKeys = Object.keys(
      config.sepConfig["6"].deposit.transactionFields,
    );
    for (const configuredKey of depositFieldKeys) {
      if (
        !this.context.expects.sep6DepositFieldsRequired.includes(configuredKey)
      ) {
        result.failure = makeFailure(this.failureModes.FIELD_NOT_FOUND);
        result.expected = configuredKey;
        result.actual = this.context.expects.sep6DepositFieldsRequired;
        return result;
      }
    }
    for (const infoNeededField of this.context.expects
      .sep6DepositFieldsRequired) {
      if (!depositFieldKeys.includes(infoNeededField)) {
        result.failure = makeFailure(this.failureModes.UNEXPECTED_FIELD, {
          field: infoNeededField,
        });
        return result;
      }
    }
    return result;
  },
};

const requiredWithdrawFieldsMatchConfiguration: Test = {
  assertion:
    "SEP-9 fields required for withdraw match those provided in configuration",
  sep: 6,
  group: infoTestsGroup,
  dependencies: [assetCodeEnabledForWithdraw],
  context: {
    expects: {
      sep6InfoObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    TYPE_NOT_FOUND: {
      name: "type not found",
      text(_args: any): string {
        return (
          "A type specified in SEP-6's configuration is not specified " +
          "in the GET /info response body."
        );
      },
      links: {
        "Withdraw Fields":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#for-each-withdrawal-asset-response-contains",
      },
    },
    UNEXPECTED_TYPE: {
      name: "unexpected type",
      text(args: any): string {
        return (
          `${args.type} is specified in GET /info` +
          "response body but is not present in SEP-6's configuration"
        );
      },
    },
    FIELD_NOT_FOUND: {
      name: "field not found",
      text(_args: any): string {
        return (
          "A field specified in SEP-6's configuration is not specified " +
          "in the GET /info response body."
        );
      },
      links: {
        "Withdraw Fields":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#for-each-withdrawal-asset-response-contains",
      },
    },
    UNEXPECTED_FIELD: {
      name: "unexpected field",
      text(args: any): string {
        return (
          `${args.field} is specified in GET /info` +
          "response body but is not present in SEP-6's configuration"
        );
      },
    },
  },
  async run(config: Config): Promise<Result> {
    if (!config.sepConfig || !config.sepConfig["6"] || !config.assetCode)
      throw { message: "improperly configured" };
    const result: Result = { networkCalls: [] };
    const configuredWithdrawTypes = Object.keys(
      config.sepConfig["6"].withdraw.types || {},
    );
    const infoWithdrawTypes = Object.keys(
      this.context.expects.sep6InfoObj.withdraw[config.assetCode].types || {},
    );
    for (const configuredKey of configuredWithdrawTypes) {
      if (!infoWithdrawTypes.includes(configuredKey)) {
        result.failure = makeFailure(this.failureModes.TYPE_NOT_FOUND);
        result.expected = configuredKey;
        result.actual = infoWithdrawTypes.join(", ");
        return result;
      }
      const configuredTypeFields = (config.sepConfig["6"].withdraw.types || {})[
        configuredKey
      ].transactionFields;
      const infoTypeFields = Object.keys(
        (this.context.expects.sep6InfoObj.withdraw[config.assetCode].types ||
          {})[configuredKey].fields,
      );
      for (const fieldName in configuredTypeFields) {
        if (!infoTypeFields.includes(fieldName)) {
          result.failure = makeFailure(this.failureModes.FIELD_NOT_FOUND);
          result.expected = fieldName;
          result.actual = infoTypeFields.join(", ");
          return result;
        }
      }
    }
    for (const infoType of infoWithdrawTypes) {
      if (!configuredWithdrawTypes.includes(infoType)) {
        result.failure = makeFailure(this.failureModes.UNEXPECTED_TYPE, {
          type: infoType,
        });
        return result;
      }
      const configuredTypeFields = Object.keys(
        (config.sepConfig["6"].withdraw.types || {})[infoType]
          .transactionFields,
      );
      const infoTypeFields = (this.context.expects.sep6InfoObj.withdraw[
        config.assetCode
      ].types || {})[infoType].fields;
      for (const fieldName in infoTypeFields) {
        if (!configuredTypeFields.includes(fieldName)) {
          result.failure = makeFailure(this.failureModes.UNEXPECTED_FIELD, {
            field: fieldName,
          });
          return result;
        }
      }
    }
    return result;
  },
};

export default [
  isCompliantWithSchema,
  assetCodeEnabledForDeposit,
  assetCodeEnabledForWithdraw,
  requiredDepositFieldsMatchConfiguration,
  requiredWithdrawFieldsMatchConfiguration,
];
