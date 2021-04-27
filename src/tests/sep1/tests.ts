import fetch from "node-fetch";
import { Request, Response } from "node-fetch";
import toml from "toml";

import { Test, Config, Result, Suite, NetworkCall } from "../../types";
import { makeFailure } from "../../helpers/failure";

const tomlSuite: Suite = {
  sep: 1,
  name: "Stellar Info File",
  tests: [],
};

const tomlExists: Test = {
  assertion: "the file exists at ./well-known/stellar.toml",
  successMessage:
    "A TOML-formatted file exists at URL path ./well-known/stellar.toml",
  failureModes: {
    CONNECTION_ERROR: {
      name: "connection error",
      text: (args: any) => {
        return (
          `A connection failure occured when making a request to: ` +
          `\n\n${args.homeDomain}/.well-known/stellar.toml\n\n` +
          `Make sure the file exists at the expected path and that CORS is enabled.`
        );
      },
      markdown: (args: any) => {
        return (
          `A connection failure occured when making a request to: ` +
          `\n\n[${args.homeDomain}/.well-known/stellar.toml]` +
          `(${args.homeDomain}/.well-known/stellar.toml)\n\n` +
          `Make sure the file exists at the expected path and that CORS is enabled.`
        );
      },
    },
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text: (_args: any) => {
        return "A HTTP 200 Success is expected in responses for stellar.toml files.";
      },
      markdown: (_args: any) => {
        return "A HTTP 200 Success is expected in responses for stellar.toml files.";
      },
    },
    BAD_CONTENT_TYPE: {
      name: "bad content type",
      text: (_args: any) => {
        return (
          "HTTP responses containing TOML-formatted files must have a Content-Type " +
          "header of 'application/toml' or 'text/plain'"
        );
      },
      markdown: (_args: any) => {
        return (
          "HTTP responses containing TOML-formatted files must have a Content-Type " +
          "header of 'application/toml' or 'text/plain'"
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
      markdown: (args: any) => {
        return (
          "stellar.toml files must comply with the [TOML format specification]" +
          "(https://toml.io/en/v1.0.0). The parsing library returned:\n\n" +
          `Line: ${args.line}\nColumn: ${args.column}\nError: ${args.message}`
        );
      },
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = {
      test: this,
      suite: tomlSuite,
      networkCalls: [],
    };
    const getTomlCall: NetworkCall = {
      request: new Request(config.homeDomain + "/.well-known/stellar.toml"),
    };
    result.networkCalls.push(getTomlCall);
    let getResponse: Response;
    try {
      getResponse = await fetch(getTomlCall.request.clone());
    } catch (e) {
      result.failure = makeFailure(
        this.failureModes.CONNECTION_ERROR,
        { homeDomain: config.homeDomain },
        config,
      );
      return result;
    }
    getTomlCall.response = getResponse.clone();
    if (getResponse.status !== 200) {
      result.failure = makeFailure(
        this.failureModes.UNEXPECTED_STATUS_CODE,
        {},
        config,
      );
      result.expected = 200;
      result.actual = getResponse.status;
    }
    const contentType = getResponse.headers.get("Content-Type");
    const acceptedContentTypes = ["application/toml", "text/plain"];
    let matched = false;
    for (const acceptedContentType of acceptedContentTypes) {
      if (contentType && contentType.includes(acceptedContentType)) {
        matched = true;
      }
    }
    if (!contentType || !matched) {
      result.failure = makeFailure(
        this.failureModes.BAD_CONTENT_TYPE,
        {},
        config,
      );
      result.expected = "'application/toml' or 'text/plain'";
      if (contentType) {
        result.actual = contentType;
      } else {
        result.actual = "not found";
      }
      return result;
    }
    try {
      toml.parse(await getResponse.text());
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
    return result;
  },
};
tomlSuite.tests.push(tomlExists);

const suites: Suite[] = [tomlSuite];

export { suites };
