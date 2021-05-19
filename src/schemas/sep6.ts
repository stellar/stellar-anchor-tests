import { sep9Fields } from "./sep12";

const fieldsSchema = {
  type: "object",
  additionalProperties: {
    type: "object",
    properties: {
      description: {
        type: "string",
      },
      optional: {
        type: "boolean",
      },
      choices: {
        type: "array",
      },
    },
    required: ["description"],
    additionalProperties: false,
  },
};

const depositInfoSchema = {
  type: "object",
  patternProperties: {
    ".*": {
      properties: {
        enabled: { type: "boolean" },
        fee_fixed: { type: "number" },
        fee_minimum: { type: "number" },
        fee_percent: { type: "number", range: [0, 100] },
        min_amount: { type: "number" },
        max_amount: { type: "number" },
        authentication_required: { type: "boolean" },
        fields: fieldsSchema,
      },
      required: ["enabled"],
      additionalProperties: false,
    },
  },
};

const withdrawInfoSchema = {
  type: "object",
  patternProperties: {
    ".*": {
      properties: {
        enabled: { type: "boolean" },
        fee_fixed: { type: "number" },
        fee_minimum: { type: "number" },
        fee_percent: { type: "number", range: [0, 100] },
        min_amount: { type: "number" },
        max_amount: { type: "number" },
        authentication_required: { type: "boolean" },
        types: {
          additionalProperties: {
            type: "object",
            properties: {
              fields: fieldsSchema,
            },
            required: ["fields"],
            additionalProperties: false,
          },
        },
      },
      required: ["enabled"],
      additionalProperties: false,
    },
  },
};

const otherFieldSchema = {
  type: "object",
  properties: {
    enabled: { type: "boolean" },
    authentication_required: { type: "boolean" },
  },
  required: ["enabled"],
};

export const infoSchema = {
  type: "object",
  properties: {
    deposit: depositInfoSchema,
    withdraw: withdrawInfoSchema,
    fee: otherFieldSchema,
    transaction: otherFieldSchema,
    transactions: otherFieldSchema,
  },
  required: ["deposit", "withdraw", "fee", "transaction", "transactions"],
};

export const needsInfoResponseSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["non_interactive_customer_info_needed"],
    },
    fields: {
      type: "array",
      items: {
        type: "string",
        enum: sep9Fields,
      },
    },
  },
};

export const depositSuccessResponseSchema = {
  type: "object",
  properties: {
    how: {
      type: "string",
    },
    id: {
      type: "string",
    },
    eta: {
      type: "number",
    },
    min_amount: {
      type: "number",
    },
    max_amount: {
      type: "number",
    },
    fee_fixed: {
      type: "number",
    },
    fee_percent: {
      type: "number",
      range: [0, 100],
    },
    extra_info: {
      type: "object",
    },
  },
  required: ["how", "id"],
};

export const withdrawSuccessResponseSchema = {
  type: "object",
  properties: {
    account_id: {
      type: "string",
    },
    memo_type: {
      type: "string",
      enum: ["hash", "id", "text"],
    },
    memo: {
      type: "string",
    },
    id: {
      type: "string",
    },
    eta: {
      type: "number",
    },
    min_amount: {
      type: "number",
    },
    max_amount: {
      type: "number",
    },
    fee_fixed: {
      type: "number",
    },
    fee_percent: {
      type: "number",
      range: [0, 100],
    },
    extra_info: {
      type: "object",
    },
  },
  required: ["account_id", "id"],
  additionalProperties: false,
};
