import fetch from "node-fetch";
import { Networks, Keypair } from "stellar-sdk";
import { validate } from "jsonschema";
import { parse } from "toml";
import { existsSync, createReadStream } from "fs";
import { isAbsolute, resolve, basename } from "path";

import { Config } from "../types";
import { configSchema } from "../schemas/config";
import { binaryFields } from "../schemas/sep12";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export async function checkConfig(
  config: Config,
  opts: { checkSepConfig: boolean } = { checkSepConfig: true },
) {
  try {
    validate(config, configSchema, { throwFirst: true });
  } catch (e) {
    throw new ConfigError(e.errors);
  }
  let tomlObj;
  try {
    const tomlResponse = await fetch(
      config.homeDomain + "/.well-known/stellar.toml",
    );
    tomlObj = parse(await tomlResponse.text());
  } catch {}
  if (tomlObj) {
    if (
      ![Networks.PUBLIC, Networks.TESTNET].includes(tomlObj.NETWORK_PASSPHRASE)
    ) {
      throw new ConfigError(
        "NETWORK_PASSPHRASE is not one of the accepted values:\n\n" +
          `'${Networks.TESTNET}'\n'${Networks.PUBLIC}\n'`,
      );
    }
    config.networkPassphrase = tomlObj.NETWORK_PASSPHRASE;
  }
  if (opts.checkSepConfig) checkSepConfigObj(config);
}

function checkSepConfigObj(config: Config) {
  if (config.seps.includes(31)) {
    if (
      !config.sepConfig ||
      !config.sepConfig["31"] ||
      !config.sepConfig["12"]
    ) {
      throw new ConfigError(
        "configuration for SEP-12 and SEP-31 is required to run SEP-31 tests.",
      );
    }
    try {
      Keypair.fromSecret(config.sepConfig["31"].sendingAnchorClientSecret);
    } catch {
      throw new ConfigError("invalid 'sendingAnchorClientSecret'");
    }
    if (
      !config.sepConfig["12"].customers[
        config.sepConfig["31"].sendingClientName
      ] ||
      !config.sepConfig["12"].customers[
        config.sepConfig["31"].receivingClientName
      ]
    ) {
      throw new ConfigError(
        `${config.sepConfig["31"].sendingClientName} and ` +
          `${config.sepConfig["31"].receivingClientName} keys are required in ` +
          "SEP-12's customer data",
      );
    }
    if (
      config.sepConfig["31"].sendingClientName ===
      config.sepConfig["31"].receivingClientName
    ) {
      throw new ConfigError(
        `SEP-31's 'sendingClientName' and 'receivingClientName' cannot match`,
      );
    }
  }
  if (config.seps.includes(12)) {
    if (!config.sepConfig || !config.sepConfig["12"]) {
      throw new ConfigError(
        "SEP 12 configuration is required to run SEP 6, 12, or 31 tests.",
      );
    }
    if (
      !config.sepConfig["31"] &&
      !config.sepConfig["12"].sameAccountDifferentMemos
    ) {
      throw new ConfigError(
        "SEP-12's 'sameAccountDifferentMemos' configuration must be present without SEP-31's " +
          "'sendingClientName' and 'receivingClientName'",
      );
    }
    for (const customerName in config.sepConfig["12"].customers) {
      const customerData = config.sepConfig["12"].customers[customerName];
      for (const binaryField of binaryFields) {
        if (!customerData[binaryField]) continue;
        if (!["string", "object"].includes(typeof customerData[binaryField])) {
          throw new ConfigError(
            "unrecognized type for binary customer field, " +
              "expected file path string or an object",
          );
        }
        const extToContentType: Record<string, string> = {
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          pdf: "application/pdf",
        };
        if (typeof customerData[binaryField] === "string") {
          if (!isAbsolute(customerData[binaryField])) {
            customerData[binaryField] = resolve(customerData[binaryField]);
          }
          if (!existsSync(customerData[binaryField])) {
            throw new ConfigError(
              `'${binaryField}' file for '${customerName}' was not found at ` +
                `${customerData[binaryField]}`,
            );
          }
          const filePathParts = customerData[binaryField].split(".");
          customerData[binaryField] = {
            data: createReadStream(customerData[binaryField]),
            contentType:
              extToContentType[filePathParts[filePathParts.length - 1]],
            fileName: basename(customerData[binaryField]),
          };
        } else {
          if (
            !customerData[binaryField].data ||
            !(customerData[binaryField].data instanceof Buffer)
          ) {
            throw new ConfigError(
              `${binaryField} data must be a buffer, ` +
                `got ${typeof customerData[binaryField]}`,
            );
          } else if (
            !customerData[binaryField].contentType ||
            Object.keys(extToContentType).includes(
              customerData[binaryField].contentType,
            )
          ) {
            throw new ConfigError(
              `${binaryField} content type is not one of the accepted values:` +
                `${Object.keys(extToContentType)}`,
            );
          }
        }
      }
    }
  }
  if (config.seps.includes(6)) {
    if (!config.sepConfig || !config.sepConfig["6"]) {
      throw new ConfigError(
        "SEP 6 configuration is required to run SEP-6 tests.",
      );
    }
  }
  if (config.seps.includes(24)) {
    if (!config.sepConfig || !config.sepConfig["24"]) {
      throw new ConfigError(
        "SEP 24 configuration is required to run SEP-24 tests.",
      );
    }
  }
  if (config.seps.includes(38)) {
    if (!config.sepConfig || !config.sepConfig["38"]) {
      throw new ConfigError(
        "SEP-38 configuration is required to run SEP-38 tests.",
      );
    }

    if (config.sepConfig["38"].contexts.length === 0) {
      throw new ConfigError(
        "SEP-38's 'contexts' must contain at least one context from the list of accepted values: ['sep6', 'sep31']",
      );
    }
  }
}
