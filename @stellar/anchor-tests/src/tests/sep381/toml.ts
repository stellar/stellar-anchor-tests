import { Test, Result, Config } from "../../types";
import { tomlExists } from "../sep1/tests";
import { makeFailure } from "../../helpers/failure";

export const hasQuoteServer: Test = {
  assertion: "has an ANCHOR_QUOTE_SERVER attribute",
  sep: 38,
  group: "TOML Tests",
  dependencies: [tomlExists],
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {
      quoteServerUrl: undefined,
    },
  },
  failureModes: {
    ANCHOR_QUOTE_SERVER_NOT_FOUND: {
      name: "ANCHOR_QUOTE_SERVER not found",
      text(_args: any): string {
        return "The stellar.toml file does not have a valid ANCHOR_QUOTE_SERVER URL";
      },
      links: {
        "SEP-38 Specification":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md#specification",
      },
    },
    NO_HTTPS: {
      name: "no https",
      text(_args: any): string {
        return "The transfer server URL must use HTTPS";
      },
    },
    ENDS_WITH_SLASH: {
      name: "ends with slash",
      text(_args: any): string {
        return "The transfer server URL cannot end with a '/'";
      },
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    this.context.provides.quoteServerUrl =
      this.context.expects.tomlObj.ANCHOR_QUOTE_SERVER;
    if (!this.context.provides.quoteServerUrl) {
      result.failure = makeFailure(
        this.failureModes.ANCHOR_QUOTE_SERVER_NOT_FOUND,
      );
      return result;
    }
    if (
      !this.context.provides.quoteServerUrl.startsWith("https") &&
      !config.homeDomain.includes("localhost")
    ) {
      result.failure = makeFailure(this.failureModes.NO_HTTPS);
      return result;
    }
    if (this.context.provides.quoteServerUrl.slice(-1) === "/") {
      result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
      return result;
    }
    return result;
  },
};

export default [hasQuoteServer];
