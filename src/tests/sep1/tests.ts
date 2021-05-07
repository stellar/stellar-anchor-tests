import { URL } from "url";
import { Networks } from "stellar-sdk";
import { validate } from "jsonschema";

import { Test, Config, Result, Suite } from "../../types";
import { currencySchema } from "../../schemas/sep1";
import { makeFailure } from "../../helpers/failure";
import {
  noTomlFailure,
  checkTomlExists,
  getTomlFailureModes,
  checkTomlObj,
} from "../../helpers/sep1";

const sep1TomlSuite: Suite = {
  sep: 1,
  name: "Toml Tests",
  tests: [],
  context: {
    tomlObj: undefined,
    tomlContentBuffer: undefined,
    tomlFetchFailed: undefined,
  },
};

const sep24TomlSuite: Suite = {
  sep: 1,
  name: "SEP-24 Toml Tests",
  tests: [],
  context: {
    tomlObj: undefined,
  },
};

const sep31TomlSuite: Suite = {
  sep: 1,
  name: "SEP-31 Toml Tests",
  tests: [],
  context: {
    tomlObj: undefined,
  },
};

const tomlExists: Test = {
  assertion: "the file exists at ./well-known/stellar.toml",
  successMessage:
    "A TOML-formatted file exists at URL path ./well-known/stellar.toml",
  failureModes: getTomlFailureModes,
  run: checkTomlExists,
};
sep1TomlSuite.tests.push(tomlExists);

const validFileSize: Test = {
  assertion: "the file has a size less than 100KB",
  successMessage: "the file has a size less than 100KB",
  failureModes: {
    NO_TOML: noTomlFailure,
    MAX_SIZE_EXCEEDED: {
      name: "max file sized exceeded",
      text(args: any): string {
        return `The max file size is 100KB, but the file is ${args.kb}`;
      },
    },
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (suite.context.tomlContentBuffer.byteLength > 100000) {
      result.failure = makeFailure(this.failureModes.MAX_SIZE_EXCEEDED, {
        kb: suite.context.tomlContentBuffer.byteLength / 1000,
      });
    }
    return result;
  },
};
sep1TomlSuite.tests.push(validFileSize);

const usesTransferServerSep0024: Test = {
  assertion: "contains a valid TRANSFER_SERVER_SEP0024 URL",
  successMessage: "A valid TRANSFER_SERVER_0024 URL is present.",
  failureModes: {
    NO_TOML: noTomlFailure,
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "TRANSFER_SERVER_SEP0024 is missing from the stellar.toml file.";
      },
    },
    INVALID_URL: {
      name: "invalid URL",
      text(args: any): string {
        return `TRANSFER_SERVER_SEP0024 must be a valid HTTPS URL, got ${args.url}`;
      },
    },
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!suite.context.tomlObj.TRANSFER_SERVER_SEP0024) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND);
      return result;
    }
    try {
      let transferServerURL = new URL(
        suite.context.tomlObj.TRANSFER_SERVER_SEP0024,
      );
      if (transferServerURL.protocol !== "https:") throw "no HTTPS protocol";
    } catch {
      result.failure = makeFailure(this.failureModes.INVALID_URL, {
        url: suite.context.tomlObj.TRANSFER_SERVER_SEP0024,
      });
    }
    return result;
  },
};
sep24TomlSuite.tests.push(usesTransferServerSep0024);

const hasDirectPaymentServer: Test = {
  assertion: "contains a valid DIRECT_PAYMENT_SERVER URL",
  successMessage: "A valid DIRECT_PAYMENT_SERVER URL is present.",
  failureModes: {
    NO_TOML: noTomlFailure,
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "DIRECT_PAYMENT_SERVER is missing from the stellar.toml file.";
      },
    },
    INVALID_URL: {
      name: "invalid URL",
      text(args: any): string {
        return `DIRECT_PAYMENT_SERVER must be a valid HTTPS URL, got ${args.url}`;
      },
    },
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!suite.context.tomlObj.DIRECT_PAYMENT_SERVER) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND);
      return result;
    }
    try {
      let transferServerURL = new URL(
        suite.context.tomlObj.DIRECT_PAYMENT_SERVER,
      );
      if (transferServerURL.protocol !== "https:") throw "no HTTPS protocol";
    } catch {
      result.failure = makeFailure(this.failureModes.INVALID_URL, {
        url: suite.context.tomlObj.DIRECT_PAYMENT_SERVER,
      });
    }
    return result;
  },
};
sep31TomlSuite.tests.push(hasDirectPaymentServer);

