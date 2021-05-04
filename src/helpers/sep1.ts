import fetch from "node-fetch";
import { Request, Response } from "node-fetch";
import { parse } from "toml";

import { Result, Failure, NetworkCall } from "../types";
import { makeFailure } from "./failure";

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

export async function getTomlObj(
  homeDomain: string,
  result: Result,
): Promise<any> {
  const getTomlCall: NetworkCall = {
    request: new Request(homeDomain + "/.well-known/stellar.toml"),
  };
  result.networkCalls.push(getTomlCall);
  let getResponse: Response;
  try {
    getResponse = await fetch(getTomlCall.request.clone());
  } catch (e) {
    result.failure = makeFailure(getTomlFailureModes.TOML_CONNECTION_ERROR, {
      url: getTomlCall.request.url,
    });
    return;
  }
  getTomlCall.response = getResponse.clone();
  if (getResponse.status !== 200) {
    result.failure = makeFailure(
      getTomlFailureModes.TOML_UNEXPECTED_STATUS_CODE,
    );
    result.expected = 200;
    result.actual = getResponse.status;
    return;
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
    result.failure = makeFailure(getTomlFailureModes.TOML_BAD_CONTENT_TYPE);
    result.expected = "'application/toml' or 'text/plain'";
    if (contentType) {
      result.actual = contentType;
    } else {
      result.actual = "not found";
    }
    return;
  }
  try {
    return parse(await getResponse.text());
  } catch (e) {
    result.failure = makeFailure(getTomlFailureModes.TOML_PARSE_ERROR, {
      message: e.message,
      line: e.line,
      column: e.column,
    });
    return;
  }
}
