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

export const hasValidSchema: Test = {
  sep: 38,
  assertion: "has a valid response schema",
  group: "GET /prices",
  dependencies: [hasQuoteServer, returnsValidJwt],
  context: {
    expects: {
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      token: undefined,
    },
    provides: {
      sep38OffChainAsset: undefined,
      sep38OffChainAssetDecimals: undefined,
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
    return result;
  },
};

export const requiresSellAsset: Test = {
  sep: 38,
  assertion: "requires 'sell_asset' parameter",
  group: "GET /prices",
  dependencies: [requiresJwt, returnsValidJwt],
  context: {
    expects: {
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      token: undefined,
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
            sell_amount: "100",
          }),
        {
          headers: { Authorization: `Bearer ${this.context.expects.token}` },
        },
      ),
    };
    result.networkCalls.push(networkCall);
    const errorJSON = await makeRequest(
      networkCall,
      400,
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

export const validatesSellAsset: Test = {
  sep: 38,
  assertion: "validates 'sell_asset' parameter",
  group: "GET /prices",
  dependencies: [requiresJwt, returnsValidJwt],
  context: {
    expects: {
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      token: undefined,
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
            sell_asset: "test",
            sell_amount: "100",
          }),
        {
          headers: { Authorization: `Bearer ${this.context.expects.token}` },
        },
      ),
    };
    result.networkCalls.push(networkCall);
    const errorJSON = await makeRequest(
      networkCall,
      400,
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

export const requiresSellAmount: Test = {
  sep: 38,
  assertion: "requires 'sell_amount' parameter",
  group: "GET /prices",
  dependencies: [requiresJwt, returnsValidJwt],
  context: {
    expects: {
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      token: undefined,
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
          }),
        {
          headers: { Authorization: `Bearer ${this.context.expects.token}` },
        },
      ),
    };
    result.networkCalls.push(networkCall);
    const errorJSON = await makeRequest(
      networkCall,
      400,
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

export const validatesSellAmount: Test = {
  sep: 38,
  assertion: "validates 'sell_amount' parameter",
  group: "GET /prices",
  dependencies: [requiresJwt, returnsValidJwt],
  context: {
    expects: {
      quoteServerUrl: undefined,
      sep38StellarAsset: undefined,
      token: undefined,
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
            sell_asset: this.context.expects.sep38StellarAsset,
            sell_amount: "test",
          }),
        {
          headers: { Authorization: `Bearer ${this.context.expects.token}` },
        },
      ),
    };
    result.networkCalls.push(networkCall);
    const errorJSON = await makeRequest(
      networkCall,
      400,
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
      result.failure = makeFailure(this.failureModes.NO_ONCHAIN_ASSETS, {
        asset: this.context.expects.sep38OffChainAsset,
      });
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

export default [
  requiresJwt,
  hasValidSchema,
  requiresSellAsset,
  validatesSellAsset,
  requiresSellAmount,
  validatesSellAmount,
  allowsOffChainSellAssets,
];
