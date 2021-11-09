import { Request } from "node-fetch";
import { URLSearchParams } from "url";
import { validate } from "jsonschema";

import { Test, Result, Config, NetworkCall } from "../../types";
import { hasQuoteServer } from "./toml";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { priceSchema } from "../../schemas/sep38";
import { returnsValidJwt } from "../sep10/tests";

export const requiresJwt: Test = {
  sep: 38,
  assertion: "requires SEP-10 authentication",
  group: "GET /price",
  dependencies: [hasQuoteServer],
  context: {
    expects: {
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
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
          "/price?" +
          new URLSearchParams({
            sell_asset: this.context.provides.sep38StellarAsset,
            buy_asset: this.context.provides.sep38OffChainAsset,
            sell_amount: "100",
          }),
      ),
    };
    result.networkCalls.push(networkCall);
    const errorJSON = await makeRequest(
      networkCall,
      403,
      result,
      "application/json",
    );
    if (!errorJSON) return result;
    if (!errorJSON.error || typeof errorJSON.error !== "string") {
      result.failure = makeFailure(this.failureModes.INVALID_ERROR_SCHEMA);
      return result;
    }
    return result;
  },
};

export const hasValidSchema: Test = {
  sep: 38,
  assertion: "has a valid response schema",
  group: "GET /price",
  dependencies: [returnsValidJwt, hasQuoteServer],
  context: {
    expects: {
      token: undefined,
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      sep38OffChainAsset: undefined,
      sep38OffChainAssetDecimals: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid GET /prices schema",
      text(args: any): string {
        return (
          "The response body from GET /price does not match the schema defined by the protocol. " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "GET /price Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#response-2",
      },
    },
    INVALID_NUMBER: {
      name: "invalid number",
      text(_args: any): string {
        return "One of the string values returned in the response cannot be parsed as numbers.";
      },
      links: {
        "GET /price Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#response-2",
      },
    },
    INVALID_AMOUNTS: {
      name: "amounts and price don't match",
      text(args: any): string {
        return `The amounts returned in the response do not add up. ${args.buyAmount} * ${args.price} != ${args.sellAmount}`;
      },
      links: {
        "GET /price Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#response-2",
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/price?" +
          new URLSearchParams({
            sell_asset: this.context.expects.sep38StellarAsset,
            buy_asset: this.context.expects.sep38OffChainAsset,
            sell_amount: "100",
          }),
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(networkCall);
    const priceResponse = await makeRequest(
      networkCall,
      200,
      result,
      "application/json",
    );
    if (!priceResponse) return result;
    const validationResult = validate(priceResponse, priceSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (
      !Number(priceResponse.buy_amount) ||
      !Number(priceResponse.sell_amount) ||
      !Number(priceResponse.price)
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_NUMBER);
      return result;
    }
    const roundingMultiplier = Math.pow(
      10,
      this.context.expects.sep38OffChainAssetDecimals,
    );
    if (
      Number(priceResponse.sell_amount) / Number(priceResponse.price) !==
      Math.round(Number(priceResponse.buy_amount) * roundingMultiplier) /
        roundingMultiplier
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_AMOUNTS, {
        buyAmount: priceResponse.buy_amount,
        sellAmount: priceResponse.sell_amount,
        price: priceResponse.price,
      });
      return result;
    }
    return result;
  },
};

export default [requiresJwt, hasValidSchema];
