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
exports.returnsProperSchemaForKnownAccounts = exports.returnsProperSchemaForUnknownAccounts = void 0;
var stellar_sdk_1 = require("stellar-sdk");
var node_fetch_1 = require("node-fetch");
var url_1 = require("url");
var jsonschema_1 = require("jsonschema");
var request_1 = require("../../helpers/request");
var sep10_1 = require("../../helpers/sep10");
var failure_1 = require("../../helpers/failure");
var tests_1 = require("../sep10/tests");
var putCustomer_1 = require("../sep12/putCustomer");
var toml_1 = require("./toml");
var info_1 = require("./info");
var sep6_1 = require("../../schemas/sep6");
var tests = [];
var withdrawTestsGroup = "GET /withdraw";
var withdrawEndpoint = "/withdraw";
var withdrawRequiresToken = {
    assertion: "requires a SEP-10 JWT if /info's 'authentication_required' is true",
    sep: 6,
    group: withdrawTestsGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        info_1.isCompliantWithSchema,
        info_1.assetCodeEnabledForWithdraw,
    ],
    context: {
        expects: {
            sep6InfoObj: undefined,
            sep6TransferServerUrl: undefined
        },
        provides: {
            authRequired: undefined
        }
    },
    failureModes: __assign({}, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, withdrawInfo, withdrawType, withdrawTypeFields, callParams, getWithdrawCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.assetCode)
                            // checked in assetCodeEnabledForWithdraw
                            throw "improperly configured";
                        result = { networkCalls: [] };
                        withdrawInfo = this.context.expects.sep6InfoObj.withdraw[config.assetCode];
                        this.context.provides.authRequired = Boolean(withdrawInfo.authentication_required);
                        if (!this.context.provides.authRequired) {
                            result.skipped = true;
                            return [2 /*return*/, result];
                        }
                        withdrawType = Object.keys(withdrawInfo.types)[0];
                        withdrawTypeFields = withdrawInfo.types[withdrawType].transactionFields || {};
                        callParams = new url_1.URLSearchParams(__assign({ account: stellar_sdk_1.Keypair.random().publicKey(), asset_code: config.assetCode, type: withdrawType }, withdrawTypeFields));
                        getWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.sep6TransferServerUrl +
                                withdrawEndpoint +
                                ("?" + callParams.toString()))
                        };
                        result.networkCalls.push(getWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(getWithdrawCall, 403, result)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(withdrawRequiresToken);
var withdrawRequiresAssetCode = {
    assertion: "requires 'asset_code' parameter",
    sep: 6,
    group: withdrawTestsGroup,
    dependencies: [
        tests_1.hasWebAuthEndpoint,
        tests_1.returnsValidJwt,
        toml_1.hasTransferServerUrl,
        info_1.assetCodeEnabledForWithdraw,
    ],
    context: {
        expects: {
            tomlObj: undefined,
            sep6InfoObj: undefined,
            authRequired: undefined,
            webAuthEndpoint: undefined,
            token: undefined,
            clientKeypair: undefined,
            sep6TransferServerUrl: undefined
        },
        provides: {}
    },
    failureModes: __assign({ NO_ERROR_RESPONSE_ATTRIBUTE: {
            name: "no 'error' attribute in response",
            text: function (_args) {
                return ("400 Bad Request response bodies should include a " +
                    "human-readable 'error' message");
            }
        } }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, withdrawInfo, withdrawType, withdrawTypeFields, callParams, getWithdrawCall, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.assetCode)
                            // checked in assetCodeEnabledForWithdraw
                            throw { message: "improperly configured" };
                        result = { networkCalls: [] };
                        headers = this.context.expects.authRequired
                            ? {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            }
                            : {};
                        withdrawInfo = this.context.expects.sep6InfoObj.withdraw[config.assetCode];
                        withdrawType = Object.keys(withdrawInfo.types)[0];
                        withdrawTypeFields = withdrawInfo.types[withdrawType].transactionFields || {};
                        callParams = new url_1.URLSearchParams(__assign({ account: stellar_sdk_1.Keypair.random().publicKey(), type: withdrawType }, withdrawTypeFields));
                        getWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.sep6TransferServerUrl +
                                withdrawEndpoint +
                                ("?" + callParams.toString()), __assign({}, headers))
                        };
                        result.networkCalls.push(getWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(getWithdrawCall, 400, result, "application/json")];
                    case 1:
                        errorResponse = _a.sent();
                        if (result.failure || !errorResponse)
                            return [2 /*return*/, result];
                        if (!errorResponse.error) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_ERROR_RESPONSE_ATTRIBUTE);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(withdrawRequiresAssetCode);
