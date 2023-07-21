import { Test, Config, Result } from "../../types";
import { tomlExists } from "../sep1/tests";
import { makeFailure } from "../../helpers/failure";

export const hasKycServerUrl: Test = {
  assertion: "has KYC_SERVER attribute",
  sep: 12,
  group: "TOML Tests",
  dependencies: [tomlExists],
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {
      kycServerUrl: undefined,
    },
  },
  failureModes: {
    NO_KYC_SERVER: {
      name: "no KYC_SERVER attribute in TOML file",
      text(_args: any): string {
        return "A KYC_SERVER attribute is required for SEP-12 implemenations";
      },
      links: {
        "SEP-12 Prerequisites":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#prerequisites",
      },
    },
    NO_HTTPS: {
      name: "no https",
      text(_args: any): string {
        return "The KYC server URL must use HTTPS";
      },
    },
    ENDS_WITH_SLASH: {
      name: "ends with slash",
      text(_args: any): string {
        return "The KYC server URL cannot end with a '/'";
      },
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    this.context.provides.kycServerUrl =
      this.context.expects.tomlObj.KYC_SERVER;
    if (!this.context.provides.kycServerUrl) {
      result.failure = makeFailure(this.failureModes.NO_KYC_SERVER);
      return result;
    }
    if (
      !this.context.provides.kycServerUrl.startsWith("https") &&
      !(
        config.homeDomain.includes("localhost") ||
        config.homeDomain.includes("host.docker.internal")
      )
    ) {
      result.failure = makeFailure(this.failureModes.NO_HTTPS);
      return result;
    }
    if (this.context.provides.kycServerUrl.slice(-1) === "/") {
      result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
    }
    return result;
  },
};

export default [hasKycServerUrl];
