export const infoSchema = {
  type: "object",
  properties: {
    assets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset: {
            type: "string",
          },
          country_codes: {
            type: "array",
            items: {
              type: "string",
            },
          },
          sell_delivery_methods: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
              },
            },
          },
          buy_delivery_methods: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
              },
            },
          },
        },
        required: ["asset"],
      },
    },
  },
};

export const pricesSchema = {
  type: "object",
  properties: {
    buy_assets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          asset: {
            type: "string",
          },
          price: {
            type: "string",
          },
          decimals: {
            type: "integer",
          },
        },
        required: ["asset", "price", "decimals"],
      },
    },
  },
  additionalProperties: false,
  required: ["buy_assets"],
};

const rateFeeSchema = {
  type: "object",
  properties: {
    total: {
      type: "string",
    },
    asset: {
      type: "string",
    },
    details: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          description: {
            type: "string",
          },
          amount: {
            type: "string",
          },
        },
        required: ["name", "amount"],
      },
    },
  },
  required: ["total", "asset"],
};

export const priceSchema = {
  type: "object",
  properties: {
    price: {
      type: "string",
    },
    total_price: {
      type: "string",
    },
    fee: rateFeeSchema,
    sell_amount: {
      type: "string",
    },
    buy_amount: {
      type: "string",
    },
  },
  additionalProperties: false,
  required: ["price", "total_price", "sell_amount", "buy_amount", "fee"],
};

export const quoteSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    expires_at: {
      type: "string",
      format: "date-time",
    },
    price: {
      type: "string",
    },
    total_price: {
      type: "string",
    },
    fee: rateFeeSchema,
    sell_asset: {
      type: "string",
    },
    buy_asset: {
      type: "string",
    },
    sell_amount: {
      type: "string",
    },
    buy_amount: {
      type: "string",
    },
    buy_delivery_method: {
      type: "string",
    },
    sell_delivery_method: {
      type: "string",
    },
  },
  additionalProperties: false,
  required: [
    "id",
    "expires_at",
    "price",
    "total_price",
    "fee",
    "sell_asset",
    "buy_asset",
    "sell_amount",
    "buy_amount",
  ],
};
