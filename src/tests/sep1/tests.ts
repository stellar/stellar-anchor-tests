import fetch from "node-fetch";
import { Request, Response } from "node-fetch";
import toml from "toml";
import { URL } from "url";
import { Networks } from "stellar-sdk";
import { validate } from "jsonschema";

import { Test, Config, Result, Suite, NetworkCall } from "../../types";
import { makeFailure } from "../../helpers/failure";
import { currencySchema } from "../../schemas/sep1";

let tomlContentBuffer: ArrayBuffer;
let tomlContentsObj: any;

const sep24TomlSuite: Suite = {
  sep: 1,
  name: "SEP-24 Toml Tests",
  tests: [],
};

const sep31TomlSuite: Suite = {
  sep: 1,
  name: "SEP-31 Toml Tests",
  tests: [],
};

const tomlExists: Test = {
  assertion: "the file exists at ./well-known/stellar.toml",
  successMessage:
    "A TOML-formatted file exists at URL path ./well-known/stellar.toml",
  failureModes: {
    CONNECTION_ERROR: {
      name: "connection error",
      text: (args: any) => {
        return (
          `A connection failure occured when making a request to: ` +
          `\n\n${args.homeDomain}/.well-known/stellar.toml\n\n` +
          `Make sure the file exists at the expected path and that CORS is enabled.`
        );
      },
    },
    UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text: (_args: any) => {
        return "A HTTP 200 Success is expected in responses for stellar.toml files.";
      },
    },
    BAD_CONTENT_TYPE: {
      name: "bad content type",
      text: (_args: any) => {
        return (
          "HTTP responses containing TOML-formatted files must have a Content-Type " +
          "header of 'application/toml' or 'text/plain'"
        );
      },
    },
    PARSE_ERROR: {
      name: "parse error",
      text: (args: any) => {
        return (
          "stellar.toml files must comply with the TOML format specification\n\n" +
          "https://toml.io/en/v1.0.0\n\nThe parsing library returned:\n\n" +
          `Line: ${args.line}\nColumn: ${args.column}\nError: ${args.message}`
        );
      },
    },
  },
  async run(config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      suite: suite,
      networkCalls: [],
    };
    const getTomlCall: NetworkCall = {
      request: new Request(config.homeDomain + "/.well-known/stellar.toml"),
    };
    result.networkCalls.push(getTomlCall);
    let getResponse: Response;
    try {
      getResponse = await fetch(getTomlCall.request.clone());
    } catch (e) {
      result.failure = makeFailure(
        this.failureModes.CONNECTION_ERROR,
        { homeDomain: config.homeDomain },
        config,
      );
      return result;
    }
    getTomlCall.response = getResponse.clone();
    if (getResponse.status !== 200) {
      result.failure = makeFailure(
        this.failureModes.UNEXPECTED_STATUS_CODE,
        {},
        config,
      );
      result.expected = 200;
      result.actual = getResponse.status;
    }
    const contentType = getResponse.headers.get("Content-Type");
    const acceptedContentTypes = ["application/toml", "text/plain"];
    let matched = false;
    for (const acceptedContentType of acceptedContentTypes) {
      if (contentType && contentType.includes(acceptedContentType)) {
        matched = true;
      }
    }
    if (!contentType || !matched) {
      result.failure = makeFailure(
        this.failureModes.BAD_CONTENT_TYPE,
        {},
        config,
      );
      result.expected = "'application/toml' or 'text/plain'";
      if (contentType) {
        result.actual = contentType;
      } else {
        result.actual = "not found";
      }
      return result;
    }
    // clone the response so we can read the body twice
    const getResponseClone = getResponse.clone();
    try {
      tomlContentBuffer = await getResponse.arrayBuffer();
      tomlContentsObj = toml.parse(await getResponseClone.text());
    } catch (e) {
      result.failure = makeFailure(
        this.failureModes.PARSE_ERROR,
        {
          message: e.message,
          line: e.line,
          column: e.column,
        },
        config,
      );
      return result;
    }
    return result;
  },
};
sep24TomlSuite.tests.push(tomlExists);
sep31TomlSuite.tests.push(tomlExists);

const usesTransferServerSep0024: Test = {
  assertion: "contains a valid TRANSFER_SERVER_SEP0024 URL",
  successMessage: "A valid TRANSFER_SERVER_0024 URL is present.",
  failureModes: {
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
  async run(config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      suite: suite,
      networkCalls: [],
    };
    if (!tomlContentsObj.TRANSFER_SERVER_SEP0024) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND, {}, config);
    }
    try {
      let transferServerURL = new URL(tomlContentsObj.TRANSFER_SERVER_SEP0024);
      if (transferServerURL.protocol !== "https:") throw "no HTTPS protocol";
    } catch {
      result.failure = makeFailure(
        this.failureModes.INVALID_URL,
        { url: tomlContentsObj.TRANSFER_SERVER_SEP0024 },
        config,
      );
    }
    return result;
  },
};
sep24TomlSuite.tests.push(usesTransferServerSep0024);

