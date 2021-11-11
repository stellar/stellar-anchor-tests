import { Request } from "node-fetch";
import { validate } from "jsonschema";
import { isDeepStrictEqual } from "util";

import { Test, Result, Config, NetworkCall } from "../../types";
import { hasQuoteServer } from "./toml";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { quoteSchema } from "../../schemas/sep38";
import { returnsValidJwt } from "../sep10/tests";
import { canCreateQuote } from "./postQuote";

export const requiresJwt: Test = {
  sep: 38,
  assertion: "requires SEP-10 authentication",
  group: "GET /quote",
  dependencies: [hasQuoteServer],
  context: {
    expects: {
      quoteServerUrl: undefined,
      sep38QuoteResponseObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_ERROR_SCHEMA: {
      name: "invalid error schema",
      text(_args: any): string {
        return "All error responses should contain a JSON body with an 'error' key-value pair";
      },
      links: {
        "SEP-38 Errors":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#errors",
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/quote/" +
          this.context.expects.sep38QuoteResponseObj.id,
      ),
    };
    result.networkCalls.push(networkCall);
    const quoteResponse = await makeRequest(
      networkCall,
      403,
      result,
      "application/json",
    );
    if (!quoteResponse) return result;
    if (!quoteResponse.error) {
      result.failure = makeFailure(this.failureModes.INVALID_ERROR_SCHEMA);
      return result;
    }
    return result;
  },
};

export const canFetchQuote: Test = {
  sep: 38,
  assertion: "can fetch existing quote",
  group: "GET /quote",
  dependencies: [returnsValidJwt, canCreateQuote],
  context: {
    expects: {
      token: undefined,
      quoteServerUrl: undefined,
      sep38QuoteResponseObj: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid GET /quote schema",
      text(args: any): string {
        return (
          "The response body from GET /quote does not match the schema defined by the protocol. " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "GET /prices Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#response-4",
      },
    },
    QUOTE_BODY_DOESNT_MATCH: {
      name: "quote response bodies don't match",
      text(args: any): string {
        return (
          "The response body returned from POST /quote does not match the response body returned from " +
          `GET /quote:\n\nExpected:\n${JSON.stringify(
            args.expectedBody,
            null,
            2,
          )}\n\nActual:\n` +
          `${JSON.stringify(args.actualBody, null, 2)}`
        );
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/quote/" +
          this.context.expects.sep38QuoteResponseObj.id,
        {
          headers: { Authorization: `Bearer ${this.context.expects.token}` },
        },
      ),
    };
    result.networkCalls.push(networkCall);
    const quoteResponse = await makeRequest(
      networkCall,
      200,
      result,
      "application/json",
    );
    if (!quoteResponse) return result;
    const validationResult = validate(quoteResponse, quoteSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (
      !isDeepStrictEqual(
        this.context.expects.sep38QuoteResponseObj,
        quoteResponse,
      )
    ) {
      result.failure = makeFailure(this.failureModes.QUOTE_BODY_DOESNT_MATCH, {
        expectedBody: this.context.expects.sep38QuoteResponseObj,
        actualBody: quoteResponse,
      });
      return result;
    }
    return result;
  },
};

export const returnsNotFound: Test = {
  sep: 38,
  assertion: "returns 404 for unknown quote ID",
  group: "GET /quote",
  dependencies: [returnsValidJwt, hasQuoteServer],
  context: {
    expects: {
      token: undefined,
      quoteServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_ERROR_SCHEMA: {
      name: "invalid error schema",
      text(_args: any): string {
        return "All error responses should contain a JSON body with an 'error' key-value pair";
      },
      links: {
        "SEP-38 Errors":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#errors",
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl + "/quote/" + "18e413284",
        {
          headers: { Authorization: `Bearer ${this.context.expects.token}` },
        },
      ),
    };
    result.networkCalls.push(networkCall);
    const quoteResponse = await makeRequest(
      networkCall,
      404,
      result,
      "application/json",
    );
    if (!quoteResponse) return result;
    if (!quoteResponse.error) {
      result.failure = makeFailure(this.failureModes.INVALID_ERROR_SCHEMA);
      return result;
    }
    return result;
  },
};

export default [requiresJwt, canFetchQuote, returnsNotFound];
