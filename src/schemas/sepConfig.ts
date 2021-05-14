import { sep9Fields } from "./sep12";

export const sep12ConfigSchema = {
  type: "object",
  properties: {
    customers: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: {
          propertyNames: {
            type: "string",
            enum: sep9Fields,
          },
        },
      },
      minProperties: 1,
    },
  },
  required: ["customers"],
};

export default {
  type: "object",
  properties: {
    "12": sep12ConfigSchema,
  },
  required: ["12"],
  additionalProperties: false,
};
