import { Networks } from "stellar-sdk";
import { validate } from "jsonschema";
import { parse } from "toml";
import fetch from "node-fetch";
import { Request } from "node-fetch";

import { Test, Config, Result, NetworkCall } from "../../types";
import { currencySchema } from "../../schemas/sep1";
import { makeFailure } from "../../helpers/failure";

const group = "TOML Tests";
const tests: Test[] = [];

export const tomlExists: Test = {
  assertion: "the TOML file exists at ./well-known/stellar.toml",
  sep: 1,
  group: group,
  failureModes: {
    TOML_CONNECTION_ERROR: {
      name: "connection error",
      text: (args: any) => {
        return (
          `A connection failure occured when making a request to: ` +
          `\n\n${args.url}\n\n` +
          `Make sure that CORS is enabled.`
        );
      },
    },
    TOML_UNEXPECTED_STATUS_CODE: {
      name: "unexpected status code",
      text: (_args: any) => {
        return "A HTTP 200 Success is expected for responses.";
      },
    },
    TOML_BAD_CONTENT_TYPE: {
      name: "bad content type",
      text: (_args: any) => {
        return (
          "HTTP responses containing TOML-formatted files must have a Content-Type " +
          "header of 'application/toml' or 'text/plain'"
        );
      },
    },
    TOML_PARSE_ERROR: {
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
  context: {
    expects: {},
    provides: {
      tomlObj: undefined,
      tomlContentBuffer: undefined,
    },
  },
  async run(config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    const getTomlCall: NetworkCall = {
      request: new Request(config.homeDomain + "/.well-known/stellar.toml"),
    };
    result.networkCalls.push(getTomlCall);
    try {
      getTomlCall.response = await fetch(getTomlCall.request.clone());
    } catch (e) {
      result.failure = makeFailure(this.failureModes.TOML_CONNECTION_ERROR, {
        homeDomain: config.homeDomain,
      });
      return result;
    }
    if (getTomlCall.response.status !== 200) {
      result.failure = makeFailure(
        this.failureModes.TOML_UNEXPECTED_STATUS_CODE,
      );
      result.expected = 200;
      result.actual = getTomlCall.response.status;
      return result;
    }
    const contentType = getTomlCall.response.headers.get("Content-Type");
    const acceptedContentTypes = ["application/toml", "text/plain"];
    let matched = false;
    for (const acceptedContentType of acceptedContentTypes) {
      if (contentType && contentType.includes(acceptedContentType)) {
        matched = true;
      }
    }
    if (!contentType || !matched) {
      result.failure = makeFailure(this.failureModes.TOML_BAD_CONTENT_TYPE);
      result.expected = "'application/toml' or 'text/plain'";
      if (contentType) {
        result.actual = contentType;
      } else {
        result.actual = "not found";
      }
      return result;
    }
    try {
      this.context.provides.tomlContentBuffer = await getTomlCall.response
        .clone()
        .arrayBuffer();
      this.context.provides.tomlObj = parse(
        await getTomlCall.response.clone().text(),
      );
    } catch (e) {
      result.failure = makeFailure(this.failureModes.TOML_PARSE_ERROR, {
        message: e.message,
        line: e.line,
        column: e.column,
      });
      return result;
    }
    return result;
  },
};
tests.push(tomlExists);

const validFileSize: Test = {
  assertion: "the file has a size less than 100KB",
  group: group,
  sep: 1,
  dependencies: [tomlExists],
  context: {
    expects: {
      tomlContentBuffer: undefined,
    },
    provides: {},
  },
  failureModes: {
    MAX_SIZE_EXCEEDED: {
      name: "max file sized exceeded",
      text(args: any): string {
        return `The max file size is 100KB, but the file is ${args.kb}`;
      },
    },
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (this.context.expects.tomlContentBuffer.byteLength > 100000) {
      result.failure = makeFailure(this.failureModes.MAX_SIZE_EXCEEDED, {
        kb: this.context.expects.tomlContentBuffer.byteLength / 1000,
      });
    }
    return result;
  },
};
tests.push(validFileSize);

const hasNetworkPassphrase: Test = {
  assertion: "has a valid network passphrase",
  group: group,
  sep: 1,
  dependencies: [tomlExists],
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
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!this.context.expects.tomlObj.NETWORK_PASSPHRASE) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND);
    } else if (
      ![Networks.TESTNET, Networks.PUBLIC].includes(
        this.context.expects.tomlObj.NETWORK_PASSPHRASE,
      )
    ) {
      result.failure = makeFailure(this.failureModes.INVALID_PASSPHRASE);
      result.expected = `$'{Networks.TESTNET}' or '${Networks.PUBLIC}'`;
      result.actual = this.context.expects.tomlObj.NETWORK_PASSPHRASE;
    }
    return result;
  },
};
tests.push(hasNetworkPassphrase);

const hasCurrenciesSection: Test = {
  assertion: "has a valid CURRENCIES section",
  group: group,
  sep: 1,
  dependencies: [tomlExists],
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {},
  },
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
  async run(_config: Config): Promise<Result> {
    const result: Result = { networkCalls: [] };
    if (!this.context.expects.tomlObj.CURRENCIES) {
      result.failure = makeFailure(this.failureModes.NOT_FOUND);
      return result;
    }
    for (const currency of this.context.expects.tomlObj.CURRENCIES) {
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
tests.push(hasCurrenciesSection);

const validUrls: Test = {
  assertion: "all URLs are HTTPS and end without slashes",
  sep: 1,
  group: group,
  dependencies: [tomlExists],
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
  context: {
    expects: {
      tomlObj: undefined,
    },
    provides: {},
  },
  async run(_config: Config): Promise<Result> {
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
        if (!this.context.expects.tomlObj.DOCUMENTATION) {
          continue;
        }
        checkUrl(this.context.expects.tomlObj.DOCUMENTATION[attr]);
      } else if (
        ["image", "attestation_of_reserve", "approval_server"].includes(attr)
      ) {
        if (!this.context.expects.tomlObj.CURRENCIES) {
          continue;
        }
        checkUrl(this.context.expects.tomlObj.CURRENCIES[attr]);
      } else {
        checkUrl(this.context.expects.tomlObj[attr]);
      }
      if (result.failure) return result;
    }
    return result;
  },
};
tests.push(validUrls);

export default tests;