var withdrawRequiresAccount = {
    assertion: "requires 'account' parameter if /info's 'authentication_required' is false",
    sep: 6,
    group: withdrawTestsGroup,
    dependencies: withdrawRequiresAssetCode.dependencies,
    context: withdrawRequiresAssetCode.context,
    failureModes: withdrawRequiresAssetCode.failureModes,
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, withdrawInfo, withdrawType, withdrawTypeFields, callParams, getWithdrawCall, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.assetCode)
                            // checked in assetCodeEnabledForWithdraw
                            throw { message: "improperly configured" };
                        result = { networkCalls: [] };
                        if (!this.context.provides.authRequired) {
                            result.skipped = true;
                            return [2 /*return*/, result];
                        }
                        withdrawInfo = this.context.expects.sep6InfoObj.withdraw[config.assetCode];
                        withdrawType = Object.keys(withdrawInfo.types)[0];
                        withdrawTypeFields = withdrawInfo.types[withdrawType].transactionFields || {};
                        callParams = new url_1.URLSearchParams(__assign({ asset_code: config.assetCode, type: withdrawType }, withdrawTypeFields));
                        getWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.sep6TransferServerUrl +
                                withdrawEndpoint +
                                ("?" + callParams.toString()))
                        };
                        result.networkCalls.push(getWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(getWithdrawCall, 400, result, "application/json")];
                    case 1:
                        errorResponse = _a.sent();
                        if (result.failure || !errorResponse)
                            return [2 /*return*/, result];
                        if (!errorResponse.error) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_ERROR_RESPONSE_ATTRIBUTE);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(withdrawRequiresAccount);
var withdrawRejectsInvalidAccount = {
    assertion: "rejects invalid 'account' parameter if /info's 'authentication_required' is false",
    sep: 6,
    group: withdrawTestsGroup,
    dependencies: withdrawRequiresAssetCode.dependencies,
    context: withdrawRequiresAssetCode.context,
    failureModes: withdrawRequiresAssetCode.failureModes,
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, withdrawInfo, withdrawType, withdrawTypeFields, callParams, getWithdrawCall, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.assetCode)
                            // checked in assetCodeEnabledForWithdraw
                            throw { message: "improperly configured" };
                        result = { networkCalls: [] };
                        if (!this.context.provides.authRequired) {
                            result.skipped = true;
                            return [2 /*return*/, result];
                        }
                        headers = this.context.expects.authRequired
                            ? {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            }
                            : {};
                        withdrawInfo = this.context.expects.sep6InfoObj.withdraw[config.assetCode];
                        withdrawType = Object.keys(withdrawInfo.types)[0];
                        withdrawTypeFields = withdrawInfo.types[withdrawType].transactionFields || {};
                        callParams = new url_1.URLSearchParams(__assign({ asset_code: config.assetCode, account: "invalid account", type: withdrawType }, withdrawTypeFields));
                        getWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.sep6TransferServerUrl +
                                withdrawEndpoint +
                                ("" + callParams.toString()), __assign({}, headers))
                        };
                        result.networkCalls.push(getWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(getWithdrawCall, 400, result, "application/json")];
                    case 1:
                        errorResponse = _a.sent();
                        if (result.failure || !errorResponse)
                            return [2 /*return*/, result];
                        if (!errorResponse.error) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_ERROR_RESPONSE_ATTRIBUTE);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(withdrawRejectsInvalidAccount);
