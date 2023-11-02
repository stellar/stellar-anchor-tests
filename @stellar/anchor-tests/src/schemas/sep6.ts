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

export const customerInfoStatusSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      pattern: "customer_info_status",
    },
    status: {
      type: "string",
      enum: ["pending", "denied"],
    },
    more_info_url: {
      type: "string",
      format: "uri",
    },
    eta: {
      type: "number",
    },
  },
  required: ["type", "status"],
  additionalProperties: false,
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
  required: ["id"],
  additionalProperties: false,
};

export const transactionSchema = {
  type: "object",
  properties: {
    transaction: {
      type: "object",
      properties: {
        id: { type: "string" },
        kind: { type: "string", pattern: "deposit|withdrawal" },
        status: {
          type: "string",
          pattern:
            "completed|pending_external|pending_anchor|pending_stellar|pending_trust|pending_user|pending_customer_info_update|pending_user_transfer_start|incomplete|no_market|too_small|too_large|error",
        },
        more_info_url: {
          type: "string",
          format: "uri",
        },
        status_eta: {
          type: ["number", "null"],
        },
        amount_in: {
          type: ["string", "null"],
        },
        amount_out: {
          type: ["string", "null"],
        },
        amount_fee: {
          type: ["string", "null"],
        },
        started_at: {
          type: "string",
          format: "date-time",
        },
        completed_at: {
          type: ["string", "null"],
          format: "date-time",
        },
        stellar_transaction_id: {
          type: ["string", "null"],
        },
        external_transaction_id: {
          type: ["string", "null"],
        },
        message: {
          type: ["string", "null"],
        },
        refunded: {
          type: "boolean",
        },
        claimable_balance_id: {
          type: ["string", "null"],
        },
      },
      required: ["id", "kind", "status", "started_at"],
    },
  },
  required: ["transaction"],
};

export const transactionsSchema = {
  type: "object",
  properties: {
    transactions: {
      type: "array",
      items: {
        anyOf: [
          getTransactionSchema(true).properties.transaction,
          getTransactionSchema(false).properties.transaction,
        ],
      },
    },
  },
  required: ["transactions"],
};

export function getTransactionSchema(isDeposit: boolean) {
  const schema = JSON.parse(JSON.stringify(transactionSchema));
  const requiredDepositParams = ["to"];
  const requiredWithdrawParams = ["from"];

  const depositProperties = {
    deposit_memo: {
      type: ["string", "null"],
    },
    deposit_memo_type: {
      type: ["string", "null"],
    },
    from: {
      type: ["string", "null"],
    },
    to: {
      type: ["string", "null"],
    },
  };

  const withdrawProperties = {
    withdraw_anchor_account: {
      type: ["string", "null"],
    },
    withdraw_memo: {
      type: ["string", "null"],
    },
    withdraw_memo_type: {
      type: ["string", "null"],
    },
    from: {
      type: ["string", "null"],
    },
    to: {
      type: ["string", "null"],
    },
  };

  if (isDeposit) {
    schema.properties.transaction.required =
      schema.properties.transaction.required.concat(requiredDepositParams);
    Object.assign(schema.properties.transaction.properties, depositProperties);
  } else {
    schema.properties.transaction.required =
      schema.properties.transaction.required.concat(requiredWithdrawParams);
    Object.assign(schema.properties.transaction.properties, withdrawProperties);
  }

  return schema;
}
