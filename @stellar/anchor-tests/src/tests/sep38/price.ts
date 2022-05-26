import { Request } from "node-fetch";
import { URLSearchParams } from "url";
import { validate } from "jsonschema";

import { Test, Result, Config, NetworkCall } from "../../types";
import { hasQuoteServer } from "./toml";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { priceSchema } from "../../schemas/sep38";
import { returnsValidJwt } from "../sep10/tests";

/*
 * Its possible that the anchor only supports converting off-chain
 * assets to on-chain assets (deposit-only), in which case this
 * test and its dependents would fail.
 *
 * However, this is less likely than the alternative, in which the
 * anchor only converts on-chain assets to off-chain assets, because
 * this is what SEP-31 receivers do.
 *
 * Therefore, we try using on-chain assets as 'sell_asset'. Ideally,
 * we would try this and on 400 or an empty response, try using an
 * off-chain asset as 'sell_asset' before failing.
 *
 * TODO: handle case where anchor only supports conversion in a
 * single direction. This applies to other tests as well.
 */
export const returnsValidResponse: Test = {
  sep: 38,
  assertion: "returns a valid response",
  group: "GET /price",
  dependencies: [returnsValidJwt, hasQuoteServer],
  context: {
    expects: {
      token: undefined,
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      sep38OffChainAsset: undefined,
      sep38OffChainAssetDecimals: undefined,
      sep38OffChainAssetBuyDeliveryMethod: undefined,
    },
    provides: {
      sep38SellAmount: undefined,
      sep38BuyAmount: undefined,
      sep38Price: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid GET /price schema",
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
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const requestBody: any = {
      sell_asset: this.context.expects.sep38StellarAsset,
      buy_asset: this.context.expects.sep38OffChainAsset,
      sell_amount: "100",
      context: "sep31",
    };
    if (this.context.expects.sep38OffChainAssetBuyDeliveryMethod !== undefined)
      requestBody.buy_delivery_method =
        this.context.expects.sep38OffChainAssetBuyDeliveryMethod;
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/price?" +
          new URLSearchParams(requestBody),
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
    this.context.provides.sep38SellAmount = Number(priceResponse.sell_amount);
    this.context.provides.sep38BuyAmount = Number(priceResponse.buy_amount);
    this.context.provides.sep38Price = Number(priceResponse.price);
    return result;
  },
};

export const amountsAreValid: Test = {
  sep: 38,
  assertion: "returned amounts are calculated correctly",
  group: "GET /price",
  dependencies: [returnsValidResponse],
  context: {
    expects: {
      sep38SellAmount: undefined,
      sep38BuyAmount: undefined,
      sep38Price: undefined,
      sep38OffChainAssetDecimals: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_AMOUNTS: {
      name: "amounts and price don't match",
      text(args: any): string {
        return `The amounts returned in the response do not add up. ${args.buyAmount} * ${args.price} != ${args.sellAmount}`;
      },
      links: {
        "Price formulas":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#price-formulas",
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const roundingMultiplier = Math.pow(
      10,
      Number(this.context.expects.sep38OffChainAssetDecimals),
    );
    if (
      Math.round(
        (Number(this.context.expects.sep38SellAmount) /
          Number(this.context.expects.sep38Price)) *
          roundingMultiplier,
      ) /
        roundingMultiplier !==
      Math.round(
        Number(this.context.expects.sep38BuyAmount) * roundingMultiplier,
      ) /
        roundingMultiplier
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_AMOUNTS, {
        buyAmount: this.context.expects.sep38BuyAmount,
        sellAmount: this.context.expects.sep38SellAmount,
        price: this.context.expects.sep38Price,
      });
      return result;
    }
    return result;
  },
};

export const acceptsBuyAmounts: Test = {
  assertion: "accepts the 'buy_amount' parameter",
  sep: 38,
  group: "GET /price",
  dependencies: [returnsValidResponse],
  context: {
    expects: {
      token: undefined,
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      sep38OffChainAsset: undefined,
      sep38OffChainAssetBuyDeliveryMethod: undefined,
    },
    provides: {},
  },
  failureModes: {
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const requestBody: any = {
      sell_asset: this.context.expects.sep38StellarAsset,
      buy_asset: this.context.expects.sep38OffChainAsset,
      buy_amount: "100",
      context: "sep31",
    };
    if (this.context.expects.sep38OffChainAssetBuyDeliveryMethod !== undefined)
      requestBody.buy_delivery_method =
        this.context.expects.sep38OffChainAssetBuyDeliveryMethod;
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/price?" +
          new URLSearchParams(requestBody),
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
    return result;
  },
};

export const deliveryMethodIsOptional: Test = {
  assertion: "specifying delivery method is optional",
  sep: 38,
  group: "GET /price",
  dependencies: [returnsValidResponse],
  context: {
    expects: {
      token: undefined,
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      sep38OffChainAsset: undefined,
      sep38OffChainAssetBuyDeliveryMethod: undefined,
    },
    provides: {},
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid GET /price schema",
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
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!this.context.expects.sep38OffChainAssetBuyDeliveryMethod) {
      // no buy delivery methods were specified for this off-chain asset
      // so we've already made valid requests without a delivery method
      // parameter value
      return result;
    }
    const requestBody: any = {
      sell_asset: this.context.expects.sep38StellarAsset,
      buy_asset: this.context.expects.sep38OffChainAsset,
      sell_amount: "100",
      context: "sep31",
    };
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/price?" +
          new URLSearchParams(requestBody),
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
    return result;
  },
};

export default [
  returnsValidResponse,
  amountsAreValid,
  acceptsBuyAmounts,
  deliveryMethodIsOptional,
];
