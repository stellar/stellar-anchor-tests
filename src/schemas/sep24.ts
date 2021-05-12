const depositAndWithdrawInfoSchema = {
  type: "object",
  patternProperties: {
    ".*": {
      properties: {
        enabled: { type: "boolean" },
        fee_fixed: { type: "number" },
        fee_minimum: { type: "number" },
        fee_percent: { type: "number" },
        min_amount: { type: "number" },
        max_amount: { type: "number" },
      },
      required: ["enabled"],
      additionalProperties: false,
    },
  },
};

export const infoSchema = {
  type: "object",
  properties: {
    deposit: depositAndWithdrawInfoSchema,
    withdraw: depositAndWithdrawInfoSchema,
    fee: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        authentication_required: { type: "boolean" },
      },
      required: ["enabled"],
    },
  },
  required: ["deposit", "withdraw", "fee"],
};

export const successResponseSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      pattern: "interactive_customer_info_needed",
    },
    url: {
      type: "string",
      format: "uri",
    },
    id: {
      type: "string",
    },
  },
  required: ["type", "url", "id"],
  additionalProperties: false,
};
