"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.hasExpectedAssetEnabled = void 0;
var node_fetch_1 = require("node-fetch");
var jsonschema_1 = require("jsonschema");
var toml_1 = require("./toml");
var failure_1 = require("../../helpers/failure");
var request_1 = require("../../helpers/request");
var sep31_1 = require("../../schemas/sep31");
var hasValidInfoSchema = {
    assertion: "matches the expected schema",
    sep: 31,
    group: "GET /info",
    dependencies: [toml_1.hasDirectPaymentServer],
    context: {
        expects: {
            directPaymentServerUrl: undefined
        },
        provides: {
            sep31InfoObj: undefined
        }
    },
    failureModes: __assign({ INVALID_SCHEMA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body from GET /info does not match " +
                    "the schema defined by the protocol:\n\n" +
                    "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#get-info\n\n" +
                    "Errors:\n\n" +
                    ("" + args.errors));
            }
        } }, failure_1.genericFailures),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getInfoCall, _a, validationResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getInfoCall = {
                            request: new node_fetch_1.Request(this.context.expects.directPaymentServerUrl + "/info")
                        };
                        result.networkCalls.push(getInfoCall);
                        _a = this.context.provides;
                        return [4 /*yield*/, request_1.makeRequest(getInfoCall, 200, result, "application/json")];
                    case 1:
                        _a.sep31InfoObj = _b.sent();
                        if (!this.context.provides.infoObj)
                            return [2 /*return*/, result];
                        validationResult = jsonschema_1.validate(this.context.provides.infoObj, sep31_1.infoSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: validationResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
exports.hasExpectedAssetEnabled = {
    assertion: "has expected asset enabled",
    sep: 31,
    group: "GET /info",
    dependencies: [hasValidInfoSchema],
    context: {
        expects: {
            sep31InfoObj: undefined
        },
        provides: {}
    },
    failureModes: {
        ASSET_NOT_FOUND: {
            name: "expected asset not found",
            text: function (args) {
                return "The /info response body does not contain information for " + args.assetCode;
            }
        },
        NO_ASSET_CODES: {
            name: "no enabled assets",
            text: function (_args) {
                return "There are no enabled assets in the /info response";
            }
        },
        ASSET_CODE_NOT_ENABLED: {
            name: "configured asset code not enabled",
            text: function (args) {
                return args.assetCode + " is not enabled for SEP-31";
            }
        }
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, assetCode;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                if (!config.assetCode) {
                    for (assetCode in this.context.expects.sep31InfoObj.receive) {
                        if (this.context.expects.sep31InfoObj.receive[assetCode].enabled) {
                            config.assetCode = assetCode;
                            break;
                        }
                    }
                    if (!config.assetCode) {
                        result.failure = failure_1.makeFailure(this.failureModes.NO_ASSET_CODES);
                        return [2 /*return*/, result];
                    }
                }
                if (!Object.keys(this.context.expects.sep31InfoObj.receive).includes(config.assetCode)) {
                    result.failure = failure_1.makeFailure(this.failureModes.ASSET_NOT_FOUND, {
                        assetCode: config.assetCode
                    });
                    return [2 /*return*/, result];
                }
                else if (!this.context.expects.sep31InfoObj.receive[config.assetCode].enabled) {
                    result.failure = failure_1.makeFailure(this.failureModes.ASSET_CODE_NOT_ENABLED, {
                        assetCode: config.assetCode
                    });
                    return [2 /*return*/, result];
                }
                return [2 /*return*/, result];
            });
        });
    }
};
var hasExpectedTransactionFields = {
    assertion: "has configured transaction 'fields'",
    sep: 31,
    group: "GET /info",
    dependencies: [hasValidInfoSchema],
    context: {
        expects: {
            sep31InfoObj: undefined
        },
        provides: {}
    },
    failureModes: {
        FIELD_NOT_FOUND: {
            name: "field not found",
            text: function (_args) {
                return ("A field specified in SEP-31's configuration is not specified " +
                    "in the /info response body.");
            }
        },
        UNEXPECTED_FIELD: {
            name: "unexpected field",
            text: function (args) {
                return (args.field + " is specified as required in the /info response " +
                    "body but is not present in SEP-31's configuration");
            }
        }
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, responseTransactionFields, responseTransactionFieldNames, configuredTransactionFieldNames, _i, responseTransactionFieldNames_1, fieldName, _a, configuredTransactionFieldNames_1, fieldName;
            return __generator(this, function (_b) {
                if (!config.assetCode || !config.sepConfig || !config.sepConfig["31"])
                    // this is checked before tests are run
                    throw new Error("improperly configured");
                result = { networkCalls: [] };
                responseTransactionFields = this.context.expects.sep31InfoObj.receive[config.assetCode].fields.transaction;
                responseTransactionFieldNames = Object.keys(responseTransactionFields);
                configuredTransactionFieldNames = Object.keys(config.sepConfig["31"].transactionFields);
                for (_i = 0, responseTransactionFieldNames_1 = responseTransactionFieldNames; _i < responseTransactionFieldNames_1.length; _i++) {
                    fieldName = responseTransactionFieldNames_1[_i];
                    if (!responseTransactionFields[fieldName].optional &&
                        !configuredTransactionFieldNames.includes(fieldName)) {
                        result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_FIELD, {
                            field: fieldName
                        });
                        return [2 /*return*/, result];
                    }
                }
                for (_a = 0, configuredTransactionFieldNames_1 = configuredTransactionFieldNames; _a < configuredTransactionFieldNames_1.length; _a++) {
                    fieldName = configuredTransactionFieldNames_1[_a];
                    if (!responseTransactionFieldNames.includes(fieldName)) {
                        result.failure = failure_1.makeFailure(this.failureModes.FIELD_NOT_FOUND);
                        result.expected = fieldName;
                        return [2 /*return*/, result];
                    }
                }
                return [2 /*return*/, result];
            });
        });
    }
};
exports["default"] = [
    hasValidInfoSchema,
    exports.hasExpectedAssetEnabled,
    hasExpectedTransactionFields,
];
