import { Keypair } from "stellar-sdk";
import { Request } from "node-fetch";

import { Test, Result, Config, NetworkCall } from "../../types";
import { hasKycServerUrl } from "./toml";
import { hasNetworkPassphrase } from "../sep1/tests";
import { returnsValidJwt } from "../sep10/tests";
import { genericFailures } from "../../helpers/failure";
import { canCreateCustomer } from "./putCustomer";
import { canFetchExistingCustomerById } from "./getCustomer";
import { postChallenge } from "../../helpers/sep10";
import { makeRequest } from "../../helpers/request";

const requiresJwtToken: Test = {
  assertion: "requires a SEP-10 JWT",
  sep: 12,
  group: "DELETE /customer",
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
    const deleteCustomerCall: NetworkCall = {
      request: new Request(
        this.context.expects.kycServerUrl +
          `/customer/${Keypair.random().publicKey()}`,
        {
          method: "DELETE",
        },
      ),
    };
    result.networkCalls.push(deleteCustomerCall);
    await makeRequest(deleteCustomerCall, [401, 403], result);
    return result;
  },
};

const canDeleteCustomer: Test = {
  assertion: "can delete a customer",
  sep: 12,
  group: "DELETE /customer",
  dependencies: [
    hasKycServerUrl,
    hasNetworkPassphrase,
    canCreateCustomer,
    canFetchExistingCustomerById,
    returnsValidJwt,
  ],
  context: {
    expects: {
      tomlObj: undefined,
      kycServerUrl: undefined,
      webAuthEndpoint: undefined,
    },
    provides: {},
  },
  failureModes: genericFailures,
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const clientKeypair = Keypair.random();
    const token = await postChallenge(
      clientKeypair,
      this.context.expects.webAuthEndpoint,
      this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      result,
    );
    if (
      !config.sepConfig ||
      !config.sepConfig["12"] ||
      !config.sepConfig["12"].customers ||
      !config.sepConfig["12"].deleteCustomer ||
      !config.sepConfig["12"].customers[config.sepConfig["12"].deleteCustomer]
    ) {
      throw new Error(
        "SEP-12 configuration data missing, expected 'deleteCustomer' in 'customers'",
      );
    }
    const customerToBeDeleted =
      config.sepConfig["12"].customers[config.sepConfig["12"].deleteCustomer];

    // PUT the customer
    const putCustomerCall = {
      request: new Request(this.context.expects.kycServerUrl + "/customer", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: clientKeypair.publicKey(),
          ...customerToBeDeleted,
        }),
      }),
    };
    const putCustomerBody = await makeRequest(
      putCustomerCall,
      202,
      result,
      "application/json",
    );
    result.networkCalls.push(putCustomerCall);
    if (!putCustomerBody) return result;

    // GET the customer
    const typeQueryParam = customerToBeDeleted.type
      ? `&type=${customerToBeDeleted.type}`
      : "";
    const getCustomerCall: NetworkCall = {
      request: new Request(
        this.context.expects.kycServerUrl +
          `/customer?account=${clientKeypair.publicKey()}${typeQueryParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    };
    result.networkCalls.push(getCustomerCall);
    await makeRequest(getCustomerCall, 200, result);
    if (result.failure) return result;

    // DELETE the customer
    const deleteCustomerCall: NetworkCall = {
      request: new Request(
        this.context.expects.kycServerUrl +
          `/customer/${clientKeypair.publicKey()}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ),
    };
    result.networkCalls.push(deleteCustomerCall);
    await makeRequest(deleteCustomerCall, 200, result);
    return result;
  },
};

export default [requiresJwtToken, canDeleteCustomer];
