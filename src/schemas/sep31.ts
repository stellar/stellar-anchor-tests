export const postTransactionsSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    stellar_account_id: {
      type: "string",
    },
    stellar_memo_type: {
      type: "string",
      enum: ["hash", "id", "text"],
    },
    stellar_memo: {
      type: "string",
    },
  },
  required: ["id", "stellar_memo", "stellar_memo_type", "stellar_memo"],
  additionalProperties: false,
};

export const getTransactionSchema = {
  type: "object",
  properties: {
    transaction: {
      type: "object",
      properties: {
        id: {
          type: "string",
        },
        status: {
          type: "string",
          enum: [
            "pending_sender",
            "pending_stellar",
            "pending_customer_info_update",
            "pending_transaction_info_update",
            "pending_receiver",
            "pending_external",
            "completed",
            "error",
          ],
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
        stellar_account_id: {
          type: ["string", "null"],
        },
        stellar_memo_type: {
          type: ["string", "null"],
          pattern: "text|id|hash",
        },
        stellar_memo: {
          type: ["string", "null"],
        },
        stellar_transaction_id: {
          type: ["string", "null"],
        },
        external_transaction_id: {
          type: ["string", "null"],
        },
        required_info_message: {
          type: ["string", "null"],
        },
        required_info_updates: {
          type: ["object", "null"],
        },
        refunded: {
          type: "boolean",
        },
      },
      required: [
        "id",
        "status",
        "stellar_account_id",
        "stellar_memo",
        "stellar_memo_type",
      ],
    },
  },
  required: ["transaction"],
  additionalProperties: false,
};

export const infoSchema = {
  type: "object",
  properties: {
    receive: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          enabled: {
            type: "boolean",
          },
          fee_fixed: {
            type: "number",
          },
          fee_percent: {
            type: "number",
          },
          min_amount: {
            type: "number",
          },
          max_amount: {
            type: "number",
          },
          sep12: {
            type: "object",
            properties: {
              sender: {
                type: "object",
                properties: {
                  types: {
                    type: "object",
                    additionalProperties: {
                      type: "object",
                      properties: {
                        description: {
                          type: "string",
                        },
                      },
                      required: ["description"],
                    },
                  },
                },
              },
              receiver: {
                type: "object",
                properties: {
                  types: {
                    type: "object",
                    additionalProperties: {
                      type: "object",
                      properties: {
                        description: {
                          type: "string",
                        },
                      },
                      required: ["description"],
                    },
                  },
                },
              },
            },
            required: ["sender", "receiver"],
            additionalProperties: false,
          },
          fields: {
            type: "object",
            properties: {
              transaction: {
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
                },
              },
            },
            required: ["transaction"],
            additionalProperties: false,
          },
        },
      },
    },
  },
  required: ["receive"],
};
