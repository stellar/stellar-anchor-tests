import { Request } from "node-fetch";

import { Test, Config, Result, NetworkCall } from "../../types";
import { genericFailures } from "../../helpers/failure";
import { makeRequest } from "../../helpers/request";
import { hasTransferServerUrl } from "./toml";
import { assetCodeEnabledForDeposit } from "./info";
import { returnsProperSchemaForKnownAccounts } from "./deposit";

const transactionEndpoint = "/transaction";
const transactionTestGroup = "GET /transaction";
const tests: Test[] = [];

const requiresJwt: Test = {
  assertion: "requires a JWT",
  sep: 6,
  group: transactionTestGroup,
  dependencies: [
    hasTransferServerUrl,
    assetCodeEnabledForDeposit,
    returnsProperSchemaForKnownAccounts,
  ],
  context: {
    expects: {
      sep6TransferServerUrl: undefined,
      sep6InfoObj: undefined,
      sep6TransactionId: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (
      this.context.expects.sep6TransactionId === null ||
      !this.context.expects.sep6InfoObj.transaction.authentication_required
    ) {
      result.skipped = true;
      return result;
    }
    const getTransactionCall: NetworkCall = {
      request: new Request(
        this.context.expects.sep6TransferServerUrl +
          transactionEndpoint +
          `?id=${this.context.expects.sep6TransactionId}`,
      ),
    };
    await makeRequest(getTransactionCall, 403, result);
    return result;
  },
};
tests.push(requiresJwt);

export default tests;