const hasNetworkPassphrase: Test = {
  assertion: "has a valid network passphrase",
  successMessage: "the file has a valid network passphrase",
  failureModes: {
    NO_TOML: noTomlFailure,
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "NETWORK_PASSPHRASE is missing from the TOML file";
      },
    },
    INVALID_PASSPHRASE: {
      name: "invalid NETWORK_PASSPHRASE",
      text(_args: any): string {
        return "NETWORK_PASSPHRASE is not one of the accepted values";
      },
    },
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!suite.context.tomlObj) {
      result.failure = makeFailure(this.failureModes.NO_TOML);
    } else if (!suite.context.tomlObj.NETWORK_PASSPHRASE) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND);
    } else if (
      ![Networks.TESTNET, Networks.PUBLIC].includes(
        suite.context.tomlObj.NETWORK_PASSPHRASE,
      )
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_PASSPHRASE);
      result.expected = `$'{Networks.TESTNET}' or '${Networks.PUBLIC}'`;
      result.actual = suite.context.tomlObj.NETWORK_PASSPHRASE;
    }
    return result;
  },
};
sep1TomlSuite.tests.push(hasNetworkPassphrase);

const hasCurrenciesSection: Test = {
  assertion: "has a valid CURRENCIES section",
  successMessage: "the file has a valid CURRENCIES section",
  failureModes: {
    NO_TOML: noTomlFailure,
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "CURRENCIES is missing from the TOML file";
      },
    },
    INVALID_SCHEMA: {
      name: "invalid schema",
      text(args: any): string {
        return (
          `The CURRENCIES entry for ${args.currency} does not comply with the schema defined here:\n\n` +
          "https://github.com/stellar/stellar-anchor-tests/tree/master/src/schemas/sep1.ts#L1\n\n" +
          "The definitions of each attribute can be found on the stellar-protocol repository:\n\n" +
          "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md#currency-documentation\n\n" +
          "The errors returned from the schema validation:\n\n" +
          `${args.errors}`
        );
      },
    },
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!suite.context.tomlObj.CURRENCIES) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND);
      return result;
    }
    for (const currency of suite.context.tomlObj.CURRENCIES) {
      const validatorResult = validate(currency, currencySchema);
      if (validatorResult.errors.length !== 0) {
        result.failure = makeFailure(this.failureModes.INVALID_SCHEMA, {
          currency: currency.code,
          errors: validatorResult.errors.join("\n"),
        });
        break;
      }
    }
    return result;
  },
};
sep1TomlSuite.tests.push(hasCurrenciesSection);

const validURLs: Test = {
  assertion: "all URLs are HTTPS and end without slashes",
  successMessage: "all URLs are HTTPS and end without slashes",
  failureModes: {
    NO_TOML: noTomlFailure,
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "No URLs found. The TOML likely did not parse correctly.";
      },
    },
    NO_HTTPS: {
      name: "HTTPS not used",
      text(_args: any): string {
        return "All URLs must use HTTPS";
      },
    },
    ENDS_WITH_SLASH: {
      name: "URL ends with a slash",
      text(_args: any): string {
        return "All URLs must not end with '/'";
      },
    },
  },
  before: checkTomlObj,
  async run(_config: Config, suite: Suite): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const urlAttributes = [
      "FEDERATION_SERVER",
      "AUTH_SERVER",
      "TRANSFER_SERVER",
      "TRANSFER_SERVER_SEP0024",
      "KYC_SERVER",
      "WEB_AUTH_ENDPOINT",
      "HORIZON_URL",
      "DIRECT_PAYMENT_SERVER",
      "ANCHOR_QUOTE_SERVER",
      "ORG_URL",
      "ORG_LOGO",
      "ORG_PHYSICAL_ADDRESS_ATTESTATION",
      "ORG_PHONE_NUMBER_ATTESTATION",
      "image",
      "attestation_of_reserve",
      "approval_server",
    ];
    const checkUrl = (u?: string) => {
      if (!u) return;
      if (!u.startsWith("https://")) {
        result.failure = makeFailure(this.failureModes.NO_HTTPS);
      } else if (u.slice(-1) === "/") {
        result.failure = makeFailure(this.failureModes.ENDS_WITH_SLASH);
      }
    };
    for (const attr of urlAttributes) {
      if (attr.startsWith("ORG")) {
        if (!suite.context.tomlObj.DOCUMENTATION) {
          continue;
        }
        checkUrl(suite.context.tomlObj.DOCUMENTATION[attr]);
      } else if (
        ["image", "attestation_of_reserve", "approval_server"].includes(attr)
      ) {
        if (!suite.context.tomlObj.CURRENCIES) {
          continue;
        }
        checkUrl(suite.context.tomlObj.CURRENCIES[attr]);
      } else {
        checkUrl(suite.context.tomlObj[attr]);
      }
      if (result.failure) return result;
    }
    return result;
  },
};
sep1TomlSuite.tests.push(validURLs);

export { sep1TomlSuite, sep24TomlSuite, sep31TomlSuite };
