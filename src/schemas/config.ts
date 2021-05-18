import { Networks } from "stellar-sdk";
import { sep9Fields } from "./sep12";

export const sep12ConfigSchema = {
  type: "object",
  properties: {
    customers: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: {
          propertyNames: {
            type: "string",
            enum: sep9Fields,
          },
        },
      },
      minProperties: 1,
    },
  },
  required: ["customers"],
};

export const sep31ConfigSchema = {
  type: "object",
  properties: {
    sendingAnchorClientSecret: {
      type: "string",
    },
    sendingClientName: {
      type: "string",
    },
    receivingClientName: {
      type: "string",
    },
  },
  required: [
    "sendingAnchorClientSecret",
    "sendingClientName",
    "receivingClientName",
  ],
  additionalProperties: false,
};

export const sepConfigSchema = {
  type: "object",
  properties: {
    "12": sep12ConfigSchema,
    "31": sep31ConfigSchema,
  },
  additionalProperties: false,
};

export const configSchema = {
  type: "object",
  properties: {
    homeDomain: {
      type: "string",
      format: "uri",
    },
    seps: {
      type: "array",
      items: {
        enum: [1, 6, 10, 12, 24, 31],
      },
    },
    verbose: {
      type: "boolean",
    },
    assetCode: {
      type: "string",
    },
    searchStrings: {
      type: "array",
      items: {
        type: "string",
      },
    },
    networkPassphrase: {
      type: "string",
      enum: [Networks.PUBLIC, Networks.TESTNET],
    },
    sepConfig: sepConfigSchema,
  },
  additionalProperties: false,
};
