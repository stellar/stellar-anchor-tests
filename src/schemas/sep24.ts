const depositAndWithdrawSchema = {
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
    deposit: depositAndWithdrawSchema,
    withdraw: depositAndWithdrawSchema,
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
