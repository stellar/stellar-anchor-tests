import { Test, Result, Config } from "../../types";
import { tomlExists } from "../sep1/tests";
import { makeFailure } from "../../helpers/failure";

export const hasDirectPaymentServer: Test = {
  assertion: "has DIRECT_PAYMENT_SERVER attribute",
  sep: 31,
  group: "TOML Tests",
  dependencies: [tomlExists],
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {
      directPaymentServerUrl: undefined,
    },
  },
  failureModes: {
    DIRECT_PAYMENT_SERVER_NOT_FOUND: {
      name: "DIRECT_PAYMENT_SERVER not found",
      text(_args: any): string {
        return "The stellar.toml file does not have a valid DIRECT_PAYMENT_SERVER URL";
      },
      links: {
        "SEP-31 Prerequisites":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#prerequisites",
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
    this.context.provides.directPaymentServerUrl =
      this.context.expects.tomlObj.DIRECT_PAYMENT_SERVER;
    if (!this.context.provides.directPaymentServerUrl) {
      result.failure = makeFailure(
        this.failureModes.DIRECT_PAYMENT_SERVER_NOT_FOUND,
      );
      return result;
    }
    if (
      !this.context.provides.directPaymentServerUrl.startsWith("https") &&
      !config.homeDomain.includes("localhost")
    ) {
      result.failure = makeFailure(this.failureModes.NO_HTTPS);
      return result;
    }
    if (this.context.provides.directPaymentServerUrl.slice(-1) === "/") {
      result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
      return result;
    }
    return result;
  },
};

export default [hasDirectPaymentServer];
