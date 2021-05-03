import fetch from "node-fetch";
import { Request } from "node-fetch";
import { parse } from "toml";
import { validate } from "jsonschema";

import { Suite, Test, Result, NetworkCall, Config } from "../../types";
import { makeFailure } from "../../helpers/failure";
import { infoSchema } from "../../schemas/sep24";

let transferServerUrl: string;
let infoObj: any;
let tomlObj: any;

const infoSuite: Suite = {
  sep: 24,
  name: "Info Tests",
  tests: [],
};

const isCompliantWithSchema: Test = {
  assertion: "response is compliant with the schema",
  successMessage: "the response body is compliant with the schema",
  failureModes: {
    CONNECTION_ERROR: {
      name: "connection error",
      text(args: any): string {
        return (
          `A connection failure occured when making a request to: ` +
          `\n\n${args.url}/\n\n` +
          `Make sure CORS is enabled for this endpoint.`
        );
      },
    },
    PARSE_ERROR: {
      name: "parse error",
      text: (args: any) => {
        return (
          "stellar.toml files must comply with the TOML format specification\n\n" +
          "https://toml.io/en/v1.0.0\n\nThe parsing library returned:\n\n" +
          `Line: ${args.line}\nColumn: ${args.column}\nError: ${args.message}`
        );
      },
    },
    TRANSFER_SERVER_NOT_FOUND: {
      name: "TRANSFER_SERVER_SEP0024 not found",
      text(_args: any): string {
        return "The stellar.toml file does not have a valid TRANSFER_SERVER_SEP0024 URL";
      },
    },
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text: (_args: any) => {
        return "A HTTP 200 Success is expected for /info responses.";
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
  async run(config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    const tomlCall: NetworkCall = {
      request: new Request(config.homeDomain + "/.well-known/stellar.toml"),
    };
    result.networkCalls.push(tomlCall);
    try {
      tomlCall.response = await fetch(tomlCall.request.clone());
    } catch {
      result.failure = makeFailure(
        this.failureModes.CONNECTION_ERROR,
        { url: tomlCall.request.url },
        config,
      );
      return result;
    }
    try {
      tomlObj = parse(await tomlCall.response.clone().text());
    } catch (e) {
      result.failure = makeFailure(
        this.failureModes.PARSE_ERROR,
        {
          message: e.message,
          line: e.line,
          column: e.column,
        },
        config,
      );
      return result;
    }
    transferServerUrl =
      tomlObj.TRANSFER_SERVER_SEP0024 || tomlObj.TRANSFER_SERVER;
    if (!transferServerUrl) {
      result.failure = makeFailure(
        this.failureModes.TRANSFER_SERVER_NOT_FOUND,
        {},
        config,
      );
      return result;
    }
    const infoCall: NetworkCall = {
      request: new Request(transferServerUrl + "/info"),
    };
    result.networkCalls.push(infoCall);
    try {
      infoCall.response = await fetch(infoCall.request.clone());
    } catch {
      result.failure = makeFailure(
        this.failureModes.CONNECTION_ERROR,
        { url: infoCall.request.url },
        config,
      );
      return result;
    }
    if (infoCall.response.headers.get("Content-Type") !== "application/json") {
      result.failure = makeFailure(
        this.failureModes.BAD_CONTENT_TYPE,
        {},
        config,
      );
      return result;
    }
    infoObj = await infoCall.response.clone().json();
    const validationResult = validate(infoObj, infoSchema);
    if (validationResult.errors.length > 0) {
      result.failure = makeFailure(
        this.failureModes.INVALID_SCHEMA,
        { errors: validationResult.errors },
        config,
      );
    }
    return result;
  },
};
infoSuite.tests.push(isCompliantWithSchema);

export default [infoSuite];