var withdrawRejectsUnsupportedAssetCode = {
    assertion: "rejects unsupported 'asset_code' parameter",
    sep: 6,
    group: withdrawTestsGroup,
    dependencies: withdrawRequiresAssetCode.dependencies,
    context: withdrawRequiresAssetCode.context,
    failureModes: withdrawRequiresAssetCode.failureModes,
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, withdrawInfo, withdrawType, withdrawTypeFields, callParams, getWithdrawCall, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.assetCode)
                            // checked in assetCodeEnabledForWithdraw
                            throw { message: "improperly configured" };
                        result = { networkCalls: [] };
                        headers = this.context.expects.authRequired
                            ? {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            }
                            : {};
                        withdrawInfo = this.context.expects.sep6InfoObj.withdraw[config.assetCode];
                        withdrawType = Object.keys(withdrawInfo.types)[0];
                        withdrawTypeFields = withdrawInfo.types[withdrawType].transactionFields || {};
                        callParams = new url_1.URLSearchParams(__assign({ asset_code: "NOT_SUPPORTED", account: this.context.expects.clientKeypair.publicKey(), type: withdrawType }, withdrawTypeFields));
                        getWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.sep6TransferServerUrl +
                                withdrawEndpoint +
                                ("?" + callParams.toString()), __assign({}, headers))
                        };
                        result.networkCalls.push(getWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(getWithdrawCall, 400, result, "application/json")];
                    case 1:
                        errorResponse = _a.sent();
                        if (result.failure || !errorResponse)
                            return [2 /*return*/, result];
                        if (!errorResponse.error) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_ERROR_RESPONSE_ATTRIBUTE);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(withdrawRejectsUnsupportedAssetCode);
