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
exports.hasProperWithdrawTransactionSchema = void 0;
var node_fetch_1 = require("node-fetch");
var jsonschema_1 = require("jsonschema");
var sep24_1 = require("../../schemas/sep24");
var request_1 = require("../../helpers/request");
var failure_1 = require("../../helpers/failure");
var toml_1 = require("./toml");
var tests_1 = require("../sep10/tests");
var deposit_1 = require("./deposit");
var withdraw_1 = require("./withdraw");
var transactionEndpoint = "/transaction";
var transactionTestGroup = "/transaction";
var tests = [];
var invalidTransactionSchema = {
    name: "invalid schema",
    text: function (args) {
        return ("The response body returned does not comply with the schema defined for the /transaction endpoint:\n\n" +
            "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#single-historical-transaction\n\n" +
            "The errors returned from the schema validation:\n\n" +
            ("" + args.errors));
    }
};
var transactionRequiresToken = {
    assertion: "requires a JWT",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [toml_1.hasTransferServerUrl, tests_1.returnsValidJwt],
    context: {
        expects: {
            transferServerUrl: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, transactionCall;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                transactionCall = {
                    request: new node_fetch_1.Request(this.context.expects.transferServerUrl + transactionEndpoint)
                };
                result.networkCalls.push(transactionCall);
                request_1.makeRequest(transactionCall, 403, result);
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(transactionRequiresToken);
var transactionIsPresentAfterDepositRequest = {
    assertion: "has a record on /transaction after a deposit request",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        tests_1.returnsValidJwt,
        deposit_1.returnsProperSchemaForValidDepositRequest,
    ],
    context: {
        expects: {
            token: undefined,
            transferServerUrl: undefined,
            depositTransactionId: undefined
        },
        provides: {
            depositTransactionObj: undefined
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
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionEndpoint +
                                ("?id=" + this.context.expects.depositTransactionId), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionCall);
                        _a = this.context.provides;
                        return [4 /*yield*/, request_1.makeRequest(getTransactionCall, 200, result, "application/json")];
                    case 1:
                        _a.depositTransactionObj = _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(transactionIsPresentAfterDepositRequest);
var transactionIsPresentAfterWithdrawRequest = {
    assertion: "has a record on /transaction after a withdraw request",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        tests_1.returnsValidJwt,
        withdraw_1.returnsProperSchemaForValidWithdrawRequest,
    ],
    context: {
        expects: {
            token: undefined,
            transferServerUrl: undefined,
            withdrawTransactionId: undefined
        },
        provides: {
            withdrawTransactionObj: undefined
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
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionEndpoint +
                                ("?id=" + this.context.expects.withdrawTransactionId), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionCall);
                        _a = this.context.provides;
                        return [4 /*yield*/, request_1.makeRequest(getTransactionCall, 200, result, "application/json")];
                    case 1:
                        _a.withdrawTransactionObj = _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(transactionIsPresentAfterWithdrawRequest);
var hasProperDepositTransactionSchema = {
    assertion: "has proper deposit transaction schema on /transaction",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [
        deposit_1.returnsProperSchemaForValidDepositRequest,
        transactionIsPresentAfterDepositRequest,
    ],
    context: {
        expects: {
            depositTransactionId: undefined,
            depositTransactionObj: undefined
        },
        provides: {}
    },
    failureModes: __assign({ INVALID_SCHEMA: invalidTransactionSchema }, failure_1.genericFailures),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, validationResult;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                validationResult = jsonschema_1.validate(this.context.expects.depositTransactionObj, sep24_1.getTransactionSchema(true));
                if (validationResult.errors.length !== 0) {
                    result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                        errors: validationResult.errors.join("\n")
                    });
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(hasProperDepositTransactionSchema);
exports.hasProperWithdrawTransactionSchema = {
    assertion: "has proper withdraw transaction schema on /transaction",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [
        withdraw_1.returnsProperSchemaForValidWithdrawRequest,
        transactionIsPresentAfterWithdrawRequest,
    ],
    context: {
        expects: {
            withdrawTransactionId: undefined,
            withdrawTransactionObj: undefined
        },
        provides: {}
    },
    failureModes: __assign({ INVALID_SCHEMA: invalidTransactionSchema }, failure_1.genericFailures),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, validationResult;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                validationResult = jsonschema_1.validate(this.context.expects.depositTransactionObj, sep24_1.getTransactionSchema(false));
                if (validationResult.errors.length !== 0) {
                    result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                        errors: validationResult.errors.join("\n")
                    });
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(exports.hasProperWithdrawTransactionSchema);
var hasValidMoreInfoUrl = {
    assertion: "has a valid 'more_info_url'",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [hasProperDepositTransactionSchema],
    context: {
        expects: {
            depositTransactionObj: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getMoreInfoCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getMoreInfoCall = {
                            request: new node_fetch_1.Request(this.context.expects.depositTransactionObj.transaction.more_info_url)
                        };
                        return [4 /*yield*/, request_1.makeRequest(getMoreInfoCall, 200, result, "text/html")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(hasValidMoreInfoUrl);
var returns404ForBadId = {
    assertion: "returns 404 for a nonexistent transaction ID",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [toml_1.hasTransferServerUrl, tests_1.returnsValidJwt],
    context: {
        expects: {
            transferServerUrl: undefined,
            token: undefined
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
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionEndpoint +
                                "?id=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
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
var returns404ForBadExternalId = {
    assertion: "returns 404 for a nonexistent external transaction ID",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [toml_1.hasTransferServerUrl, tests_1.returnsValidJwt],
    context: {
        expects: {
            transferServerUrl: undefined,
            token: undefined
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
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionEndpoint +
                                "?external_transaction_id=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(getTransactionCall, 404, result)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(returns404ForBadExternalId);
var returns404ForBadStellarId = {
    assertion: "returns 404 for a nonexistent Stellar transaction ID",
    sep: 24,
    group: transactionTestGroup,
    dependencies: [toml_1.hasTransferServerUrl, tests_1.returnsValidJwt],
    context: {
        expects: {
            transferServerUrl: undefined,
            token: undefined
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
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionEndpoint +
                                "?stellar_transaction_id=021581089cb614be94b0ac5dc71cadf23a1cd96a2584152268de505ee2e5e999", {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(getTransactionCall, 404, result)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(returns404ForBadStellarId);
exports["default"] = tests;
