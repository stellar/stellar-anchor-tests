export const jwtSchema = {
  iss: { type: "string", format: "uri" },
  sub: { type: "string" },
  iat: { type: "number" },
  exp: { type: "number" },
};
