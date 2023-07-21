import { Test, Config, Result } from "../../types";
import { makeFailure } from "../../helpers/failure";
import { tomlExists } from "../sep1/tests";

const tomlTestsGroup = "TOML Tests";

export const hasTransferServerUrl: Test = {
  assertion: "has a valid transfer server URL",
  sep: 24,
  group: tomlTestsGroup,
  dependencies: [tomlExists],
  failureModes: {
    TRANSFER_SERVER_NOT_FOUND: {
      name: "TRANSFER_SERVER_SEP0024 not found",
      text(_args: any): string {
        return "The stellar.toml file does not have a valid TRANSFER_SERVER_SEP0024 URL";
      },
      links: {
        "SEP-24 Prerequisites":
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#prerequisites",
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
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {
      transferServerUrl: undefined,
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    this.context.provides.transferServerUrl =
      this.context.expects.tomlObj.TRANSFER_SERVER_SEP0024 ||
      this.context.expects.tomlObj.TRANSFER_SERVER;
    if (!this.context.provides.transferServerUrl) {
      result.failure = makeFailure(this.failureModes.TRANSFER_SERVER_NOT_FOUND);
      return result;
    }
    if (
      !this.context.provides.transferServerUrl.startsWith("https") &&
      !(
        config.homeDomain.includes("localhost") ||
        config.homeDomain.includes("host.docker.internal")
      )
    ) {
      result.failure = makeFailure(this.failureModes.NO_HTTPS);
      return result;
    }
    if (this.context.provides.transferServerUrl.slice(-1) === "/") {
      result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
      return result;
    }
    return result;
  },
};

export default [hasTransferServerUrl];
