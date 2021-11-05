import { Request } from "node-fetch";
import { validate } from "jsonschema";

import { Test, Config, Result, NetworkCall } from "../../types";
import { hasDirectPaymentServer } from "./toml";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { infoSchema } from "../../schemas/sep31";

const hasValidInfoSchema: Test = {
  assertion: "matches the expected schema",
  sep: 31,
  group: "GET /info",
  dependencies: [hasDirectPaymentServer],
  context: {
    expects: {
      directPaymentServerUrl: undefined,
    },
    provides: {
      sep31InfoObj: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body from GET /info does not match the schema defined by the protocol. " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#get-info",
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getInfoCall: NetworkCall = {
      request: new Request(
        this.context.expects.directPaymentServerUrl + "/info",
      ),
    };
    result.networkCalls.push(getInfoCall);
    this.context.provides.sep31InfoObj = await makeRequest(
      getInfoCall,
      200,
      result,
      "application/json",
    );
    if (!this.context.provides.sep31InfoObj) return result;
    const validationResult = validate(
      this.context.provides.sep31InfoObj,
      infoSchema,
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    return result;
  },
};

export const hasExpectedAssetEnabled: Test = {
  assertion: "has expected asset enabled",
  sep: 31,
  group: "GET /info",
  dependencies: [hasValidInfoSchema],
  context: {
    expects: {
      sep31InfoObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    ASSET_NOT_FOUND: {
      name: "expected asset not found",
      text(args: any): string {
        return `The /info response body does not contain information for ${args.assetCode}`;
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#response",
      },
    },
    NO_ASSET_CODES: {
      name: "no enabled assets",
      text(_args: any): string {
        return "There are no enabled assets in the /info response";
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#response",
      },
    },
    ASSET_CODE_NOT_ENABLED: {
      name: "configured asset code not enabled",
      text(args: any): string {
        return `${args.assetCode} is not enabled for SEP-31`;
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#response",
      },
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!config.assetCode) {
      for (const assetCode in this.context.expects.sep31InfoObj.receive) {
        if (this.context.expects.sep31InfoObj.receive[assetCode].enabled) {
          config.assetCode = assetCode;
          break;
        }
      }
      if (!config.assetCode) {
        result.failure = makeFailure(this.failureModes.NO_ASSET_CODES);
        return result;
      }
    }
    if (
      !Object.keys(this.context.expects.sep31InfoObj.receive).includes(
        config.assetCode,
      )
    ) {
      result.failure = makeFailure(this.failureModes.ASSET_NOT_FOUND, {
        assetCode: config.assetCode,
      });
      return result;
    } else if (
      !this.context.expects.sep31InfoObj.receive[config.assetCode].enabled
    ) {
      result.failure = makeFailure(this.failureModes.ASSET_CODE_NOT_ENABLED, {
        assetCode: config.assetCode,
      });
      return result;
    }
    return result;
  },
};

const hasExpectedTransactionFields: Test = {
  assertion: "has configured transaction 'fields'",
  sep: 31,
  group: "GET /info",
  dependencies: [hasValidInfoSchema],
  context: {
    expects: {
      sep31InfoObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    FIELD_NOT_FOUND: {
      name: "field not found",
      text(_args: any): string {
        return (
          "A field specified in SEP-31's configuration is not specified " +
          "in the /info response body."
        );
      },
      links: {
        "Fields Schema":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#fields-object-schema",
      },
    },
    UNEXPECTED_FIELD: {
      name: "unexpected field",
      text(args: any): string {
        return (
          `${args.field} is specified as required in the /info response ` +
          "body but is not present in SEP-31's configuration"
        );
      },
    },
  },
  async run(config: Config): Promise<Result> {
    if (!config.assetCode || !config.sepConfig || !config.sepConfig["31"])
      // this is checked before tests are run
      throw new Error("improperly configured");
    const result: Result = { networkCalls: [] };
    const responseTransactionFields =
      this.context.expects.sep31InfoObj.receive[config.assetCode].fields
        .transaction;
    const responseTransactionFieldNames = Object.keys(
      responseTransactionFields,
    );
    const configuredTransactionFieldNames = Object.keys(
      config.sepConfig["31"].transactionFields,
    );
    for (const fieldName of responseTransactionFieldNames) {
      if (
        !responseTransactionFields[fieldName].optional &&
        !configuredTransactionFieldNames.includes(fieldName)
      ) {
        result.failure = makeFailure(this.failureModes.UNEXPECTED_FIELD, {
          field: fieldName,
        });
        return result;
      }
    }
    for (const fieldName of configuredTransactionFieldNames) {
      if (!responseTransactionFieldNames.includes(fieldName)) {
        result.failure = makeFailure(this.failureModes.FIELD_NOT_FOUND);
        result.expected = fieldName;
        return result;
      }
    }
    return result;
  },
};

export default [
  hasValidInfoSchema,
  hasExpectedAssetEnabled,
  hasExpectedTransactionFields,
];
