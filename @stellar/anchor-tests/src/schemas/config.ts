import { Networks } from "stellar-sdk";

export const sep12ConfigSchema = {
  type: "object",
  properties: {
    customers: {
      type: "object",
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
    transactionFields: {
      type: "object",
    },
  },
  required: [
    "sendingAnchorClientSecret",
    "sendingClientName",
    "receivingClientName",
  ],
  additionalProperties: false,
};

export const sep6ConfigSchema = {
  type: "object",
  properties: {
    deposit: {
      type: "object",
      properties: {
        transactionFields: {
          type: "object",
        },
      },
      required: ["transactionFields"],
      additionalProperties: false,
    },
    withdraw: {
      type: "object",
      properties: {
        types: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              transactionFields: {
                type: "object",
              },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
  },
  required: ["deposit", "withdraw"],
  additionalProperties: false,
};

export const sepConfigSchema = {
  type: "object",
  properties: {
    "6": sep6ConfigSchema,
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
