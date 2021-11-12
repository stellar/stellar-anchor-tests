import { Request } from "node-fetch";
import { URLSearchParams } from "url";
import { validate } from "jsonschema";
import { Keypair } from "stellar-sdk";

import { Test, Result, Config, NetworkCall } from "../../types";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { hasQuoteServer } from "./toml";
import { returnsValidJwt } from "../sep10/tests";
import { pricesSchema } from "../../schemas/sep38";

export const requiresJwt: Test = {
  sep: 38,
  assertion: "requires SEP-10 authentication",
  group: "GET /prices",
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
          "/prices?" +
          new URLSearchParams({
            sell_asset: this.context.provides.sep38StellarAsset,
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
export const hasValidSchema: Test = {
  sep: 38,
  assertion: "returns a valid response",
  group: "GET /prices",
  dependencies: [hasQuoteServer, returnsValidJwt],
  context: {
    expects: {
      sep38InfoObj: undefined,
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      token: undefined,
    },
    provides: {
      sep38OffChainAsset: undefined,
      sep38OffChainAssetDecimals: undefined,
      sep38OffChainAssetBuyDeliveryMethod: undefined,
    },
  },
  failureModes: {
    NO_OFFCHAIN_ASSETS: {
      name: "no off-chain assets listed",
      text(args: any): string {
        return `GET /prices didn't return any prices for Stellar asset ${args.asset}`;
      },
      links: {
        "SEP-38 Errors":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#errors",
      },
    },
    INVALID_SCHEMA: {
      name: "invalid GET /prices schema",
      text(args: any): string {
        return (
          "The response body from GET /prices does not match the schema defined by the protocol. " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "GET /prices Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#response-1",
      },
    },
    INVALID_ASSET_VALUE: {
      name: "invalid 'asset' value",
      text(args: any): string {
        return `The 'asset' value ${args.asset} does not comply with SEP-38 Asset Identification Format`;
      },
      links: {
        "Asset Identification Format":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#asset-identification-format",
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/prices?" +
          new URLSearchParams({
            sell_asset: this.context.expects.sep38StellarAsset,
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
    const pricesResponse = await makeRequest(
      networkCall,
      200,
      result,
      "application/json",
    );
    if (!pricesResponse) return result;
    const validationResult = validate(pricesResponse, pricesSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (!pricesResponse.buy_assets) {
      result.failure = makeFailure(this.failureModes.NO_OFFCHAIN_ASSETS, {
        asset: this.context.expects.sep38StellarAsset,
      });
      return result;
    }
    for (const asset of pricesResponse.buy_assets) {
      const parts = asset.asset.split(":");
      if (parts.length !== 2 || parts[0] !== "iso4217") {
        result.failure = makeFailure(this.failureModes.INVALID_ASSET_VALUE, {
          asset: asset.asset,
        });
        return result;
      }
      if (!Number(asset.price)) {
        result.failure = makeFailure(this.failureModes.INVALID_PRICE, {
          price: asset.price,
        });
        return result;
      }
    }
    this.context.provides.sep38OffChainAsset =
      pricesResponse.buy_assets[0].asset;
    this.context.provides.sep38OffChainAssetDecimals =
      pricesResponse.buy_assets[0].decimals;
    this.context.provides.sep38OffChainAssetBuyDeliveryMethod = null;
    for (const assetObj of this.context.expects.sep38InfoObj.assets) {
      if (assetObj.asset == pricesResponse.buy_assets[0].asset) {
        this.context.provides.sep38OffChainAssetBuyDeliveryMethod =
          assetObj.buy_delivery_methods[0].name;
        break;
      }
    }
    return result;
  },
};

/*
 * If the anchor is a SEP-31 receiver, it doesn't facilitate off-chain --> on-chain
 * conversions. So this test will pass if no prices are returned when passing
 * an off-chain asset as a 'sell_asset'.
 */
export const allowsOffChainSellAssets: Test = {
  sep: 38,
  assertion: "allows off-chain assets as 'sell_asset'",
  group: "GET /prices",
  dependencies: [hasValidSchema],
  context: {
    expects: {
      token: undefined,
      sep38OffChainAsset: undefined,
      quoteServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: {
    NO_OFFCHAIN_ASSETS: {
      name: "no off-chain assets listed",
      text(args: any): string {
        return `GET /prices didn't return any prices for off-chain asset ${args.asset}`;
      },
      links: {
        "SEP-38 Errors":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#errors",
      },
    },
    INVALID_SCHEMA: {
      name: "invalid GET /prices schema",
      text(args: any): string {
        return (
          "The response body from GET /prices does not match the schema defined by the protocol. " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "GET /prices Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#response-1",
      },
    },
    INVALID_ASSET_VALUE: {
      name: "invalid 'asset' value",
      text(args: any): string {
        return `The 'asset' value ${args.asset} does not comply with SEP-38 Asset Identification Format`;
      },
      links: {
        "Asset Identification Format":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#asset-identification-format",
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/prices?" +
          new URLSearchParams({
            sell_asset: this.context.expects.sep38OffChainAsset,
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
    const pricesResponse = await makeRequest(
      networkCall,
      200,
      result,
      "application/json",
    );
    if (!pricesResponse) return result;
    const validationResult = validate(pricesResponse, pricesSchema);
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (!pricesResponse.buy_assets) {
      // don't expect the anchor to support off-chain --> on-chain conversions
      return result;
    }
    for (const asset of pricesResponse.buy_assets) {
      const parts = asset.asset.split(":");
      const invalidAssetFailure = makeFailure(
        this.failureModes.INVALID_ASSET_VALUE,
        { asset: asset.asset },
      );
      if (parts.length !== 3 || parts[0] !== "stellar") {
        result.failure = invalidAssetFailure;
        return result;
      }
      try {
        Keypair.fromPublicKey(parts[2]);
      } catch {
        result.failure = invalidAssetFailure;
        return result;
      }
      if (!Number(asset.price)) {
        result.failure = makeFailure(this.failureModes.INVALID_PRICE, {
          price: asset.price,
        });
        return result;
      }
    }
    return result;
  },
};

export const deliveryMethodIsOptional: Test = {
  assertion: "specifying delivery method is optional",
  sep: 38,
  group: "GET /prices",
  dependencies: [hasValidSchema],
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
    };
    const networkCall: NetworkCall = {
      request: new Request(
        this.context.expects.quoteServerUrl +
          "/prices?" +
          new URLSearchParams(requestBody),
        {
          headers: {
            Authorization: `Bearer ${this.context.expects.token}`,
          },
        },
      ),
    };
    result.networkCalls.push(networkCall);
    const pricesResponse = await makeRequest(
      networkCall,
      200,
      result,
      "application/json",
    );
    if (!pricesResponse) return result;
    const validationResult = validate(pricesResponse, pricesSchema);
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
  requiresJwt,
  hasValidSchema,
  allowsOffChainSellAssets,
  deliveryMethodIsOptional,
];
