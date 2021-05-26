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
exports.assetCodeEnabledForWithdraw = exports.assetCodeEnabledForDeposit = exports.isCompliantWithSchema = void 0;
var node_fetch_1 = require("node-fetch");
var jsonschema_1 = require("jsonschema");
var tests_1 = require("../sep1/tests");
var toml_1 = require("./toml");
var failure_1 = require("../../helpers/failure");
var request_1 = require("../../helpers/request");
var sep6_1 = require("../../schemas/sep6");
var infoTestsGroup = "GET /info";
exports.isCompliantWithSchema = {
    assertion: "response is compliant with the schema",
    sep: 6,
    group: infoTestsGroup,
    dependencies: [tests_1.tomlExists, toml_1.hasTransferServerUrl],
    failureModes: __assign({ INVALID_SCHEMA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body returned does not comply with the schema defined for the /info endpoint:\n\n" +
                    "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#info\n\n" +
                    "The errors returned from the schema validation:\n\n" +
                    ("" + args.errors));
            }
        } }, failure_1.genericFailures),
    context: {
        expects: {
            sep6TransferServerUrl: undefined
        },
        provides: {
            sep6InfoObj: undefined
        }
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, infoCall, _a, validationResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        infoCall = {
                            request: new node_fetch_1.Request(this.context.expects.sep6TransferServerUrl + "/info")
                        };
                        result.networkCalls.push(infoCall);
                        _a = this.context.provides;
                        return [4 /*yield*/, request_1.makeRequest(infoCall, 200, result, "application/json")];
                    case 1:
                        _a.sep6InfoObj = _b.sent();
                        if (result.failure) {
                            return [2 /*return*/, result];
                        }
                        validationResult = jsonschema_1.validate(this.context.provides.sep6InfoObj, sep6_1.infoSchema);
                        if (validationResult.errors.length > 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: validationResult.errors.join("\n")
                            });
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
exports.assetCodeEnabledForDeposit = {
    assertion: "configured asset code is enabled for deposit",
    sep: 6,
    group: infoTestsGroup,
    dependencies: [tests_1.tomlExists, exports.isCompliantWithSchema],
    failureModes: __assign({ CONFIGURED_ASSET_CODE_NOT_FOUND: {
            name: "configured asset code not found",
            text: function (args) {
                return args.assetCode + " is not present in the /info response";
            }
        }, CONFIGURED_ASSET_CODE_NOT_ENABLED: {
            name: "configured asset code not enabled",
            text: function (args) {
                return args.assetCode + " is not enabled for SEP-6";
            }
        }, NO_ASSET_CODES: {
            name: "no enabled assets",
            text: function (_args) {
                return "There are no enabled assets in the /info response";
            }
        } }, failure_1.genericFailures),
    context: {
        expects: {
            sep6InfoObj: undefined
        },
        provides: {
            sep6DepositFieldsRequired: undefined
        }
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, depositAssets, assetCode, fieldName;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                depositAssets = this.context.expects.sep6InfoObj.deposit;
                if (!config.assetCode) {
                    for (assetCode in depositAssets) {
                        if (depositAssets[assetCode].enabled) {
                            config.assetCode = assetCode;
                            break;
                        }
                    }
                    if (!config.assetCode) {
                        result.failure = failure_1.makeFailure(this.failureModes.NO_ASSET_CODES);
                        return [2 /*return*/, result];
                    }
                }
                else {
                    if (!depositAssets[config.assetCode]) {
                        result.failure = failure_1.makeFailure(this.failureModes.CONFIGURED_ASSET_CODE_NOT_FOUND, { assetCode: config.assetCode });
                        return [2 /*return*/, result];
                    }
                    else if (!depositAssets[config.assetCode].enabled) {
                        result.failure = failure_1.makeFailure(this.failureModes.CONFIGURED_ASSET_CODE_NOT_ENABLED, { assetCode: config.assetCode });
                        return [2 /*return*/, result];
                    }
                }
                this.context.provides.sep6DepositFieldsRequired = [];
                if (depositAssets[config.assetCode].fields) {
                    for (fieldName in depositAssets[config.assetCode].fields) {
                        if (!depositAssets[config.assetCode].fields[fieldName].optional)
                            this.context.provides.sep6DepositFieldsRequired.push(fieldName);
                    }
                }
                return [2 /*return*/, result];
            });
        });
    }
};
exports.assetCodeEnabledForWithdraw = {
    assertion: "configured asset code is enabled for withdraw",
    sep: 6,
    group: infoTestsGroup,
    dependencies: [tests_1.tomlExists, exports.isCompliantWithSchema],
    failureModes: __assign({ CONFIGURED_ASSET_CODE_NOT_FOUND: {
            name: "configured asset code not found",
            text: function (args) {
                return args.assetCode + " is not present in the /info response";
            }
        }, CONFIGURED_ASSET_CODE_NOT_ENABLED: {
            name: "configured asset code not enabled",
            text: function (args) {
                return args.assetCode + " is not enabled for SEP-6";
            }
        }, NO_ASSET_CODES: {
            name: "no enabled assets",
            text: function (_args) {
                return "There are no enabled assets in the /info response";
            }
        } }, failure_1.genericFailures),
    context: {
        expects: {
            sep6InfoObj: undefined
        },
        provides: {}
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, withdrawAssets, assetCode;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                withdrawAssets = this.context.expects.sep6InfoObj.withdraw;
                if (!config.assetCode) {
                    for (assetCode in withdrawAssets) {
                        if (withdrawAssets[assetCode].enabled) {
                            config.assetCode = assetCode;
                            break;
                        }
                    }
                    if (!config.assetCode) {
                        result.failure = failure_1.makeFailure(this.failureModes.NO_ASSET_CODES);
                        return [2 /*return*/, result];
                    }
                }
                else {
                    if (!withdrawAssets[config.assetCode]) {
                        result.failure = failure_1.makeFailure(this.failureModes.CONFIGURED_ASSET_CODE_NOT_FOUND, { assetCode: config.assetCode });
                        return [2 /*return*/, result];
                    }
                    else if (!withdrawAssets[config.assetCode].enabled) {
                        result.failure = failure_1.makeFailure(this.failureModes.CONFIGURED_ASSET_CODE_NOT_ENABLED, { assetCode: config.assetCode });
                        return [2 /*return*/, result];
                    }
                }
                return [2 /*return*/, result];
            });
        });
    }
};
var requiredDepositFieldsMatchConfiguration = {
    assertion: "SEP-9 fields required for deposit match those provided in configuration",
    sep: 6,
    group: infoTestsGroup,
    dependencies: [exports.assetCodeEnabledForDeposit],
    context: {
        expects: {
            sep6DepositFieldsRequired: undefined
        },
        provides: {}
    },
    failureModes: {
        FIELD_NOT_FOUND: {
            name: "field not found",
            text: function (_args) {
                return ("A field specified in SEP-6's configuration is not specified " +
                    "in the 'non_interactive_customer_info_needed' response body.");
            }
        },
        UNEXPECTED_FIELD: {
            name: "unexpected field",
            text: function (args) {
                return (args.field + " is specified in 'non_interactive_customer_info_needed' " +
                    "response body but is not present in SEP-6's configuration");
            }
        }
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, depositFieldKeys, _i, depositFieldKeys_1, configuredKey, _a, _b, infoNeededField;
            return __generator(this, function (_c) {
                if (!config.sepConfig || !config.sepConfig["6"])
                    throw { message: "improperly configured" };
                result = { networkCalls: [] };
                depositFieldKeys = Object.keys(config.sepConfig["6"].deposit.transactionFields);
                for (_i = 0, depositFieldKeys_1 = depositFieldKeys; _i < depositFieldKeys_1.length; _i++) {
                    configuredKey = depositFieldKeys_1[_i];
                    if (!this.context.expects.sep6DepositFieldsRequired.includes(configuredKey)) {
                        result.failure = failure_1.makeFailure(this.failureModes.FIELD_NOT_FOUND);
                        result.expected = configuredKey;
                        result.actual = this.context.expects.sep6DepositFieldsRequired;
                        return [2 /*return*/, result];
                    }
                }
                for (_a = 0, _b = this.context.expects
                    .sep6DepositFieldsRequired; _a < _b.length; _a++) {
                    infoNeededField = _b[_a];
                    if (!depositFieldKeys.includes(infoNeededField)) {
                        result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_FIELD, {
                            field: infoNeededField
                        });
                        return [2 /*return*/, result];
                    }
                }
                return [2 /*return*/, result];
            });
        });
    }
};
var requiredWithdrawFieldsMatchConfiguration = {
    assertion: "SEP-9 fields required for withdraw match those provided in configuration",
    sep: 6,
    group: infoTestsGroup,
    dependencies: [exports.assetCodeEnabledForWithdraw],
    context: {
        expects: {
            sep6InfoObj: undefined
        },
        provides: {}
    },
    failureModes: {
        TYPE_NOT_FOUND: {
            name: "type not found",
            text: function (_args) {
                return ("A type specified in SEP-6's configuration is not specified " +
                    "in the GET /info response body.");
            }
        },
        UNEXPECTED_TYPE: {
            name: "unexpected type",
            text: function (args) {
                return (args.type + " is specified in GET /info" +
                    "response body but is not present in SEP-6's configuration");
            }
        },
        FIELD_NOT_FOUND: {
            name: "field not found",
            text: function (_args) {
                return ("A field specified in SEP-6's configuration is not specified " +
                    "in the GET /info response body.");
            }
        },
        UNEXPECTED_FIELD: {
            name: "unexpected field",
            text: function (args) {
                return (args.field + " is specified in GET /info" +
                    "response body but is not present in SEP-6's configuration");
            }
        }
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, configuredWithdrawTypes, infoWithdrawTypes, _i, configuredWithdrawTypes_1, configuredKey, configuredTypeFields, infoTypeFields, fieldName, _a, infoWithdrawTypes_1, infoType, configuredTypeFields, infoTypeFields, fieldName;
            return __generator(this, function (_b) {
                if (!config.sepConfig || !config.sepConfig["6"] || !config.assetCode)
                    throw { message: "improperly configured" };
                result = { networkCalls: [] };
                configuredWithdrawTypes = Object.keys(config.sepConfig["6"].withdraw.types || {});
                infoWithdrawTypes = Object.keys(this.context.expects.sep6InfoObj.withdraw[config.assetCode].types || {});
                for (_i = 0, configuredWithdrawTypes_1 = configuredWithdrawTypes; _i < configuredWithdrawTypes_1.length; _i++) {
                    configuredKey = configuredWithdrawTypes_1[_i];
                    if (!infoWithdrawTypes.includes(configuredKey)) {
                        result.failure = failure_1.makeFailure(this.failureModes.TYPE_NOT_FOUND);
                        result.expected = configuredKey;
                        result.actual = infoWithdrawTypes.join(", ");
                        return [2 /*return*/, result];
                    }
                    configuredTypeFields = (config.sepConfig["6"].withdraw.types || {})[configuredKey].transactionFields;
                    infoTypeFields = Object.keys((this.context.expects.sep6InfoObj.withdraw[config.assetCode].types ||
                        {})[configuredKey].fields);
                    for (fieldName in configuredTypeFields) {
                        if (!infoTypeFields.includes(fieldName)) {
                            result.failure = failure_1.makeFailure(this.failureModes.FIELD_NOT_FOUND);
                            result.expected = fieldName;
                            result.actual = infoTypeFields.join(", ");
                            return [2 /*return*/, result];
                        }
                    }
                }
                for (_a = 0, infoWithdrawTypes_1 = infoWithdrawTypes; _a < infoWithdrawTypes_1.length; _a++) {
                    infoType = infoWithdrawTypes_1[_a];
                    if (!configuredWithdrawTypes.includes(infoType)) {
                        result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_TYPE, {
                            type: infoType
                        });
                        return [2 /*return*/, result];
                    }
                    configuredTypeFields = Object.keys((config.sepConfig["6"].withdraw.types || {})[infoType]
                        .transactionFields);
                    infoTypeFields = (this.context.expects.sep6InfoObj.withdraw[config.assetCode].types || {})[infoType].fields;
                    for (fieldName in infoTypeFields) {
                        if (!configuredTypeFields.includes(fieldName)) {
                            result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_FIELD, {
                                field: fieldName
                            });
                            return [2 /*return*/, result];
                        }
                    }
                }
                return [2 /*return*/, result];
            });
        });
    }
};
exports["default"] = [
    exports.isCompliantWithSchema,
    exports.assetCodeEnabledForDeposit,
    exports.assetCodeEnabledForWithdraw,
    requiredDepositFieldsMatchConfiguration,
    requiredWithdrawFieldsMatchConfiguration,
];
