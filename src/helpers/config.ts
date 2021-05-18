import fetch from "node-fetch";
import { Networks, Keypair } from "stellar-sdk";
import { validate } from "jsonschema";
import { parse } from "toml";
import { existsSync, createReadStream } from "fs";
import { isAbsolute, resolve } from "path";

import { Config } from "../types";
import { configSchema } from "../schemas/config";
import { binaryFields } from "../schemas/sep12";

class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export async function checkConfig(config: Config) {
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
  if (!config.sepConfig) {
    return;
  }
  if (config.seps.includes(31)) {
    if (!config.sepConfig["31"] || !config.sepConfig["12"]) {
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
  }
  if (config.seps.includes(12)) {
    if (!config.sepConfig["12"]) {
      throw new ConfigError(
        "SEP-12 configuration is required to run SEP-12 tests.",
      );
    }
    for (const customerName in config.sepConfig["12"].customers) {
      const customerData = config.sepConfig["12"].customers[customerName];
      for (const binaryField of binaryFields) {
        if (!customerData[binaryField]) continue;
        if (typeof customerData[binaryField] !== "string") {
          throw new ConfigError(
            "unrecognized type for binary customer field: " +
              `${typeof customerData[binaryField]}, expected file path.`,
          );
        }
        if (!isAbsolute(customerData[binaryField])) {
          customerData[binaryField] = resolve(customerData[binaryField]);
        }
        if (!existsSync(customerData[binaryField])) {
          throw new ConfigError(
            `'${binaryField}' file for '${customerName}' was not found at ` +
              `${customerData[binaryField]}`,
          );
        }
        customerData[binaryField] = createReadStream(customerData[binaryField]);
      }
    }
  }
}
