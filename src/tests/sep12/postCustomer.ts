import { Request } from "node-fetch";
//import { validate } from "jsonschema";

import { Test, Config, Result, NetworkCall } from "../../types";
//import { returnsValidJwt } from "../sep10/tests";
import { hasKycServerUrl } from "./toml";
import { makeRequest } from "../../helpers/request";
import { genericFailures } from "../../helpers/failure";

const postCustomerGroup = "POST /customer";
const tests: Test[] = [];

const requiresJwt: Test = {
  assertion: "requires a SEP-10 JWT",
  sep: 12,
  group: postCustomerGroup,
  dependencies: [hasKycServerUrl],
  context: {
    expects: {
      kycServerUrl: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const postCustomerCall: NetworkCall = {
      request: new Request(this.context.expects.kycServerUrl + "/customer", {
        method: "POST",
      }),
    };
    result.networkCalls.push(postCustomerCall);
    await makeRequest(postCustomerCall, 403, result);
    return result;
  },
};
tests.push(requiresJwt);
