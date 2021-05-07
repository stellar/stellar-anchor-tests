import fetch from "node-fetch";
import { Request } from "node-fetch";
import { parse } from "toml";
import { makeFailure } from "./failure";

import { Config, Suite, Result, Failure, NetworkCall } from "../types";

// failureMode for checkTomlObj
export const noTomlFailure: Failure = {
  name: "no TOML",
  text(_args: any): string {
    return "Retreiving or parsing the stellar.toml file failed.";
  },
};

// resuable before() function
export const checkTomlObj = async (
  config: Config,
  suite: Suite,
): Promise<Result | void> => {
  if (!suite.context) suite.context = {};
  if (suite.context.tomlObj) return;
  const noTomlResult: Result = {
    networkCalls: [],
    failure: makeFailure(noTomlFailure),
  };
  if (suite.context.tomlFetchFailed) {
    return noTomlResult;
  }
  await checkTomlExists(config, suite);
  if (suite.context.tomlFetchFailed) {
    return noTomlResult;
  }
};

// failureMode for checkTomlExists
export const getTomlFailureModes: Record<string, Failure> = {
  TOML_CONNECTION_ERROR: {
    name: "connection error",
    text: (args: any) => {
      return (
        `A connection failure occured when making a request to: ` +
        `\n\n${args.url}\n\n` +
        `Make sure that CORS is enabled.`
      );
    },
  },
  TOML_UNEXPECTED_STATUS_CODE: {
    name: "unexpected status code",
    text: (_args: any) => {
      return "A HTTP 200 Success is expected for responses.";
    },
  },
  TOML_BAD_CONTENT_TYPE: {
    name: "bad content type",
    text: (_args: any) => {
      return (
        "HTTP responses containing TOML-formatted files must have a Content-Type " +
        "header of 'application/toml' or 'text/plain'"
      );
    },
  },
  TOML_PARSE_ERROR: {
    name: "parse error",
    text: (args: any) => {
      return (
        "stellar.toml files must comply with the TOML format specification\n\n" +
        "https://toml.io/en/v1.0.0\n\nThe parsing library returned:\n\n" +
        `Line: ${args.line}\nColumn: ${args.column}\nError: ${args.message}`
      );
    },
  },
};

// a reuseable run() function
export const checkTomlExists = async (
  config: Config,
  suite: Suite,
): Promise<Result> => {
  const result: Result = { networkCalls: [] };
  const getTomlCall: NetworkCall = {
    request: new Request(config.homeDomain + "/.well-known/stellar.toml"),
  };
  result.networkCalls.push(getTomlCall);
  try {
    getTomlCall.response = await fetch(getTomlCall.request.clone());
  } catch (e) {
    suite.context.tomlFetchFailed = true;
    result.failure = makeFailure(getTomlFailureModes.TOML_CONNECTION_ERROR, {
      homeDomain: config.homeDomain,
    });
    return result;
  }
  if (getTomlCall.response.status !== 200) {
    suite.context.tomlFetchFailed = true;
    result.failure = makeFailure(
      getTomlFailureModes.TOML_UNEXPECTED_STATUS_CODE,
    );
    result.expected = 200;
    result.actual = getTomlCall.response.status;
    return result;
  }
  const contentType = getTomlCall.response.headers.get("Content-Type");
  const acceptedContentTypes = ["application/toml", "text/plain"];
  let matched = false;
  for (const acceptedContentType of acceptedContentTypes) {
    if (contentType && contentType.includes(acceptedContentType)) {
      matched = true;
    }
  }
  if (!contentType || !matched) {
    suite.context.tomlFetchFailed = true;
    result.failure = makeFailure(getTomlFailureModes.TOML_BAD_CONTENT_TYPE);
    result.expected = "'application/toml' or 'text/plain'";
    if (contentType) {
      result.actual = contentType;
    } else {
      result.actual = "not found";
    }
    return result;
  }
  // clone the response so we can read the body twice
  try {
    suite.context.tomlContentBuffer = await getTomlCall.response
      .clone()
      .arrayBuffer();
    suite.context.tomlObj = parse(await getTomlCall.response.clone().text());
  } catch (e) {
    suite.context.tomlFetchFailed = true;
    result.failure = makeFailure(getTomlFailureModes.TOML_PARSE_ERROR, {
      message: e.message,
      line: e.line,
      column: e.column,
    });
    return result;
  }
  suite.context.tomlFetchFailed = false;
  return result;
};
