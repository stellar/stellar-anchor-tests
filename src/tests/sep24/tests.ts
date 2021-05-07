import fetch from "node-fetch";
import { Request } from "node-fetch";
import { validate } from "jsonschema";

import { Suite, Test, Result, NetworkCall, Config } from "../../types";
import { makeFailure } from "../../helpers/failure";
import { noTomlFailure, checkTomlObj } from "../../helpers/sep1";
import { infoSchema } from "../../schemas/sep24";

const infoSuite: Suite = {
  sep: 24,
  name: "Info Tests",
  tests: [],
  context: {
    tomlObj: undefined,
    transferServerUrl: undefined,
    infoObj: undefined,
  },
};

const isCompliantWithSchema: Test = {
  assertion: "response is compliant with the schema",
  successMessage: "the response body is compliant with the schema",
  failureModes: {
    NO_TOML: noTomlFailure,
    CONNECTION_ERROR: {
      name: "connection error",
      text: (args: any) => {
        return (
          `A connection failure occured when making a request to: ` +
          `\n\n${args.url}\n\n` +
          `Make sure that CORS is enabled.`
        );
      },
    },
    TRANSFER_SERVER_NOT_FOUND: {
      name: "TRANSFER_SERVER_SEP0024 not found",
      text(_args: any): string {
        return "The stellar.toml file does not have a valid TRANSFER_SERVER_SEP0024 URL";
      },
    },
    BAD_CONTENT_TYPE: {
      name: "bad content type",
      text: (_args: any) => {
        return "Content-Type headers for /info responses must be application/json";
      },
    },
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
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!suite.context.tomlObj) return result;
    suite.context.transferServerUrl =
      suite.context.tomlObj.TRANSFER_SERVER_SEP0024 ||
      suite.context.tomlObj.TRANSFER_SERVER;
    if (!suite.context.transferServerUrl) {
      result.failure = makeFailure(this.failureModes.TRANSFER_SERVER_NOT_FOUND);
      return result;
    }
    const infoCall: NetworkCall = {
      request: new Request(suite.context.transferServerUrl + "/info"),
    };
    result.networkCalls.push(infoCall);
    try {
      infoCall.response = await fetch(infoCall.request.clone());
    } catch {
      result.failure = makeFailure(this.failureModes.CONNECTION_ERROR, {
        url: infoCall.request.url,
      });
      return result;
    }
    if (infoCall.response.status !== 200) {
      result.failure = makeFailure(this.failureModes.UNEXPECTED_STATUS_CODE);
      result.expected = 200;
      result.actual = infoCall.response.status;
      return result;
    }
    if (infoCall.response.headers.get("Content-Type") !== "application/json") {
      result.failure = makeFailure(this.failureModes.BAD_CONTENT_TYPE);
      return result;
    }
    suite.context.infoObj = await infoCall.response.clone().json();
    const validationResult = validate(suite.context.infoObj, infoSchema);
    if (validationResult.errors.length > 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
    }
    return result;
  },
};
infoSuite.tests.push(isCompliantWithSchema);

export default [infoSuite];
