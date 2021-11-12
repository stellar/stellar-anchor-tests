import { Request } from "node-fetch";
import { validate } from "jsonschema";
import { Keypair } from "stellar-sdk";

import { Test, Result, Config, NetworkCall } from "../../types";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { hasQuoteServer } from "./toml";
import { infoSchema } from "../../schemas/sep38";

export const hasValidInfoSchema: Test = {
  assertion: "returns a valid info response",
  sep: 38,
  group: "GET /info",
  dependencies: [hasQuoteServer],
  context: {
    expects: {
      quoteServerUrl: undefined,
    },
    provides: {
      sep38InfoObj: undefined,
      sep38StellarAsset: undefined,
    },
  },
  failureModes: {
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          "The response body from GET /info does not match the schema defined by the protocol. " +
          "Errors:\n\n" +
          `${args.errors}`
        );
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#get-info",
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
    INVALID_STELLAR_ASSET_SCHEMA: {
      name: "invalid schema for Stellar asset",
      text(args: any): string {
        return `The stellar asset ${args.asset} object should only contain the 'asset' key-value pair.`;
      },
      links: {
        "Info Response":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#get-info",
      },
    },
    NO_STELLAR_ASSETS: {
      name: "no Stellar assets",
      text(_args: any): string {
        return "No Stellar assets were found in the 'assets' list";
      },
    },
    NO_OFFCHAIN_ASSETS: {
      name: "no off-chain assets",
      text(_args: any): string {
        return "No off-chain assets were found in the 'assets' list";
      },
    },
    ...genericFailures,
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getInfoCall: NetworkCall = {
      request: new Request(this.context.expects.quoteServerUrl + "/info"),
    };
    result.networkCalls.push(getInfoCall);
    this.context.provides.sep38InfoObj = await makeRequest(
      getInfoCall,
      200,
      result,
      "application/json",
    );
    if (!this.context.provides.sep38InfoObj) return result;
    const validationResult = validate(
      this.context.provides.sep38InfoObj,
      infoSchema,
    );
    if (validationResult.errors.length !== 0) {
      result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
        errors: validationResult.errors.join("\n"),
      });
      return result;
    }
    if (this.context.provides.sep38InfoObj.assets.length === 0) {
      result.failure = makeFailure(this.failureModes.NO_ASSETS);
    }
    let offChainAssetFound = false;
    for (const asset of this.context.provides.sep38InfoObj.assets) {
      if (asset.asset.startsWith("stellar")) {
        const parts = asset.asset.split(":");
        const failure = makeFailure(this.failureModes.INVALID_ASSET_VALUE, {
          asset: asset.asset,
        });
        if (parts.length !== 3) {
          result.failure = failure;
          return result;
        }
        try {
          Keypair.fromPublicKey(parts[2]);
        } catch {
          result.failure = failure;
          return result;
        }
        if (
          asset.country_codes ||
          asset.sell_delivery_methods ||
          asset.buy_delivery_methods
        ) {
          result.failure = makeFailure(
            this.failureModes.INVALID_STELLAR_ASSET_SCHEMA,
            {
              asset: asset.asset,
            },
          );
          return result;
        }
        if (!this.context.provides.sep38StellarAsset)
          this.context.provides.sep38StellarAsset = asset.asset;
      } else if (asset.asset.startsWith("iso4217")) {
        offChainAssetFound = true;
        const parts = asset.asset.split(":");
        if (parts.length !== 2) {
          result.failure = makeFailure(this.failureModes.INVALID_ASSET_VALUE, {
            asset: asset.asset,
          });
          return result;
        }
      } else {
        result.failure = makeFailure(this.failureModes.INVALID_ASSET_VALUE, {
          asset: asset.asset,
        });
        return result;
      }
    }
    if (!this.context.provides.sep38StellarAsset) {
      result.failure = makeFailure(this.failureModes.NO_STELLAR_ASSETS);
      return result;
    }
    if (!offChainAssetFound) {
      result.failure = makeFailure(this.failureModes.NO_OFFCHAIN_ASSETS);
      return result;
    }
    return result;
  },
};

export default [hasValidInfoSchema];
