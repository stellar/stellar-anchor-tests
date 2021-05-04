import { Test, Config, Suite, Result } from "../../types";
import { makeFailure } from "../../helpers/failure";
import { getTomlFailureModes, getTomlObj } from "../../helpers/sep1";

let tomlObj: any;
let webAuthEndpoint: string;

const getAuthSuite: Suite = {
  name: "GET /auth",
  sep: 10,
  tests: [],
};

const hasWebAuthEndpoint: Test = {
  assertion: "has a valid WEB_AUTH_ENDPOINT in the TOML file",
  successMessage: "has a valid WEB_AUTH_ENDPOINT in the TOML file",
  failureModes: {
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "The TOML file does not have a WEB_AUTH_ENDPOINT attribute";
      },
    },
    NO_HTTPS: {
      name: "no https",
      text(_args: any): string {
        return "The WEB_AUTH_ENDPOINT must use HTTPS";
      },
    },
    ENDS_WITH_SLASH: {
      name: "ends with slash",
      text(_args: any): string {
        return "WEB_AUTH_ENDPOINT cannot end with a '/'";
      },
    },
    ...getTomlFailureModes,
  },
  async run(config: Config, suite: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      networkCalls: [],
      suite: suite,
    };
    tomlObj = await getTomlObj(config.homeDomain, result);
    if (!tomlObj) return result;
    if (!tomlObj.WEB_AUTH_ENDPOINT) {
      result.failure = makeFailure(
        this.failureModes.WEB_AUTH_ENDPOINT_NOT_FOUND,
      );
      return result;
    }
    webAuthEndpoint = tomlObj.WEB_AUTH_ENDPOINT;
    if (!webAuthEndpoint.startsWith("https")) {
      result.failure = makeFailure(this.failureModes.NO_HTTPS);
      return result;
    }
    if (webAuthEndpoint.slice(-1) === "/") {
      result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
      return result;
    }
    return result;
  },
};
getAuthSuite.tests.push(hasWebAuthEndpoint);

export default [getAuthSuite];
