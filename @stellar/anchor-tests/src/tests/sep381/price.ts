import { Request } from "node-fetch";
import { URLSearchParams } from "url";
import { validate } from "jsonschema";

import { Test, Result, Config, NetworkCall } from "../../types";
import { hasQuoteServer } from "./toml";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { priceSchema } from "../../schemas/sep381";
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
const returnsValidResponse: Test = {
  sep: 381,
  assertion: "returns a valid response with",
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
  async run(config: Config): Promise<Result> {
    const runWithContext = async (sep38Context: string): Promise<Result> => {
      const result: Result = { networkCalls: [] };
      const requestBody: any = {
        sell_asset: this.context.expects.sep38StellarAsset,
        buy_asset: this.context.expects.sep38OffChainAsset,
        sell_amount: "100",
        context: sep38Context,
      };
      if (
        this.context.expects.sep38OffChainAssetBuyDeliveryMethod !== undefined
      )
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
    };

    let result: Result = { networkCalls: [] };
    for (const sep38Context of config.sepConfig?.[381]?.contexts ?? []) {
      result = await runWithContext(sep38Context);
      if (!!result.failure) {
        return result;
      }
    }
    return result;
  },
};

export const amountsAreValid: Test = {
  sep: 381,
  assertion: "returned amounts are calculated correctly",
  group: "GET /price",
  dependencies: [returnsValidResponse],
  context: {
    expects: {
      sep38SellAmount: undefined,
      sep38BuyAmount: undefined,
      sep38Price: undefined,
      sep38OffChainAssetDecimals: undefined,
      sep38StellarAsset: undefined, // sell_asset
      sep38OffChainAsset: undefined, // buy_asset
    },
    provides: {},
  },
  failureModes: {
    INVALID_AMOUNTS: {
      name: "amounts and price don't match",
      text(args: any): string {
        return `The amounts returned in the response do not add up. ${args.message}`;
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
    // TODO: line 102 prices.py of polaris always returns decimals for sell asset
    // TODO: so for now hardcode this test to use 2 decimals for fiat
    // const decimals = Number(this.context.expects.sep38OffChainAssetDecimals);
    const decimals = Number(2);
    const roundingMultiplier = Math.pow(10, decimals);

    // validate total_price
    // sell_amount / total_price = buy_amount
    const sellAmount = Number(this.context.expects.sep38SellAmount);
    const buyAmount = Number(this.context.expects.sep38BuyAmount);
    const totalPrice = sellAmount / buyAmount;
    const totalPriceMatchesAmounts =
      Math.round((sellAmount / totalPrice) * roundingMultiplier) /
        roundingMultiplier ===
      Math.round(buyAmount * roundingMultiplier) / roundingMultiplier;
    if (!totalPriceMatchesAmounts) {
      var message = `\nFormula "sell_amount = buy_amount * total_price" is not true for the number of decimals (${decimals}) required:`;
      message += `\n\t${sellAmount} != ${buyAmount} * ${totalPrice}`;
      result.failure = makeFailure(this.failureModes.INVALID_AMOUNTS, {
        message,
      });
      return result;
    }

    // validate price
    const sellAsset = this.context.expects.sep38StellarAsset;
    const buyAsset = this.context.expects.sep38OffChainAsset;
    const feeAsset = this.context.expects.sep38FeeAsset;
    const price = this.context.expects.sep38Price;
    const feeTotal = this.context.expects.sep38FeeTotal;
    if (feeAsset === sellAsset) {
      // sell_amount - fee = price * buy_amount    // when `fee` is in `sell_asset`
      const priceAndFeeMatchAmounts =
        Math.round((sellAmount - feeTotal) * roundingMultiplier) /
          roundingMultiplier ===
        Math.round(price * buyAmount * roundingMultiplier) / roundingMultiplier;
      if (!priceAndFeeMatchAmounts) {
        var message = `\nFormula "sell_amount - fee = price * buy_amount" is not true for the number of decimals (${decimals}) required:`;
        message += `\n\t${sellAmount} - ${feeTotal} != ${price} * ${buyAmount}`;
        result.failure = makeFailure(this.failureModes.INVALID_AMOUNTS, {
          message,
        });
        return result;
      }
    } else if (feeAsset === buyAsset) {
      // sell_amount / price = buy_amount + fee  // when `fee` is in `buy_asset`
      const priceAndFeeMatchAmounts =
        Math.round((sellAmount / price) * roundingMultiplier) /
          roundingMultiplier ===
        Math.round((buyAmount + feeTotal) * roundingMultiplier) /
          roundingMultiplier;
      if (!priceAndFeeMatchAmounts) {
        var message = `\nFormula "sell_amount / price = (buy_amount + fee)" is not true for the number of decimals (${decimals}) required:`;
        message += `\n\t${sellAmount} / ${price} != ${buyAmount} + ${feeTotal}`;
        result.failure = makeFailure(this.failureModes.INVALID_AMOUNTS, {
          message,
        });
        return result;
      }
    }

    return result;
  },
};

const acceptsBuyAmounts: Test = {
  assertion: "accepts the 'buy_amount' parameter with",
  sep: 381,
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
  async run(config: Config): Promise<Result> {
    const runWithContext = async (sep38Context: string): Promise<Result> => {
      const result: Result = { networkCalls: [] };
      const requestBody: any = {
        sell_asset: this.context.expects.sep38StellarAsset,
        buy_asset: this.context.expects.sep38OffChainAsset,
        buy_amount: "100",
        context: sep38Context,
      };
      if (
        this.context.expects.sep38OffChainAssetBuyDeliveryMethod !== undefined
      )
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
    };

    let result: Result = { networkCalls: [] };
    for (const sep38Context of config.sepConfig?.[38]?.contexts ?? []) {
      result = await runWithContext(sep38Context);
      if (!!result.failure) {
        return result;
      }
    }
    return result;
  },
};

export const deliveryMethodIsOptional: Test = {
  assertion: "specifying delivery method is optional with",
  sep: 381,
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
  async run(config: Config): Promise<Result> {
    const runWithContext = async (sep38Context: string): Promise<Result> => {
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
        context: sep38Context,
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
    };

    let result: Result = { networkCalls: [] };
    for (const sep38Context of config.sepConfig?.[38]?.contexts ?? []) {
      result = await runWithContext(sep38Context);
      if (!!result.failure) {
        return result;
      }
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
