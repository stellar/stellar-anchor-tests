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
  required: ["buy_assets"],
};

export const priceSchema = {
  type: "object",
  properties: {
    price: {
      type: "string",
    },
    sell_amount: {
      type: "string",
    },
    buy_amount: {
      type: "string",
    },
  },
  required: ["price", "sell_amount", "buy_amount"],
};
