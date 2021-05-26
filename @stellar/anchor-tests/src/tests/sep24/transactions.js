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
var failure_1 = require("../../helpers/failure");
var request_1 = require("../../helpers/request");
var sep24_1 = require("../../schemas/sep24");
var tests_1 = require("../sep1/tests");
var sep10_1 = require("../../helpers/sep10");
var tests_2 = require("../sep10/tests");
var toml_1 = require("./toml");
var info_1 = require("./info");
var deposit_1 = require("./deposit");
var withdraw_1 = require("./withdraw");
var transaction_1 = require("./transaction");
var transactionsTestGroup = "/transactions";
var tests = [];
var transactionsEndpoint = "/transactions";
var invalidTransactionsSchema = {
    name: "invalid schema",
    text: function (args) {
        return ("The response body returned does not comply with the schema defined for the /transactions endpoint:\n\n" +
            "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#transaction-history\n\n" +
            "The errors returned from the schema validation:\n\n" +
            ("" + args.errors));
    }
};
var transactionsRequiresToken = {
    assertion: "requires a JWT",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [toml_1.hasTransferServerUrl, tests_2.returnsValidJwt],
    context: {
        expects: {
            transferServerUrl: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, transactionsCall;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                transactionsCall = {
                    request: new node_fetch_1.Request(this.context.expects.transferServerUrl + transactionsEndpoint)
                };
                result.networkCalls.push(transactionsCall);
                request_1.makeRequest(transactionsCall, 403, result);
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(transactionsRequiresToken);
var transactionsIsPresentAfterDepositRequest = {
    assertion: "has a record on /transactions after a deposit request",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        info_1.assetCodeEnabledForDeposit,
        tests_2.returnsValidJwt,
        deposit_1.returnsProperSchemaForValidDepositRequest,
    ],
    context: {
        expects: {
            token: undefined,
            transferServerUrl: undefined,
            depositTransactionId: undefined
        },
        provides: {
            depositTransactionsObj: undefined
        }
    },
    failureModes: __assign({ TRANSACTION_NOT_FOUND: {
            name: "transaction not found",
            text: function (args) {
                return "A transaction record with id " + args.id + " was not included in the response body.";
            }
        } }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getTransactionsCall, transactionsBody, transactionFound, _i, _a, t;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getTransactionsCall, 200, result, "application/json")];
                    case 1:
                        transactionsBody = _b.sent();
                        if (!transactionsBody)
                            return [2 /*return*/, result];
                        if (!transactionsBody.transactions ||
                            !Array.isArray(transactionsBody.transactions)) {
                            result.failure = failure_1.makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
                                id: this.context.expects.depositTransactionId
                            });
                            return [2 /*return*/, result];
                        }
                        transactionFound = false;
                        for (_i = 0, _a = transactionsBody.transactions; _i < _a.length; _i++) {
                            t = _a[_i];
                            if (t.id === this.context.expects.depositTransactionId) {
                                transactionFound = true;
                                break;
                            }
                        }
                        if (!transactionFound) {
                            result.failure = failure_1.makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
                                id: this.context.expects.depositTransactionId
                            });
                            return [2 /*return*/, result];
                        }
                        this.context.provides.depositTransactionsObj = transactionsBody;
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(transactionsIsPresentAfterDepositRequest);
var transactionsIsPresentAfterWithdrawRequest = {
    assertion: "has a record on /transactions after a withdraw request",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        info_1.assetCodeEnabledForWithdraw,
        tests_2.returnsValidJwt,
        withdraw_1.returnsProperSchemaForValidWithdrawRequest,
    ],
    context: {
        expects: {
            token: undefined,
            transferServerUrl: undefined,
            withdrawTransactionId: undefined
        },
        provides: {
            withdrawTransactionsObj: undefined
        }
    },
    failureModes: __assign({ TRANSACTION_NOT_FOUND: {
            name: "transaction not found",
            text: function (args) {
                return "A transaction record with id " + args.id + " was not included in the response body.";
            }
        } }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getTransactionsCall, transactionsBody, transactionFound, _i, _a, t;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getTransactionsCall, 200, result, "application/json")];
                    case 1:
                        transactionsBody = _b.sent();
                        if (!transactionsBody)
                            return [2 /*return*/, result];
                        if (!transactionsBody.transactions ||
                            !Array.isArray(transactionsBody.transactions)) {
                            result.failure = failure_1.makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
                                id: this.context.expects.withdrawTransactionId
                            });
                            return [2 /*return*/, result];
                        }
                        transactionFound = false;
                        for (_i = 0, _a = transactionsBody.transactions; _i < _a.length; _i++) {
                            t = _a[_i];
                            if (t.id === this.context.expects.withdrawTransactionId) {
                                transactionFound = true;
                                break;
                            }
                        }
                        if (!transactionFound) {
                            result.failure = failure_1.makeFailure(this.failureModes.TRANSACTION_NOT_FOUND, {
                                id: this.context.expects.withdrawTransactionId
                            });
                            return [2 /*return*/, result];
                        }
                        this.context.provides.withdrawTransactionsObj = transactionsBody;
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(transactionsIsPresentAfterWithdrawRequest);
var hasProperDepositTransactionsSchema = {
    assertion: "has proper deposit transaction schema on /transactions",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        deposit_1.returnsProperSchemaForValidDepositRequest,
        transactionsIsPresentAfterDepositRequest,
    ],
    context: {
        expects: {
            depositTransactionsObj: undefined
        },
        provides: {}
    },
    failureModes: __assign({ INVALID_SCHEMA: invalidTransactionsSchema }, failure_1.genericFailures),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, validationResult;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                validationResult = jsonschema_1.validate(this.context.expects.depositTransactionsObj, sep24_1.transactionsSchema);
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
tests.push(hasProperDepositTransactionsSchema);
var hasProperWithdrawTransactionsSchema = {
    assertion: "has proper withdraw transaction schema on /transactions",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        withdraw_1.returnsProperSchemaForValidWithdrawRequest,
        transactionsIsPresentAfterWithdrawRequest,
    ],
    context: {
        expects: {
            withdrawTransactionsObj: undefined
        },
        provides: {}
    },
    failureModes: __assign({ INVALID_SCHEMA: invalidTransactionsSchema }, failure_1.genericFailures),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, validationResult;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                validationResult = jsonschema_1.validate(this.context.expects.withdrawTransactionsObj, sep24_1.transactionsSchema);
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
tests.push(hasProperWithdrawTransactionsSchema);
var returnsEmptyListForNewAccount = {
    assertion: "returns an empty list for accounts with no transactions",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        tests_1.tomlExists,
        toml_1.hasTransferServerUrl,
        tests_2.hasWebAuthEndpoint,
        info_1.assetCodeEnabledForDeposit,
        tests_2.returnsValidJwt,
    ],
    context: {
        expects: {
            tomlObj: undefined,
            transferServerUrl: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    failureModes: __assign(__assign({ LIST_NOT_EMPTY: {
            name: "transactions list is not empty",
            text: function (_args) {
                return ("The transactions returned from /transactions should only be for the authenticated account. " +
                    "When an account has not initiated any transactions, /transactions should return an empty list.");
            }
        }, INVALID_SCHEMA: invalidTransactionsSchema }, sep10_1.postChallengeFailureModes), failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, token, getTransactionsCall, responseBody, validationResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.postChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 1:
                        token = _a.sent();
                        if (!token)
                            return [2 /*return*/, result];
                        getTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode), {
                                headers: {
                                    Authorization: "Bearer " + token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getTransactionsCall, 200, result, "application/json")];
                    case 2:
                        responseBody = _a.sent();
                        if (!responseBody)
                            return [2 /*return*/, result];
                        validationResult = jsonschema_1.validate(responseBody, sep24_1.transactionsSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                                errors: validationResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        if (responseBody.transactions.length > 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.LIST_NOT_EMPTY);
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(returnsEmptyListForNewAccount);
var honorsLimitParam = {
    assertion: "returns proper number of transactions when 'limit' parameter is given",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        tests_2.returnsValidJwt,
        deposit_1.returnsProperSchemaForValidDepositRequest,
    ],
    context: {
        expects: {
            transferServerUrl: undefined,
            token: undefined,
            clientKeypair: undefined
        },
        provides: {}
    },
    failureModes: __assign({ NO_TRANSACTIONS: {
            name: "transaction list empty",
            text: function (_args) {
                return ("No transactions were returned in the /transactions response, but the authenticated " +
                    "account has initiated two transactions. " +
                    "One transaction was expected because the 'limit=1' parameter was specified.");
            }
        }, LIMIT_NOT_HONORED: {
            name: "limit parameter not honored",
            text: function (_args) {
                return ("Too many transactions were returned in the /transactions response. " +
                    "One transaction was expected because the 'limit=1' parameter was specified.");
            }
        }, DEPOSIT_INVALID_SCHEMA: deposit_1.invalidDepositSchema, TRANSACTIONS_INVALID_SCHEMA: invalidTransactionsSchema }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postDepositCall, depositResponseBody, validatorResult, getTransactionsCall, transactionsResponseBody, transactionsValidatorResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        postDepositCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl + deposit_1.depositEndpoint, {
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
                        result.networkCalls.push(postDepositCall);
                        return [4 /*yield*/, request_1.makeRequest(postDepositCall, 200, result, "application/json")];
                    case 1:
                        depositResponseBody = _a.sent();
                        if (!depositResponseBody)
                            return [2 /*return*/, result];
                        validatorResult = jsonschema_1.validate(depositResponseBody, sep24_1.successResponseSchema);
                        if (validatorResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.DEPOSIT_INVALID_SCHEMA, {
                                errors: validatorResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        getTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode + "&limit=1"), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getTransactionsCall, 200, result, "application/json")];
                    case 2:
                        transactionsResponseBody = _a.sent();
                        if (!transactionsResponseBody)
                            return [2 /*return*/, result];
                        transactionsValidatorResult = jsonschema_1.validate(transactionsResponseBody, sep24_1.transactionsSchema);
                        if (transactionsValidatorResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.TRANSACTIONS_INVALID_SCHEMA, {
                                errors: transactionsValidatorResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        if (transactionsResponseBody.transactions.length === 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_TRANSACTIONS);
                            return [2 /*return*/, result];
                        }
                        if (transactionsResponseBody.transactions.length > 1) {
                            result.failure = failure_1.makeFailure(this.failureModes.LIMIT_NOT_HONORED);
                            result.expected = 1;
                            result.actual = transactionsResponseBody.transactions.length;
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(honorsLimitParam);
var transactionsAreInDescendingOrder = {
    assertion: "transactions are returned in descending order of creation",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        tests_2.returnsValidJwt,
        info_1.assetCodeEnabledForDeposit,
        transactionsIsPresentAfterDepositRequest,
    ],
    context: {
        expects: {
            transferServerUrl: undefined,
            token: undefined,
            clientKeypair: undefined
        },
        provides: {}
    },
    failureModes: __assign({ NO_TRANSACTIONS: {
            name: "transaction list empty",
            text: function (_args) {
                return ("No transactions were returned in the /transactions response, but the authenticated " +
                    "account has initiated two transactions. " +
                    "One transaction was expected because the 'limit=1' parameter was specified.");
            }
        }, DEPOSIT_INVALID_SCHEMA: deposit_1.invalidDepositSchema, TRANSACTIONS_INVALID_SCHEMA: invalidTransactionsSchema, MISSING_TRANSACTIONS: {
            name: "missing transactions",
            text: function (_args) {
                return ("More than one transaction has been successfully initiated, but only one transaction was returned. " +
                    "A transaction record must be created for every successful POST /deposit request.");
            }
        }, NOT_DESCENDING_TRANSACTIONS: {
            name: "transaction are not in descending order",
            text: function (_args) {
                return "The transaction recoreds returned were now in descending order by 'start_time'";
            }
        } }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, postDepositCall, depositResponseBody, validatorResult, getTransactionsCall, transactionsResponseBody, transactionsValidatorResult, previousStartTime, _i, _a, transaction, dateTime;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        postDepositCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl + deposit_1.depositEndpoint, {
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
                        result.networkCalls.push(postDepositCall);
                        return [4 /*yield*/, request_1.makeRequest(postDepositCall, 200, result, "application/json")];
                    case 1:
                        depositResponseBody = _b.sent();
                        if (!depositResponseBody)
                            return [2 /*return*/, result];
                        validatorResult = jsonschema_1.validate(depositResponseBody, sep24_1.successResponseSchema);
                        if (validatorResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.DEPOSIT_INVALID_SCHEMA, {
                                errors: validatorResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        getTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getTransactionsCall, 200, result, "application/json")];
                    case 2:
                        transactionsResponseBody = _b.sent();
                        if (!transactionsResponseBody)
                            return [2 /*return*/, result];
                        transactionsValidatorResult = jsonschema_1.validate(transactionsResponseBody, sep24_1.transactionsSchema);
                        if (transactionsValidatorResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.TRANSACTIONS_INVALID_SCHEMA, {
                                errors: transactionsValidatorResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        if (transactionsResponseBody.transactions.length === 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_TRANSACTIONS);
                            return [2 /*return*/, result];
                        }
                        if (transactionsResponseBody.transactions.length < 2) {
                            result.failure = failure_1.makeFailure(this.failureModes.MISSING_TRANSACTIONS);
                            return [2 /*return*/, result];
                        }
                        previousStartTime = new Date(transactionsResponseBody.transactions[0].started_at);
                        for (_i = 0, _a = transactionsResponseBody.transactions; _i < _a.length; _i++) {
                            transaction = _a[_i];
                            dateTime = new Date(transaction.started_at);
                            if (dateTime > previousStartTime) {
                                result.failure = failure_1.makeFailure(this.failureModes.NOT_DESCENDING_TRANSACTIONS);
                                return [2 /*return*/, result];
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(transactionsAreInDescendingOrder);
var honorsNoOlderThanParam = {
    assertion: "returns proper transactions when 'no_older_than' parameter is given",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        hasProperDepositTransactionsSchema,
        honorsLimitParam,
        transactionsAreInDescendingOrder,
        tests_2.returnsValidJwt,
    ],
    context: {
        expects: {
            transferServerUrl: undefined,
            token: undefined
        },
        provides: {}
    },
    failureModes: __assign({ NO_TRANSACTIONS: {
            name: "no transactions returned",
            text: function (_args) {
                return ("No transactions were returned, even though a transaction was created after " +
                    "the 'no_older_than' parameter given.");
            }
        }, MISSING_TRANSACTIONS: {
            name: "missing transactions",
            text: function (_args) {
                return ("Three transaction have been successfully initiated, but less than three " +
                    "transactions were returned. A transaction record must be created for every " +
                    "successful POST /deposit request.");
            }
        }, MISSING_TRANSACTIONS_NO_OLDER_THAN: {
            name: "missing transactions",
            text: function (_args) {
                return ("Two transaction were initiated at or before the 'no_older_than' parameter given, " +
                    "But less than two transactions were returned.");
            }
        }, TRANSACTION_EARLIER_THAN_PARAM: {
            name: "invalid transaction returned",
            text: function (_args) {
                return ("A transaction that was created earlier than the 'no_older_than' parameter was " +
                    "included in the response.");
            }
        }, TRANSACTIONS_INVALID_SCHEMA: invalidTransactionsSchema }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getTransactionsCall, allTransactionsBody, validationResult, notEarliestTransaction, getTransactionsOlderThanCall, noOlderThanBody, noOlderThanValidationResult, _i, _a, transaction;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getTransactionsCall, 200, result, "application/json")];
                    case 1:
                        allTransactionsBody = _b.sent();
                        if (!allTransactionsBody)
                            return [2 /*return*/, result];
                        if (allTransactionsBody.transactions.length < 3) {
                            result.failure = failure_1.makeFailure(this.failureModes.MISSING_TRANSACTIONS);
                            return [2 /*return*/, result];
                        }
                        validationResult = jsonschema_1.validate(allTransactionsBody, sep24_1.transactionsSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.TRANSACTIONS_INVALID_SCHEMA, { errors: validationResult.errors.join("\n") });
                            return [2 /*return*/, result];
                        }
                        notEarliestTransaction = allTransactionsBody.transactions[allTransactionsBody.transactions.length - 2];
                        getTransactionsOlderThanCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode + "&no_older_than=" + notEarliestTransaction.started_at), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(getTransactionsOlderThanCall, 200, result, "application/json")];
                    case 2:
                        noOlderThanBody = _b.sent();
                        if (!noOlderThanBody)
                            return [2 /*return*/, result];
                        noOlderThanValidationResult = jsonschema_1.validate(noOlderThanBody, sep24_1.transactionsSchema);
                        if (noOlderThanValidationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.TRANSACTIONS_INVALID_SCHEMA, { errors: noOlderThanValidationResult.errors.join("\n") });
                            return [2 /*return*/, result];
                        }
                        if (noOlderThanBody.transactions.length < 2) {
                            result.failure = failure_1.makeFailure(this.failureModes.MISSING_TRANSACTIONS_NO_OLDER_THAN);
                            return [2 /*return*/, result];
                        }
                        for (_i = 0, _a = noOlderThanBody.transactions; _i < _a.length; _i++) {
                            transaction = _a[_i];
                            if (new Date(transaction.started_at) <
                                new Date(notEarliestTransaction.started_at)) {
                                result.failure = failure_1.makeFailure(this.failureModes.TRANSACTION_EARLIER_THAN_PARAM);
                                return [2 /*return*/, result];
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(honorsNoOlderThanParam);
var honorsWithdrawTransactionKind = {
    assertion: "only returns withdraw transactions when kind=withdrawal",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        hasProperDepositTransactionsSchema,
        transaction_1.hasProperWithdrawTransactionSchema,
        tests_2.returnsValidJwt,
    ],
    context: {
        expects: {
            transferServerUrl: undefined,
            token: undefined
        },
        provides: {}
    },
    failureModes: __assign({ BAD_KIND: {
            name: "deposit transaction returned",
            text: function (_args) {
                return "Deposit transactions should not be returned when kind=withdrawal";
            }
        }, NO_TRANSACTIONS: {
            name: "no transactions returned",
            text: function (_args) {
                return "No transactions were returned, even though a withdraw transaction was created";
            }
        }, INVALID_TRANSACTIONS_SCHMEA: invalidTransactionsSchema }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getWithdrawTransactionsCall, withdrawTransactions, validationResult, _i, _a, transaction;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getWithdrawTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode + "&kind=withdrawal"), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getWithdrawTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getWithdrawTransactionsCall, 200, result, "application/json")];
                    case 1:
                        withdrawTransactions = _b.sent();
                        if (!withdrawTransactions)
                            return [2 /*return*/, result];
                        validationResult = jsonschema_1.validate(withdrawTransactions, sep24_1.transactionsSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_TRANSACTIONS_SCHMEA, { errors: validationResult.errors.join("\n") });
                            return [2 /*return*/, result];
                        }
                        if (withdrawTransactions.transactions.length === 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_TRANSACTIONS);
                            return [2 /*return*/, result];
                        }
                        for (_i = 0, _a = withdrawTransactions.transactions; _i < _a.length; _i++) {
                            transaction = _a[_i];
                            if (transaction.kind !== "withdrawal") {
                                result.failure = failure_1.makeFailure(this.failureModes.BAD_KIND);
                                return [2 /*return*/, result];
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(honorsWithdrawTransactionKind);
var honorsDepositTransactionKind = {
    assertion: "only returns deposit transactions when kind=deposit",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [
        toml_1.hasTransferServerUrl,
        hasProperDepositTransactionsSchema,
        transaction_1.hasProperWithdrawTransactionSchema,
        tests_2.returnsValidJwt,
    ],
    context: {
        expects: {
            transferServerUrl: undefined,
            token: undefined
        },
        provides: {}
    },
    failureModes: __assign({ BAD_KIND: {
            name: "deposit transaction returned",
            text: function (_args) {
                return "Withdraw transactions should not be returned when kind=deposit";
            }
        }, NO_TRANSACTIONS: {
            name: "no transactions returned",
            text: function (_args) {
                return "No transactions were returned, even though a deposit transaction was created";
            }
        }, INVALID_TRANSACTIONS_SCHMEA: invalidTransactionsSchema }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getDepositTransactionsCall, depositTransactions, validationResult, _i, _a, transaction;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getDepositTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                ("?asset_code=" + config.assetCode + "&kind=deposit"), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getDepositTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getDepositTransactionsCall, 200, result, "application/json")];
                    case 1:
                        depositTransactions = _b.sent();
                        if (!depositTransactions)
                            return [2 /*return*/, result];
                        validationResult = jsonschema_1.validate(depositTransactions, sep24_1.transactionsSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_TRANSACTIONS_SCHMEA, { errors: validationResult.errors.join("\n") });
                            return [2 /*return*/, result];
                        }
                        if (depositTransactions.transactions.length === 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_TRANSACTIONS);
                            return [2 /*return*/, result];
                        }
                        for (_i = 0, _a = depositTransactions.transactions; _i < _a.length; _i++) {
                            transaction = _a[_i];
                            if (transaction.kind !== "deposit") {
                                result.failure = failure_1.makeFailure(this.failureModes.BAD_KIND);
                                return [2 /*return*/, result];
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(honorsDepositTransactionKind);
var rejectsBadAssetCode = {
    assertion: "rejects requests with a bad 'asset_code' parameter",
    sep: 24,
    group: transactionsTestGroup,
    dependencies: [toml_1.hasTransferServerUrl, tests_2.returnsValidJwt],
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
            var result, getTransactionsCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getTransactionsCall = {
                            request: new node_fetch_1.Request(this.context.expects.transferServerUrl +
                                transactionsEndpoint +
                                "?asset_code=BADCODE", {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getTransactionsCall);
                        return [4 /*yield*/, request_1.makeRequest(getTransactionsCall, 400, result)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(rejectsBadAssetCode);
exports["default"] = tests;
