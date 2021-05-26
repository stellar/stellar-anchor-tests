"use strict";
exports.__esModule = true;
exports.getCustomerSchema = exports.sep12ConfigSchema = exports.binaryFields = exports.sep9Fields = void 0;
exports.sep9Fields = [
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
    "notary_approval_of_photo_id",
    "ip_address",
    "photo_proof_residence",
    "type",
];
exports.binaryFields = [
    "photo_id_front",
    "photo_id_back",
    "notary_approval_of_photo_id",
    "photo_proof_residence",
];
exports.sep12ConfigSchema = {
    type: "object",
    properties: {
        customers: {
            type: "object",
            patternProperties: {
                ".*": {
                    type: "object",
                    propertyNames: {
                        type: "string",
                        "enum": exports.sep9Fields
                    }
                }
            },
            minProperties: 4
        }
    },
    required: ["customers"]
};
exports.getCustomerSchema = {
    type: "object",
    properties: {
        status: {
            type: "string",
            "enum": ["NEEDS_INFO", "ACCEPTED", "PROCESSING", "REJECTED"]
        },
        id: {
            type: "string"
        },
        fields: {
            type: "object",
            propertyNames: {
                "enum": exports.sep9Fields
            },
            patternProperties: {
                ".*": {
                    type: "object",
                    properties: {
                        type: {
                            type: "string",
                            "enum": ["string", "number", "date", "binary"]
                        },
                        description: {
                            type: "string"
                        },
                        choices: {
                            type: "array"
                        },
                        optional: {
                            type: "boolean"
                        },
                        status: {
                            type: "string",
                            "enum": [
                                "ACCEPTED",
                                "PROCESSING",
                                "NOT_PROVIDED",
                                "REJECTED",
                                "VERIFICATION_REQUIRED",
                            ]
                        },
                        error: {
                            type: "string"
                        }
                    },
                    required: ["type", "description"]
                }
            }
        }
    },
    required: ["status"]
};
