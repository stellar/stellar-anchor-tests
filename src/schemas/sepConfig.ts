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

export const sep31ConfigSchema = {
  type: "object",
  properties: {
    sendingAnchorClientSecret: {
      type: "string",
    },
    sendingClientName: {
      type: "string",
    },
    receivingClientName: {
      type: "string",
    },
  },
  required: [
    "sendingAnchorClientSecret",
    "sendingClientName",
    "receivingClientName",
  ],
  additionalProperties: false,
};

export default {
  type: "object",
  properties: {
    "12": sep12ConfigSchema,
    "31": sep31ConfigSchema,
  },
  additionalProperties: false,
};
