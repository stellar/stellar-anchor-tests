"use strict";
exports.__esModule = true;
exports.configSchema = exports.sepConfigSchema = exports.sep6ConfigSchema = exports.sep31ConfigSchema = exports.sep12ConfigSchema = void 0;
var stellar_sdk_1 = require("stellar-sdk");
var sep12_1 = require("./sep12");
exports.sep12ConfigSchema = {
    type: "object",
    properties: {
        customers: {
            type: "object",
            additionalProperties: {
                type: "object",
                additionalProperties: {
                    propertyNames: {
                        type: "string",
                        "enum": sep12_1.sep9Fields
                    }
                }
            },
            minProperties: 4
        }
    },
    required: ["customers"]
};
exports.sep31ConfigSchema = {
    type: "object",
    properties: {
        sendingAnchorClientSecret: {
            type: "string"
        },
        sendingClientName: {
            type: "string"
        },
        receivingClientName: {
            type: "string"
        },
        transactionFields: {
            type: "object"
        }
    },
    required: [
        "sendingAnchorClientSecret",
        "sendingClientName",
        "receivingClientName",
    ],
    additionalProperties: false
};
exports.sep6ConfigSchema = {
    type: "object",
    properties: {
        deposit: {
            type: "object",
            properties: {
                transactionFields: {
                    type: "object"
                }
            },
            required: ["transactionFields"],
            additionalProperties: false
        },
        withdraw: {
            type: "object",
            properties: {
                types: {
                    type: "object",
                    additionalProperties: {
                        type: "object",
                        properties: {
                            transactionFields: {
                                type: "object"
                            }
                        },
                        additionalProperties: false
                    }
                }
            },
            additionalProperties: false
        }
    },
    required: ["deposit", "withdraw"],
    additionalProperties: false
};
exports.sepConfigSchema = {
    type: "object",
    properties: {
        "6": exports.sep6ConfigSchema,
        "12": exports.sep12ConfigSchema,
        "31": exports.sep31ConfigSchema
    },
    additionalProperties: false
};
exports.configSchema = {
    type: "object",
    properties: {
        homeDomain: {
            type: "string",
            format: "uri"
        },
        seps: {
            type: "array",
            items: {
                "enum": [1, 6, 10, 12, 24, 31]
            }
        },
        verbose: {
            type: "boolean"
        },
        assetCode: {
            type: "string"
        },
        searchStrings: {
            type: "array",
            items: {
                type: "string"
            }
        },
        networkPassphrase: {
            type: "string",
            "enum": [stellar_sdk_1.Networks.PUBLIC, stellar_sdk_1.Networks.TESTNET]
        },
        sepConfig: exports.sepConfigSchema
    },
    additionalProperties: false
};