const hasDirectPaymentServer: Test = {
  assertion: "contains a valid DIRECT_PAYMENT_SERVER URL",
  successMessage: "A valid DIRECT_PAYMENT_SERVER URL is present.",
  failureModes: {
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
  async run(config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      suite: suite,
      networkCalls: [],
    };
    if (!tomlContentsObj.DIRECT_PAYMENT_SERVER) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND, {}, config);
    }
    try {
      let transferServerURL = new URL(tomlContentsObj.DIRECT_PAYMENT_SERVER);
      if (transferServerURL.protocol !== "https:") throw "no HTTPS protocol";
    } catch {
      result.failure = makeFailure(
        this.failureModes.INVALID_URL,
        { url: tomlContentsObj.DIRECT_PAYMENT_SERVER },
        config,
      );
    }
    return result;
  },
};
sep31TomlSuite.tests.push(hasDirectPaymentServer);

const validFileSize: Test = {
  assertion: "the file has a size less than 100KB",
  successMessage: "the file has a size less than 100KB",
  failureModes: {
    NOT_FOUND: {
      name: "not found",
      text(_args: any): string {
        return "No file contents were found.";
      },
    },
    MAX_SIZE_EXCEEDED: {
      name: "max file sized exceeded",
      text(args: any): string {
        return `The max file size is 100KB, but the file is ${args.kb}`;
      },
    },
  },
  async run(config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      suite: suite,
      networkCalls: [],
    };
    if (tomlContentBuffer.byteLength === 0) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND, {}, config);
    } else if (tomlContentBuffer.byteLength > 100000) {
      result.failure = makeFailure(
        this.failureModes.MAX_SIZE_EXCEEDED,
        { kb: tomlContentBuffer.byteLength / 1000 },
        config,
      );
    }
    return result;
  },
};
sep24TomlSuite.tests.push(validFileSize);
sep31TomlSuite.tests.push(validFileSize);

const hasNetworkPassphrase: Test = {
  assertion: "has a valid network passphrase",
  successMessage: "the file has a valid network passphrase",
  failureModes: {
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
  async run(config: Config, suite: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      suite: suite,
      networkCalls: [],
    };
    if (!tomlContentsObj || !tomlContentsObj.NETWORK_PASSPHRASE) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND, {}, config);
    } else if (
      ![Networks.TESTNET, Networks.PUBLIC].includes(
        tomlContentsObj.NETWORK_PASSPHRASE,
      )
    ) {
      result.failure = makeFailure(
        this.failureModes.INVALID_PASSPHRASE,
        {},
        config,
      );
      result.expected = `$'{Networks.TESTNET}' or '${Networks.PUBLIC}'`;
      result.actual = tomlContentsObj.NETWORK_PASSPHRASE;
    }
    return result;
  },
};
sep24TomlSuite.tests.push(hasNetworkPassphrase);
sep31TomlSuite.tests.push(hasNetworkPassphrase);

const hasCurrenciesSection: Test = {
  assertion: "has a valid CURRENCIES section",
  successMessage: "the file has a valid CURRENCIES section",
  failureModes: {
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
  async run(config: Config, suite: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      suite: suite,
      networkCalls: [],
    };
    if (!tomlContentsObj || !tomlContentsObj.CURRENCIES) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND, {}, config);
      return result;
    }
    for (const currency of tomlContentsObj.CURRENCIES) {
      const validatorResult = validate(currency, currencySchema);
      if (validatorResult.errors.length !== 0) {
        result.failure = makeFailure(
          this.failureModes.INVALID_SCHEMA,
          {
            currency: currency.code,
            errors: validatorResult.errors,
          },
          config,
        );
        break;
      }
    }
    return result;
  },
};
sep24TomlSuite.tests.push(hasCurrenciesSection);
sep31TomlSuite.tests.push(hasCurrenciesSection);

const validURLs: Test = {
  assertion: "all URLs are HTTPS and end without slashes",
  successMessage: "all URLs are HTTPS and end without slashes",
  failureModes: {
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
  async run(config: Config, suite?: Suite): Promise<Result> {
    const result: Result = {
      test: this,
      suite: suite,
      networkCalls: [],
    };
    if (!tomlContentsObj) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND, {}, config);
      return result;
    }
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
        result.failure = makeFailure(this.failureModes.NO_HTTPS, {}, config);
      } else if (u.slice(-1) === "/") {
        result.failure = makeFailure(
          this.failureModes.ENDS_WITH_SLASH,
          {},
          config,
        );
      }
    };
    for (const attr of urlAttributes) {
      if (attr.startsWith("ORG")) {
        if (!tomlContentsObj.DOCUMENTATION) {
          continue;
        }
        checkUrl(tomlContentsObj.DOCUMENTATION[attr]);
      } else if (
        ["image", "attestation_of_reserve", "approval_server"].includes(attr)
      ) {
        if (!tomlContentsObj.CURRENCIES) {
          continue;
        }
        checkUrl(tomlContentsObj.CURRENCIES[attr]);
      } else {
        checkUrl(tomlContentsObj[attr]);
      }
      if (result.failure) return result;
    }
    return result;
  },
};
sep24TomlSuite.tests.push(validURLs);
sep31TomlSuite.tests.push(validURLs);

export { sep24TomlSuite, sep31TomlSuite };
