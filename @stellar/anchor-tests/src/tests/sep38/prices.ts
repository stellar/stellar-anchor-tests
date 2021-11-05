import { Request } from "node-fetch";
import { URLSearchParams } from "url";

import { Test, Result, Config, NetworkCall } from "../../types";
import { genericFailures, makeFailure } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { hasQuoteServer } from "./toml";

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

export default [requiresJwt];
