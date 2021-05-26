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
exports.differentMemosSameAccount = exports.canCreateCustomer = void 0;
var node_fetch_1 = require("node-fetch");
var node_fetch_2 = require("node-fetch");
var stellar_sdk_1 = require("stellar-sdk");
var crypto_1 = require("crypto");
var tests_1 = require("../sep10/tests");
var toml_1 = require("./toml");
var request_1 = require("../../helpers/request");
var failure_1 = require("../../helpers/failure");
var sep10_1 = require("../../helpers/sep10");
var putCustomerGroup = "PUT /customer";
var tests = [];
function getCustomersFromConfig(config) {
    if (!config.sepConfig ||
        !config.sepConfig["12"] ||
        !config.sepConfig["12"].customers)
        throw "SEP-12 customer data is missing from the configuration object";
    var customers = config.sepConfig["12"].customers;
    return [Object.keys(customers), Object.values(customers)];
}
var requiresJwt = {
    assertion: "requires a SEP-10 JWT",
    sep: 12,
    group: putCustomerGroup,
    dependencies: [toml_1.hasKycServerUrl],
    context: {
        expects: {
            kycServerUrl: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, _, customerValues, putCustomerCall;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        _a = getCustomersFromConfig(config), _ = _a[0], customerValues = _a[1];
                        putCustomerCall = {
                            request: new node_fetch_2.Request(this.context.expects.kycServerUrl + "/customer", {
                                method: "PUT",
                                body: customerValues[0]
                            })
                        };
                        result.networkCalls.push(putCustomerCall);
                        return [4 /*yield*/, request_1.makeRequest(putCustomerCall, [401, 403], result)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(requiresJwt);
exports.canCreateCustomer = {
    assertion: "can create a customer",
    sep: 12,
    group: putCustomerGroup,
    dependencies: [toml_1.hasKycServerUrl, tests_1.returnsValidJwt],
    context: {
        expects: {
            token: undefined,
            clientKeypair: undefined,
            kycServerUrl: undefined
        },
        provides: {
            customerId: undefined
        }
    },
    failureModes: __assign(__assign({ NO_ID_PROVIDED: {
            name: "no 'id' provided",
            text: function (_args) {
                return "An 'id' attribute is required for PUT /customer success responses";
            }
        }, BAD_ID_TYPE: {
            name: "bad 'id' data type",
            text: function (_args) {
                return "The 'id' returned in PUT /customer in responses must be a string";
            }
        } }, failure_1.genericFailures), { UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (args) {
                return ("The request to PUT /customer failed. This could be a result of " +
                    ("server error or invalid/missing data from the '" + args.customer + "' ") +
                    "SEP-12 customer data provided.");
            }
        } }),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, customerNames, customerValues, putCustomerCall, _b, _c, responseContentType, responseBody;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        result = { networkCalls: [] };
                        _a = getCustomersFromConfig(config), customerNames = _a[0], customerValues = _a[1];
                        putCustomerCall = {
                            request: new node_fetch_2.Request(this.context.expects.kycServerUrl + "/customer", {
                                method: "PUT",
                                headers: {
                                    Authorization: "Bearer " + this.context.expects.token,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(__assign({ account: this.context.expects.clientKeypair.publicKey() }, customerValues[0]))
                            })
                        };
                        result.networkCalls.push(putCustomerCall);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        _b = putCustomerCall;
                        return [4 /*yield*/, node_fetch_1["default"](putCustomerCall.request.clone())];
                    case 2:
                        _b.response = _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _c = _d.sent();
                        result.failure = failure_1.makeFailure(this.failureModes.CONNECTION_ERROR, {
                            url: putCustomerCall.request.url
                        });
                        return [2 /*return*/, result];
                    case 4:
                        if (putCustomerCall.response.status !== 202) {
                            result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_STATUS_CODE, {
                                customer: customerNames[0]
                            });
                            result.expected = 202;
                            result.actual = putCustomerCall.response.status;
                            return [2 /*return*/, result];
                        }
                        responseContentType = putCustomerCall.response.headers.get("Content-Type");
                        if (!responseContentType ||
                            !responseContentType.includes("application/json")) {
                            result.failure = failure_1.makeFailure(this.failureModes.BAD_CONTENT_TYPE, {
                                method: putCustomerCall.request.method,
                                url: putCustomerCall.request.method
                            });
                            result.expected = "application/json";
                            if (responseContentType)
                                result.actual = responseContentType;
                            return [2 /*return*/, result];
                        }
                        return [4 /*yield*/, putCustomerCall.response.clone().json()];
                    case 5:
                        responseBody = _d.sent();
                        if (!responseBody.id) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_ID_PROVIDED);
                            return [2 /*return*/, result];
                        }
                        if (typeof responseBody.id !== "string") {
                            result.failure = failure_1.makeFailure(this.failureModes.BAD_ID_TYPE);
                            return [2 /*return*/, result];
                        }
                        this.context.provides.customerId = responseBody.id;
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(exports.canCreateCustomer);
exports.differentMemosSameAccount = {
    assertion: "memos differentiate customers registered by the same account",
    sep: 12,
    group: putCustomerGroup,
    dependencies: [toml_1.hasKycServerUrl, tests_1.returnsValidJwt],
    context: {
        expects: {
            webAuthEndpoint: undefined,
            kycServerUrl: undefined,
            tomlObj: undefined
        },
        provides: {
            sendingAnchorClientKeypair: undefined,
            sendingAnchorToken: undefined,
            sendingCustomerId: undefined,
            sendingCustomerMemo: undefined,
            receivingCustomerId: undefined,
            receivingCustomerMemo: undefined
        }
    },
    failureModes: __assign({ NO_ID_PROVIDED: {
            name: "no 'id' provided",
            text: function (_args) {
                return "An 'id' attribute is required for PUT /customer success responses";
            }
        }, BAD_ID_TYPE: {
            name: "bad 'id' data type",
            text: function (_args) {
                return "The 'id' returned in PUT /customer in responses must be a string";
            }
        }, MEMO_DOESNT_DIFFERENTIATE: {
            name: "memos do not differentiate customers",
            text: function (_args) {
                return ("Two PUT /customer requests were made with the same account and " +
                    "different memos, but the same customer ID was returned in both responses. " +
                    "Memos are used to uniquely identify customers registered by the same account.");
            }
        } }, failure_1.genericFailures),
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, sendingCustomerData, receivingCustomerData, _a, _, customerValues, _b, sendingCustomerCall, sendingCustomerResponse, receivingCustomerCall, receivingCustomerResponse;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        result = { networkCalls: [] };
                        if (config.seps.includes(31)) {
                            if (!config.sepConfig ||
                                !config.sepConfig["31"] ||
                                !config.sepConfig["31"].sendingAnchorClientSecret ||
                                !config.sepConfig["12"]) {
                                // this configuration is checked prior to running tests
                                // but to satisfy TypeScript we make these checks here.
                                throw { message: "improperly configured" };
                            }
                            sendingCustomerData =
                                config.sepConfig["12"].customers[config.sepConfig["31"].sendingClientName];
                            receivingCustomerData =
                                config.sepConfig["12"].customers[config.sepConfig["31"].receivingClientName];
                            this.context.provides.sendingAnchorClientKeypair = stellar_sdk_1.Keypair.fromSecret(config.sepConfig["31"].sendingAnchorClientSecret);
                        }
                        else {
                            _a = getCustomersFromConfig(config), _ = _a[0], customerValues = _a[1];
                            sendingCustomerData = customerValues[1];
                            receivingCustomerData = customerValues[2];
                            this.context.provides.sendingAnchorClientKeypair = stellar_sdk_1.Keypair.random();
                        }
                        this.context.provides.sendingCustomerMemo = stellar_sdk_1.Memo.hash(crypto_1.randomBytes(32).toString("hex"));
                        this.context.provides.receivingCustomerMemo = stellar_sdk_1.Memo.hash(crypto_1.randomBytes(32).toString("hex"));
                        _b = this.context.provides;
                        return [4 /*yield*/, sep10_1.postChallenge(this.context.provides.sendingAnchorClientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 1:
                        _b.sendingAnchorToken = _c.sent();
                        sendingCustomerCall = {
                            request: new node_fetch_2.Request(this.context.expects.kycServerUrl + "/customer", {
                                method: "PUT",
                                headers: {
                                    Authorization: "Bearer " + this.context.provides.sendingAnchorToken,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(__assign({ account: this.context.provides.sendingAnchorClientKeypair.publicKey(), memo: this.context.provides.sendingCustomerMemo.value.toString("base64"), memo_type: "hash" }, sendingCustomerData))
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(sendingCustomerCall, 202, result, "application/json")];
                    case 2:
                        sendingCustomerResponse = _c.sent();
                        if (!sendingCustomerResponse)
                            return [2 /*return*/, result];
                        if (!sendingCustomerResponse.id) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_ID_PROVIDED);
                            return [2 /*return*/, result];
                        }
                        if (typeof sendingCustomerResponse.id !== "string") {
                            result.failure = failure_1.makeFailure(this.failureModes.BAD_ID_TYPE);
                            return [2 /*return*/, result];
                        }
                        receivingCustomerCall = {
                            request: new node_fetch_2.Request(this.context.expects.kycServerUrl + "/customer", {
                                method: "PUT",
                                headers: {
                                    Authorization: "Bearer " + this.context.provides.sendingAnchorToken,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(__assign({ account: this.context.provides.sendingAnchorClientKeypair.publicKey(), memo: this.context.provides.receivingCustomerMemo.value.toString("base64"), memo_type: "hash" }, receivingCustomerData))
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(receivingCustomerCall, 202, result, "application/json")];
                    case 3:
                        receivingCustomerResponse = _c.sent();
                        if (!receivingCustomerResponse)
                            return [2 /*return*/, result];
                        if (!receivingCustomerResponse.id) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_ID_PROVIDED);
                            return [2 /*return*/, result];
                        }
                        if (typeof receivingCustomerResponse.id !== "string") {
                            result.failure = failure_1.makeFailure(this.failureModes.BAD_ID_TYPE);
                            return [2 /*return*/, result];
                        }
                        if (receivingCustomerResponse.id === sendingCustomerResponse.id) {
                            result.failure = failure_1.makeFailure(this.failureModes.MEMO_DOESNT_DIFFERENTIATE);
                            return [2 /*return*/, result];
                        }
                        this.context.provides.sendingCustomerId = sendingCustomerResponse.id;
                        this.context.provides.receivingCustomerId = receivingCustomerResponse.id;
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(exports.differentMemosSameAccount);
exports["default"] = tests;
