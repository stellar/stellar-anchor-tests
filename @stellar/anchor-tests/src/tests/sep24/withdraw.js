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
exports.returnsProperSchemaForValidWithdrawRequest = exports.invalidWithdrawSchema = void 0;
var node_fetch_1 = require("node-fetch");
var stellar_sdk_1 = require("stellar-sdk");
var jsonschema_1 = require("jsonschema");
var toml_1 = require("./toml");
var info_1 = require("./info");
var tests_1 = require("../sep1/tests");
var tests_2 = require("../sep10/tests");
var failure_1 = require("../../helpers/failure");
var request_1 = require("../../helpers/request");
var sep24_1 = require("../../schemas/sep24");
var withdrawTestsGroup = "/withdraw";
var withdrawEndpoint = "/transactions/withdraw/interactive";
var tests = [];
exports.invalidWithdrawSchema = {
    name: "invalid schema",
    text: function (args) {
        return ("The response body returned does not comply with the schema defined for the /withdraw endpoint:\n\n" +
            "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#deposit-and-withdraw-shared-responses\n\n" +
            "The errors returned from the schema validation:\n\n" +
            ("" + args.errors));
    }
};
var withdrawRequiresToken = {
    assertion: "requires a SEP-10 JWT",
    sep: 24,
    group: withdrawTestsGroup,
    dependencies: [toml_1.hasTransferServerUrl, info_1.assetCodeEnabledForWithdraw],
    context: {
        expects: {
            transferServerUrl: undefined
        },
        provides: {}
    },
    failureModes: __assign({}, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postWithdrawCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        postWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl + withdrawEndpoint, {
                                method: "POST",
                                body: JSON.stringify({
                                    account: stellar_sdk_1.Keypair.random().publicKey(),
                                    asset_code: config.assetCode
                                }),
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            })
                        };
                        result.networkCalls.push(postWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(postWithdrawCall, 403, result)];
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
    sep: 24,
    group: withdrawTestsGroup,
    dependencies: [
        tests_1.tomlExists,
        tests_2.hasWebAuthEndpoint,
        tests_2.returnsValidJwt,
        toml_1.hasTransferServerUrl,
        info_1.assetCodeEnabledForWithdraw,
    ],
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined,
            token: undefined,
            clientKeypair: undefined,
            transferServerUrl: undefined
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
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postWithdrawCall, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        postWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl + withdrawEndpoint, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: "Bearer " + this.context.expects.token
                                },
                                body: JSON.stringify({
                                    account: this.context.expects.clientKeypair.publicKey()
                                })
                            })
                        };
                        result.networkCalls.push(postWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(postWithdrawCall, 400, result, "application/json")];
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
var withdrawRejectsUnsupportedAssetCode = {
    assertion: "rejects unsupported 'asset_code' parameter",
    sep: 24,
    group: withdrawTestsGroup,
    dependencies: withdrawRequiresAssetCode.dependencies,
    context: withdrawRequiresAssetCode.context,
    failureModes: withdrawRequiresAssetCode.failureModes,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postWithdrawCall, errorResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        postWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl + withdrawEndpoint, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: "Bearer " + this.context.expects.token
                                },
                                body: JSON.stringify({
                                    asset_code: "NOT_SUPPORTED",
                                    account: this.context.expects.clientKeypair.publicKey()
                                })
                            })
                        };
                        result.networkCalls.push(postWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(postWithdrawCall, 400, result, "application/json")];
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
exports.returnsProperSchemaForValidWithdrawRequest = {
    assertion: "returns a proper schema for valid requests",
    sep: 24,
    group: withdrawTestsGroup,
    dependencies: withdrawRequiresAssetCode.dependencies,
    context: {
        expects: withdrawRequiresAssetCode.context.expects,
        provides: {
            withdrawTransactionId: undefined
        }
    },
    failureModes: __assign({ INVALID_SCHEMA: exports.invalidWithdrawSchema }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postWithdrawCall, responseBody, validatorResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        postWithdrawCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl + withdrawEndpoint, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: "Bearer " + this.context.expects.token
                                },
                                body: JSON.stringify({
                                    asset_code: config.assetCode,
                                    account: this.context.expects.clientKeypair.publicKey()
                                })
                            })
                        };
                        result.networkCalls.push(postWithdrawCall);
                        return [4 /*yield*/, request_1.makeRequest(postWithdrawCall, 200, result, "application/json")];
                    case 1:
                        responseBody = _a.sent();
                        if (!responseBody)
                            return [2 /*return*/, result];
                        validatorResult = jsonschema_1.validate(responseBody, sep24_1.successResponseSchema);
                        if (validatorResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: validatorResult.errors.join("\n")
                            });
                        }
                        this.context.provides.withdrawTransactionId = responseBody.id;
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(exports.returnsProperSchemaForValidWithdrawRequest);
exports["default"] = tests;
