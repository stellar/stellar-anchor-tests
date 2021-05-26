export const jwtSchema = {
  type: "object",
  properties: {
    iss: { type: "string", format: "uri" },
    sub: { type: "string" },
    iat: { type: "number" },
    exp: { type: "number" },
  },
  required: ["iss", "sub", "iat", "exp"],
};
