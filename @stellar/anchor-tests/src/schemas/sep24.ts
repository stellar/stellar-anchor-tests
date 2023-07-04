// > > > > > > > > > > > > > CONFIG FILE schemas > > > > > > > > > > > > > >
const initialConfigSchema = {
  type: "object",
  properties: {
    accountHolder: {
      type: "object",
      properties: {
        accountAddress: { type: "string" },
        accountSignerSecretKey: { type: "string" },
      },
      required: ["accountAddress", "accountSignerSecretKey"],
    },
  },
  required: ["accountHolder"],
};

const pendingDepositConfigSchema = {
  depositPendingTransaction: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: [
          "pending_anchor",
          "pending_external",
          "pending_stellar",
          "pending_trust",
          "pending_user",
          "pending_user_transfer_start",
          "pending_user_transfer_complete",
        ],
      },
      id: { type: "string" },
    },
    required: ["status", "id"],
  },
};

const completedDepositConfigSchema = {
  depositCompletedTransaction: {
    type: "object",
    properties: {
      status: {
        type: "string",
        pattern: "completed",
      },
      id: { type: "string" },
      stellar_transaction_id: { type: "string" },
    },
    required: ["status", "id", "stellar_transaction_id"],
  },
};

const pendingWithdrawConfigSchema = {
  withdrawPendingUserTransferStartTransaction: {
    type: "object",
    properties: {
      status: {
        type: "string",
        pattern: "pending_user_transfer_start",
      },
      id: { type: "string" },
      amount_in: { type: "string" },
      amount_in_asset: { type: "string" },
      withdraw_anchor_account: { type: "string" },
      withdraw_memo: { type: "string" },
      withdraw_memo_type: { type: "string" },
    },
    required: [
      "status",
      "id",
      "amount_in",
      "amount_in_asset",
      "withdraw_anchor_account",
    ],
  },
};

const completedWithdrawConfigSchema = {
  withdrawCompletedTransaction: {
    type: "object",
    properties: {
      status: {
        type: "string",
        pattern: "completed",
      },
      id: { type: "string" },
      stellar_transaction_id: { type: "string" },
    },
    required: ["status", "id", "stellar_transaction_id"],
  },
};

export function getConfigFileSchema(isDeposit: boolean, isPending: boolean) {
  const schema = JSON.parse(JSON.stringify(initialConfigSchema));

  if (isDeposit) {
    if (isPending) {
      schema.required = schema.required.concat("depositPendingTransaction");
      Object.assign(schema.properties, pendingDepositConfigSchema);
    } else {
      schema.required = schema.required.concat("depositCompletedTransaction");
      Object.assign(schema.properties, completedDepositConfigSchema);
    }
  } else {
    if (isPending) {
      schema.required = schema.required.concat(
        "withdrawPendingUserTransferStartTransaction",
      );
      Object.assign(schema.properties, pendingWithdrawConfigSchema);
    } else {
      schema.required = schema.required.concat("withdrawCompletedTransaction");
      Object.assign(schema.properties, completedWithdrawConfigSchema);
    }
  }

  return schema;
}
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < <

// > > > > > > > > > > > > > TRANSACTION schemas > > > > > > > > > > > > > >
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
          enum: [
            "incomplete",
            "pending_anchor",
            "pending_external",
            "pending_stellar",
            "pending_trust",
            "pending_user",
            "pending_user_transfer_start",
            "pending_user_transfer_complete",
            "completed",
            "refunded",
            "expired",
            "no_market",
            "too_small",
            "too_large",
            "error",
          ],
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
        amount_in_asset: {
          type: ["string", "null"],
        },
        amount_out_asset: {
          type: ["string", "null"],
        },
        amount_fee_asset: {
          type: ["string", "null"],
        },
        started_at: {
          type: "string",
          format: "date-time",
        },
        updated_at: {
          type: ["string", "null"],
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
        "started_at",
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
          getTransactionSchema(true, false, false).properties.transaction,
          getTransactionSchema(false, false, false).properties.transaction,
        ],
      },
    },
  },
  required: ["transactions"],
};

export function getTransactionSchema(
  isDeposit: boolean,
  isPending: boolean,
  isCompleted: boolean,
) {
  transactionSchema.properties.transaction.properties.kind.pattern = isDeposit
    ? "deposit"
    : "withdrawal";

  const schema = JSON.parse(JSON.stringify(transactionSchema));

  const requiredDepositParams = ["to"];

  const requiredWithdrawParams = ["from"];

  const requiredPendingTransactionParams = [
    "amount_in",
    "amount_in_asset",
    "amount_out",
    "amount_out_asset",
  ];

  const requiredPendingWithdrawParams = ["withdraw_anchor_account"];

  const requiredCompleteTransactionParams = [
    "stellar_transaction_id",
    "completed_at",
  ].concat(requiredPendingTransactionParams);

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

  if (isPending) {
    schema.properties.transaction.required =
      schema.properties.transaction.required.concat(
        requiredPendingTransactionParams,
      );

    if (!isDeposit) {
      schema.properties.transaction.required =
        schema.properties.transaction.required.concat(
          requiredPendingWithdrawParams,
        );
    }
  }

  if (isCompleted) {
    schema.properties.transaction.required =
      schema.properties.transaction.required.concat(
        requiredCompleteTransactionParams,
      );
  }

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
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < <
