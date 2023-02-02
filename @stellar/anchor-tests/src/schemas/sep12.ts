export const sep9Fields = [
  "family_name",
  "first_name",
  "last_name",
  "given_name",
  "additional_name",
  "address_country_code",
  "state_or_province",
  "city",
  "postal_code",
  "address",
  "mobile_number",
  "email_address",
  "birth_date",
  "birth_place",
  "birth_country_code",
  "bank_account_number",
  "bank_number",
  "bank_phone_number",
  "bank_branch_number",
  "tax_id",
  "tax_id_name",
  "occupation",
  "employer_name",
  "employer_address",
  "language_code",
  "id_type",
  "id_country_code",
  "id_issue_date",
  "id_expiration_date",
  "id_number",
  "photo_id_front",
  "photo_id_back",
  "photo_selfie",
  "notary_approval_of_photo_id",
  "ip_address",
  "photo_proof_residence",
  "sex",
  "proof_of_income",
  "organization.name",
  "organization.VAT_number",
  "organization.registration_number",
  "organization.registered_address",
  "organization.number_of_shareholders",
  "organization.shareholder_name",
  "organization.photo_incorporation_doc",
  "organization.photo_proof_address",
  "organization.address_country_code",
  "organization.state_or_province",
  "organization.city",
  "organization.postal_code",
  "organization.director_name",
  "organization.website",
  "organization.email",
  "organization.phone",
  "type",
];

export const binaryFields = [
  "photo_id_front",
  "photo_id_back",
  "photo_selfie",
  "notary_approval_of_photo_id",
  "photo_proof_residence",
  "proof_of_income",
];

export const sep12ConfigSchema = {
  type: "object",
  properties: {
    customers: {
      type: "object",
      patternProperties: {
        ".*": {
          type: "object",
          propertyNames: {
            type: "string",
            enum: sep9Fields,
          },
        },
      },
      minProperties: 4,
    },
  },
  required: ["customers"],
};

export const getCustomerSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["NEEDS_INFO", "ACCEPTED", "PROCESSING", "REJECTED"],
    },
    id: {
      type: "string",
    },
    fields: {
      type: "object",
      propertyNames: {
        enum: sep9Fields,
      },
      patternProperties: {
        ".*": {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["string", "number", "date", "binary"],
            },
            description: {
              type: "string",
            },
            choices: {
              type: "array",
            },
            optional: {
              type: "boolean",
            },
          },
          required: ["type", "description"],
        },
      },
    },
    provided_fields: {
      type: "object",
      propertyNames: {
        enum: sep9Fields,
      },
      patternProperties: {
        ".*": {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["string", "number", "date", "binary"],
            },
            description: {
              type: "string",
            },
            choices: {
              type: "array",
            },
            optional: {
              type: "boolean",
            },
            status: {
              type: "string",
              enum: [
                "ACCEPTED",
                "PROCESSING",
                "REJECTED",
                "VERIFICATION_REQUIRED",
              ],
            },
            error: {
              type: "string",
            },
          },
          required: ["type", "description"],
        },
      },
    },
  },
  required: ["status"],
};
