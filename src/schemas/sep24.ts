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
            "completed|pending_external|pending_anchor|pending_stellar|pending_trust|pending_user|pending_user_transfer_start|incomplete|no_market|too_small|too_large|error",
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
        kyc_verified: {
          type: ["boolean", "null"],
        },
      },
      required: [
        "id",
        "kind",
        "status",
        "more_info_url",
        "amount_in",
        "amount_out",
        "amount_fee",
        "started_at",
        "completed_at",
        "stellar_transaction_id",
        "refunded",
      ],
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
  const requiredDepositParams = ["from", "to"];
  const requiredWithdrawParams = [
    "from",
    "to",
    "withdraw_memo",
    "withdraw_memo_type",
    "withdraw_anchor_account",
  ];

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
    schema.properties.transaction.required = schema.properties.transaction.required.concat(
      requiredDepositParams,
    );
    Object.assign(schema.properties.transaction.properties, depositProperties);
  } else {
    schema.properties.transaction.required = schema.properties.transaction.required.concat(
      requiredWithdrawParams,
    );
    Object.assign(schema.properties.transaction.properties, withdrawProperties);
  }

  return schema;
}
