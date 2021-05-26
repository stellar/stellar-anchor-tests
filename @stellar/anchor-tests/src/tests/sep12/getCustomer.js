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
exports.canFetchExistingCustomerById = void 0;
var node_fetch_1 = require("node-fetch");
var jsonschema_1 = require("jsonschema");
var stellar_sdk_1 = require("stellar-sdk");
var tests_1 = require("../sep1/tests");
var tests_2 = require("../sep10/tests");
var toml_1 = require("./toml");
var request_1 = require("../../helpers/request");
var failure_1 = require("../../helpers/failure");
var sep12_1 = require("../../schemas/sep12");
var sep10_1 = require("../../helpers/sep10");
var putCustomer_1 = require("./putCustomer");
var getCustomerGroup = "GET /customer";
var tests = [];
var requiresJwtToken = {
    assertion: "requires a SEP-10 JWT",
    sep: 12,
    group: getCustomerGroup,
    dependencies: [toml_1.hasKycServerUrl],
    context: {
        expects: {
            kycServerUrl: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getCustomerCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getCustomerCall = {
                            request: new node_fetch_1.Request(this.context.expects.kycServerUrl + "/customer")
                        };
                        result.networkCalls.push(getCustomerCall);
                        return [4 /*yield*/, request_1.makeRequest(getCustomerCall, [401, 403], result)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(requiresJwtToken);
var newCustomerValidSchema = {
    assertion: "has a valid schema for a new customer",
    sep: 12,
    group: getCustomerGroup,
    dependencies: [tests_1.hasNetworkPassphrase, toml_1.hasKycServerUrl, tests_2.returnsValidJwt],
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined,
            kycServerUrl: undefined
        },
        provides: {}
    },
    failureModes: __assign({ INVALID_SCHMEA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body returned does not comply with the specification:\n\n" +
                    "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get\n\n" +
                    "The errors returned from the schema validation:\n\n" +
                    ("" + args.errors));
            }
        }, UNEXPECTED_CUSTOMER_ID: {
            name: "unexpected customer 'id'",
            text: function (_args) {
                return ("Customers for which an anchor has not yet collected KYC information for should not " +
                    "have an 'id' attribute in the response.");
            }
        }, INVALID_CUSTOMER_STATUS: {
            name: "invalid customer status",
            text: function (_args) {
                return "'NEEDS_INFO' is the expected status for a customer that has not been registered";
            }
        } }, failure_1.genericFailures),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, token, getCustomerCall, getCustomerBody, validationResult;
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
                        getCustomerCall = {
                            request: new node_fetch_1.Request(this.context.expects.kycServerUrl +
                                ("/customer?account=" + clientKeypair.publicKey()), {
                                headers: {
                                    Authorization: "Bearer " + token
                                }
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(getCustomerCall, 200, result, "application/json")];
                    case 2:
                        getCustomerBody = _a.sent();
                        if (!getCustomerBody)
                            return [2 /*return*/, result];
                        validationResult = jsonschema_1.validate(getCustomerBody, sep12_1.getCustomerSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHMEA, {
                                errors: validationResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        if (getCustomerBody.id) {
                            result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_CUSTOMER_ID);
                            return [2 /*return*/, result];
                        }
                        if (getCustomerBody.status !== "NEEDS_INFO") {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_CUSTOMER_STATUS);
                            result.expected = "NEEDS_INFO";
                            result.actual = getCustomerBody.status;
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(newCustomerValidSchema);
exports.canFetchExistingCustomerById = {
    assertion: "can retrieve customer using 'id'",
    sep: 12,
    group: getCustomerGroup,
    dependencies: [putCustomer_1.canCreateCustomer],
    context: {
        expects: {
            kycServerUrl: undefined,
            token: undefined,
            clientKeypair: undefined,
            customerId: undefined
        },
        provides: {}
    },
    failureModes: __assign({ INVALID_SCHMEA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body returned does not comply with the specification:\n\n" +
                    "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get\n\n" +
                    "The errors returned from the schema validation:\n\n" +
                    ("" + args.errors));
            }
        }, UNEXPECTED_STATUS: {
            name: "unexpected customer status",
            text: function (_args) {
                return ("An existing customer for which all information was provided should no longer be in the " +
                    "'NEEDS_INFO' status. Ensure the customer data provided in the SEP-12 configuration includes " +
                    "all required properties.");
            }
        } }, failure_1.genericFailures),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getCustomerCall, responseBody, validationResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getCustomerCall = {
                            request: new node_fetch_1.Request(this.context.expects.kycServerUrl +
                                ("/customer?id=" + this.context.expects.customerId), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getCustomerCall);
                        return [4 /*yield*/, request_1.makeRequest(getCustomerCall, 200, result, "application/json")];
                    case 1:
                        responseBody = _a.sent();
                        if (!responseBody)
                            return [2 /*return*/, result];
                        validationResult = jsonschema_1.validate(responseBody, sep12_1.getCustomerSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHMEA, {
                                errors: validationResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        if (responseBody.status === "NEEDS_INFO") {
                            result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_STATUS);
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(exports.canFetchExistingCustomerById);
var canFetchExistingCustomerByAccount = {
    assertion: "can retrieve customer using 'account'",
    sep: 12,
    group: getCustomerGroup,
    dependencies: [putCustomer_1.canCreateCustomer],
    context: {
        expects: {
            kycServerUrl: undefined,
            token: undefined,
            clientKeypair: undefined,
            customerId: undefined
        },
        provides: {}
    },
    failureModes: __assign({ INVALID_SCHMEA: {
            name: "invalid schema",
            text: function (args) {
                return ("The response body returned does not comply with the specification:\n\n" +
                    "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get\n\n" +
                    "The errors returned from the schema validation:\n\n" +
                    ("" + args.errors));
            }
        }, UNEXPECTED_STATUS: {
            name: "unexpected customer status",
            text: function (_args) {
                return ("An existing customer for which all information was provided should no longer be in the " +
                    "'NEEDS_INFO' status. Ensure the customer data provided in the SEP-12 configuration includes " +
                    "all required properties.");
            }
        } }, failure_1.genericFailures),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getCustomerCall, responseBody, validationResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getCustomerCall = {
                            request: new node_fetch_1.Request(this.context.expects.kycServerUrl +
                                ("/customer?account=" + this.context.expects.clientKeypair.publicKey()), {
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token
                                }
                            })
                        };
                        result.networkCalls.push(getCustomerCall);
                        return [4 /*yield*/, request_1.makeRequest(getCustomerCall, 200, result, "application/json")];
                    case 1:
                        responseBody = _a.sent();
                        if (!responseBody)
                            return [2 /*return*/, result];
                        validationResult = jsonschema_1.validate(responseBody, sep12_1.getCustomerSchema);
                        if (validationResult.errors.length !== 0) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHMEA, {
                                errors: validationResult.errors.join("\n")
                            });
                            return [2 /*return*/, result];
                        }
                        if (responseBody.status === "NEEDS_INFO") {
                            result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_STATUS);
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(canFetchExistingCustomerByAccount);
exports["default"] = tests;
