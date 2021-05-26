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
var node_fetch_1 = require("node-fetch");
var jsonschema_1 = require("jsonschema");
var stellar_sdk_1 = require("stellar-sdk");
var toml_1 = require("./toml");
var putCustomer_1 = require("../sep12/putCustomer");
var failure_1 = require("../../helpers/failure");
var request_1 = require("../../helpers/request");
var sep31_1 = require("../../schemas/sep31");
var info_1 = require("./info");
var postTransactionsGroup = "POST /transactions";
var getTransactionsGroup = "GET /transactions/:id";
var tests = [];
var requiresJwt = {
    assertion: "requires a SEP-10 JWT",
    sep: 31,
    group: postTransactionsGroup,
    dependencies: [toml_1.hasDirectPaymentServer],
    context: {
        expects: {
            directPaymentServerUrl: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postTransactionsCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        postTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.directPaymentServerUrl + "/transactions", {
                                method: "POST",
                                body: JSON.stringify({})
                            })
                        };
                        result.networkCalls.push(postTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(postTransactionsCall, 403, result)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(requiresJwt);
var canCreateTransaction = {
    assertion: "can create a transaction",
    sep: 31,
    group: postTransactionsGroup,
    dependencies: [
        toml_1.hasDirectPaymentServer,
        info_1.hasExpectedAssetEnabled,
        putCustomer_1.differentMemosSameAccount,
    ],
    context: {
        expects: {
            directPaymentServerUrl: undefined,
            sendingAnchorClientKeypair: undefined,
            sendingAnchorToken: undefined,
            sendingCustomerId: undefined,
            receivingCustomerId: undefined
        },
        provides: {
            transactionId: undefined
        }
    },
    failureModes: __assign({ INVALID_SCHEMA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body from POST /transactions does not match " +
                    "the schema defined by the protocol:\n\n" +
                    "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#post-transactions\n\n" +
                    "Errors:\n\n" +
                    ("" + args.errors));
            }
        } }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postTransactionsCall, responseBody, validationResult, memoValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        if (!config.sepConfig || !config.sepConfig["31"]) {
                            // this configuration is checked prior to running tests
                            // but to satisfy TypeScript we make these checks here.
                            throw "improperly configured";
                        }
                        postTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.directPaymentServerUrl + "/transactions", {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.sendingAnchorToken,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    sender_id: this.context.expects.sendingCustomerId,
                                    receiver_id: this.context.expects.receivingCustomerId,
                                    amount: 100,
                                    asset_code: config.assetCode,
                                    fields: {
                                        transaction: __assign({}, config.sepConfig["31"].transactionFields)
                                    }
                                })
                            })
                        };
                        result.networkCalls.push(postTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(postTransactionsCall, 201, result, "application/json")];
                    case 1:
                        responseBody = _a.sent();
                        if (!responseBody)
                            return [2 /*return*/, result];
                        validationResult = jsonschema_1.validate(responseBody, sep31_1.postTransactionsSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: validationResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        try {
                            stellar_sdk_1.Keypair.fromPublicKey(responseBody.stellar_account_id);
                        }
                        catch (_b) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: "'stellar_acocunt_id' must be a valid Stellar public key"
                            });
                            return [2 /*return*/, result];
                        }
                        memoValue = responseBody.stellar_memo;
                        if (responseBody.stellar_memo_type === "hash") {
                            memoValue = Buffer.from(responseBody.stellar_memo, "base64");
                        }
                        try {
                            new stellar_sdk_1.Memo(responseBody.stellar_memo_type, memoValue);
                        }
                        catch (_c) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: "invalid 'stellar_memo' for 'stellar_memo_type'"
                            });
                            return [2 /*return*/, result];
                        }
                        this.context.provides.transactionId = responseBody.id;
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(canCreateTransaction);
var failsWithNoAmount = {
    assertion: "returns 400 when no amount is given",
    sep: 31,
    group: postTransactionsGroup,
    dependencies: [canCreateTransaction],
    context: {
        expects: {
            sendingAnchorToken: undefined,
            directPaymentServerUrl: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postTransactionsCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        if (!config.sepConfig || !config.sepConfig["31"]) {
                            // this configuration is checked prior to running tests
                            // but to satisfy TypeScript we make these checks here.
                            throw "improperly configured";
                        }
                        postTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.directPaymentServerUrl + "/transactions", {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.sendingAnchorToken,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    sender_id: this.context.expects.sendingCustomerId,
                                    receiver_id: this.context.expects.receivingCustomerId,
                                    asset_code: config.assetCode,
                                    fields: {
                                        transaction: __assign({}, config.sepConfig["31"].transactionFields)
                                    }
                                })
                            })
                        };
                        result.networkCalls.push(postTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(postTransactionsCall, 400, result, "application/json")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(failsWithNoAmount);
var failsWithNoAssetCode = {
    assertion: "returns 400 when no asset_code is given",
    sep: 31,
    group: postTransactionsGroup,
    dependencies: [canCreateTransaction],
    context: {
        expects: {
            sendingAnchorToken: undefined,
            directPaymentServerUrl: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postTransactionsCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        if (!config.sepConfig || !config.sepConfig["31"]) {
                            // this configuration is checked prior to running tests
                            // but to satisfy TypeScript we make these checks here.
                            throw "improperly configured";
                        }
                        postTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.directPaymentServerUrl + "/transactions", {
                                method: "POST",
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.sendingAnchorToken,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    sender_id: this.context.expects.sendingCustomerId,
                                    receiver_id: this.context.expects.receivingCustomerId,
                                    amount: 100,
                                    fields: {
                                        transaction: __assign({}, config.sepConfig["31"].transactionFields)
                                    }
                                })
                            })
                        };
                        result.networkCalls.push(postTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(postTransactionsCall, 400, result, "application/json")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(failsWithNoAssetCode);
var canFetchTransaction = {
    assertion: "can fetch a created transaction",
    sep: 31,
    group: getTransactionsGroup,
    dependencies: [toml_1.hasDirectPaymentServer, canCreateTransaction],
    context: {
        expects: {
            sendingAnchorToken: undefined,
            directPaymentServerUrl: undefined,
            transactionId: undefined
        },
        provides: {
            transactionJson: undefined
        }
    },
    failureModes: failure_1.genericFailures,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getTransactionCall, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getTransactionCall = {
                            request: new node_fetch_1.Request(this.context.expects.directPaymentServerUrl +
                                ("/transactions/" + this.context.expects.transactionId), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.sendingAnchorToken
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionCall);
                        _a = this.context.provides;
                        return [4 /*yield*/, request_1.makeRequest(getTransactionCall, 200, result, "application/json")];
                    case 1:
                        _a.transactionJson = _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(canFetchTransaction);
var hasValidTransactionJson = {
    assertion: "response body complies with protocol schema",
    sep: 31,
    group: getTransactionsGroup,
    dependencies: [canFetchTransaction],
    context: {
        expects: {
            transactionId: undefined,
            transactionJson: undefined
        },
        provides: {}
    },
    failureModes: {
        INVALID_SCHEMA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body from GET /transactions/:id does not match " +
                    "the schema defined by the protocol:\n\n" +
                    "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#get-transaction\n\n" +
                    "Errors:\n\n" +
                    ("" + args.errors));
            }
        },
        INVALID_ID: {
            name: "invalid 'id'",
            text: function (_args) {
                return "The 'id' value returned in the response body does match the ID used to fetch the transaction";
            }
        }
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, validationResult;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                validationResult = jsonschema_1.validate(this.context.expects.transactionJson, sep31_1.getTransactionSchema);
                if (validationResult.errors.length !== 0) {
                    result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                        errors: validationResult.errors.join("\n")
                    });
                    return [2 /*return*/, result];
                }
                if (this.context.expects.transactionId !==
                    this.context.expects.transactionJson.transaction.id) {
                    result.failure = failure_1.makeFailure(this.failureModes.INVALID_ID);
                    result.expected = this.context.expects.transactionId;
                    result.actual = this.context.expects.transactionJson.transaction.id;
                    return [2 /*return*/, result];
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(hasValidTransactionJson);
var returns404ForBadId = {
    assertion: "returns 404 for a non-existent transaction",
    sep: 31,
    group: getTransactionsGroup,
    dependencies: [toml_1.hasDirectPaymentServer, putCustomer_1.differentMemosSameAccount],
    context: {
        expects: {
            sendingAnchorToken: undefined,
            directPaymentServerUrl: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getTransactionCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getTransactionCall = {
                            request: new node_fetch_1.Request(this.context.expects.directPaymentServerUrl + "/transactions/not-an-id", {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.sendingAnchorToken
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionCall);
                        return [4 /*yield*/, request_1.makeRequest(getTransactionCall, 404, result)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(returns404ForBadId);
exports["default"] = tests;