exports.returnsProperSchemaForUnknownAccounts = {
    assertion: "returns a needs info response for valid requests from unknown accounts",
    sep: 6,
    group: withdrawTestsGroup,
    dependencies: withdrawRequiresAssetCode.dependencies,
    context: {
        expects: withdrawRequiresAssetCode.context.expects,
        provides: {
            sep6FieldsRequired: undefined
        }
    },
    failureModes: __assign({ INVALID_SCHEMA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body returned does not comply with the schema defined for the /withdraw endpoint:\n\n" +
                    (args.reference + "\n\n") +
                    "The errors returned from the schema validation:\n\n" +
                    ("" + args.errors));
            }
        } }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, token, headers, withdrawInfo, withdrawType, withdrawTypeFields, callParams, getWithdrawCall, responseBody, validatorResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.sepConfig ||
                            !config.sepConfig["6"] ||
                            !config.assetCode ||
                            !config.sepConfig["6"].withdraw.types)
                            throw { message: "improperly configured" };
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.postChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 1:
                        token = _a.sent();
                        headers = this.context.expects.authRequired
                            ? {
                                headers: {
                                    Authorization: "Bearer " + token
                                }
                            }
                            : {};
                        withdrawInfo = this.context.expects.sep6InfoObj.withdraw[config.assetCode];
                        withdrawType = Object.keys(withdrawInfo.types)[0];
                        withdrawTypeFields = config.sepConfig["6"].withdraw.types[withdrawType].transactionFields ||
                            {};
                        callParams = new url_1.URLSearchParams(__assign({ asset_code: config.assetCode, account: clientKeypair.publicKey(), type: withdrawType }, withdrawTypeFields));
                        getWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.sep6TransferServerUrl +
                                withdrawEndpoint +
                                ("?" + callParams.toString()), __assign({}, headers))
                        };
                        result.networkCalls.push(getWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(getWithdrawCall, 403, result, "application/json")];
                    case 2:
                        responseBody = _a.sent();
                        if (!responseBody)
                            return [2 /*return*/, result];
                        validatorResult = jsonschema_1.validate(responseBody, sep6_1.needsInfoResponseSchema);
                        if (validatorResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: validatorResult.errors.join("\n"),
                                reference: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#2-customer-information-needed-non-interactive"
                            });
                            return [2 /*return*/, result];
                        }
                        this.context.provides.sep6FieldsRequired = responseBody.fields;
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(exports.returnsProperSchemaForUnknownAccounts);
exports.returnsProperSchemaForKnownAccounts = {
    assertion: "returns a success or customer info status response for valid requests from KYC'ed accounts",
    sep: 6,
    group: withdrawTestsGroup,
    dependencies: [putCustomer_1.canCreateCustomer].concat(withdrawRequiresAssetCode.dependencies || []),
    context: {
        expects: withdrawRequiresAssetCode.context.expects,
        provides: {
            sep6WithdrawTransactionId: undefined
        }
    },
    failureModes: __assign({ INVALID_SCHEMA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body returned does not comply with the schema defined for the /withdraw endpoint:\n\n" +
                    (args.success + "\n") +
                    (args.customerInfoStatus + "\n\n") +
                    "The errors returned from the schema validation:\n\n" +
                    ("" + args.errors));
            }
        } }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, headers, withdrawInfo, withdrawType, withdrawTypeFields, callParams, getWithdrawCall, responseBody, schema, validatorResult, memoValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!config.sepConfig ||
                            !config.sepConfig["6"] ||
                            !config.assetCode ||
                            !config.sepConfig["6"].withdraw.types)
                            throw { message: "improperly configured" };
                        result = { networkCalls: [] };
                        headers = this.context.expects.authRequired
                            ? {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            }
                            : {};
                        withdrawInfo = this.context.expects.sep6InfoObj.withdraw[config.assetCode];
                        withdrawType = Object.keys(withdrawInfo.types)[0];
                        withdrawTypeFields = config.sepConfig["6"].withdraw.types[withdrawType].transactionFields ||
                            {};
                        callParams = new url_1.URLSearchParams(__assign({ asset_code: config.assetCode, account: this.context.expects.clientKeypair.publicKey(), type: withdrawType }, withdrawTypeFields));
                        getWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.sep6TransferServerUrl +
                                withdrawEndpoint +
                                ("?" + callParams.toString()), __assign({}, headers))
                        };
                        result.networkCalls.push(getWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(getWithdrawCall, 200, result, "application/json")];
                    case 1:
                        responseBody = _a.sent();
                        if (!responseBody || !getWithdrawCall.response)
                            return [2 /*return*/, result];
                        if (getWithdrawCall.response.status == 200) {
                            schema = sep6_1.withdrawSuccessResponseSchema;
                        }
                        else {
                            schema = sep6_1.customerInfoStatusSchema;
                        }
                        validatorResult = jsonschema_1.validate(responseBody, schema);
                        if (validatorResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: validatorResult.errors.join("\n"),
                                success: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed-1",
                                customerInfoStatus: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#3-customer-information-status"
                            });
                            return [2 /*return*/, result];
                        }
                        this.context.provides.sep6WithdrawTransactionId = responseBody.id || null;
                        if (getWithdrawCall.response.status === 200) {
                            try {
                                stellar_sdk_1.Keypair.fromPublicKey(responseBody.account_id);
                            }
                            catch (_b) {
                                result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                    errors: "invalid Stellar public key",
                                    success: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed-1",
                                    customerInfoStatus: "N/A"
                                });
                                return [2 /*return*/, result];
                            }
                            memoValue = responseBody.memo;
                            if (responseBody.memo_type === "hash") {
                                memoValue = Buffer.from(responseBody.memo, "base64");
                            }
                            try {
                                new stellar_sdk_1.Memo(responseBody.memo_type, memoValue);
                            }
                            catch (_c) {
                                result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                    errors: "invalid 'memo' for 'memo_type'",
                                    success: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed-1",
                                    customerInfoStatus: "N/A"
                                });
                                return [2 /*return*/, result];
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(exports.returnsProperSchemaForKnownAccounts);
exports["default"] = tests;
