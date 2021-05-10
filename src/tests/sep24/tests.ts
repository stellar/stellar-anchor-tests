import fetch from "node-fetch";
import { Request } from "node-fetch";
import { validate } from "jsonschema";

import { Suite, Test, Result, NetworkCall, Config, Failure } from "../../types";
import { makeFailure } from "../../helpers/failure";
import {
  noTomlFailure,
  checkTomlObj,
  getTomlFailureModes,
} from "../../helpers/sep1";
import { infoSchema } from "../../schemas/sep24";

const sep24TomlSuite: Suite = {
  sep: 24,
  name: "Toml Tests",
  tests: [],
  context: {
    tomlObj: undefined,
  },
};

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

/*const depositSuite: Suite = {
  sep: 24,
  name: "Deposit Tests",
  tests: [],
  context: { tomlObj: undefined }
}*/

const transferServerUrlFailures: Record<string, Failure> = {
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
};

const validTransferServerUrl: Test = {
  assertion: "has a valid transfer server URL",
  successMessage: "has a valid transfer server URL",
  failureModes: {
    ...getTomlFailureModes,
    ...transferServerUrlFailures,
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
    suite.context.transferServerUrl =
      suite.context.tomlObj.TRANSFER_SERVER_SEP0024 ||
      suite.context.tomlObj.TRANSFER_SERVER;
    if (!suite.context.transferServerUrl) {
      result.failure = makeFailure(
        transferServerUrlFailures.TRANSFER_SERVER_NOT_FOUND,
      );
      return result;
    }
    if (!suite.context.transferServerUrl.startsWith("https")) {
      result.failure = makeFailure(transferServerUrlFailures.NO_HTTPS);
      return result;
    }
    if (suite.context.tomlObj.WEB_AUTH_ENDPOINT.slice(-1) === "/") {
      result.failure = makeFailure(transferServerUrlFailures.ENDS_WITH_SLASH);
      return result;
    }
    return result;
  },
};
sep24TomlSuite.tests.push(validTransferServerUrl);

const checkTomlAndTransferServer = async (
  config: Config,
  suite: Suite,
): Promise<Result | void> => {
  const tomlResult = await checkTomlObj(config, suite);
  if (tomlResult) return tomlResult;
  const transferServerResult = await validTransferServerUrl.run(config, suite);
  if (transferServerResult.failure) {
    if (
      transferServerResult.failure.name !==
      transferServerUrlFailures.ENDS_WITH_SLASH.name
    ) {
      return transferServerResult;
    }
    suite.context.transferServerUrl = suite.context.transferServerUrl.slice(
      0,
      -1,
    );
  }
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
  before: checkTomlAndTransferServer,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
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

export default [sep24TomlSuite, infoSuite];
