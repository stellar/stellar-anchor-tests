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
