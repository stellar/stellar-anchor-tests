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
var stellar_sdk_1 = require("stellar-sdk");
var node_fetch_1 = require("node-fetch");
var toml_1 = require("./toml");
var tests_1 = require("../sep1/tests");
var tests_2 = require("../sep10/tests");
var failure_1 = require("../../helpers/failure");
var putCustomer_1 = require("./putCustomer");
var getCustomer_1 = require("./getCustomer");
var sep10_1 = require("../../helpers/sep10");
var request_1 = require("../../helpers/request");
function getCustomersFromConfig(config) {
    if (!config.sepConfig ||
        !config.sepConfig["12"] ||
        !config.sepConfig["12"].customers)
        throw "SEP-12 customer data is missing from the configuration object";
    var customers = config.sepConfig["12"].customers;
    return [Object.keys(customers), Object.values(customers)];
}
var requiresJwtToken = {
    assertion: "requires a SEP-10 JWT",
    sep: 12,
    group: "DELETE /customer",
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
            var result, deleteCustomerCall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        deleteCustomerCall = {
                            request: new node_fetch_1.Request(this.context.expects.kycServerUrl +
                                ("/customer/" + stellar_sdk_1.Keypair.random().publicKey()), {
                                method: "DELETE"
                            })
                        };
                        result.networkCalls.push(deleteCustomerCall);
                        return [4 /*yield*/, request_1.makeRequest(deleteCustomerCall, [401, 403], result)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
var canDeleteCustomer = {
    assertion: "can delete a customer",
    sep: 12,
    group: "DELETE /customer",
    dependencies: [
        toml_1.hasKycServerUrl,
        tests_1.hasNetworkPassphrase,
        putCustomer_1.canCreateCustomer,
        getCustomer_1.canFetchExistingCustomerById,
        tests_2.returnsValidJwt,
    ],
    context: {
        expects: {
            tomlObj: undefined,
            kycServerUrl: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    failureModes: failure_1.genericFailures,
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, token, _a, _, customerValues, putCustomerCall, putCustomerBody, getCustomerCall, deleteCustomerCall;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.postChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 1:
                        token = _b.sent();
                        _a = getCustomersFromConfig(config), _ = _a[0], customerValues = _a[1];
                        putCustomerCall = {
                            request: new node_fetch_1.Request(this.context.expects.kycServerUrl + "/customer", {
                                method: "PUT",
                                headers: {
                                    Authorization: "Bearer " + token,
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify(__assign({ account: clientKeypair.publicKey() }, customerValues[3]))
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(putCustomerCall, 202, result, "application/json")];
                    case 2:
                        putCustomerBody = _b.sent();
                        if (!putCustomerBody)
                            return [2 /*return*/, result];
                        getCustomerCall = {
                            request: new node_fetch_1.Request(this.context.expects.kycServerUrl +
                                ("/customer?account=" + clientKeypair.publicKey()), {
                                headers: {
                                    Authorization: "Bearer " + token
                                }
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(getCustomerCall, 200, result)];
                    case 3:
                        _b.sent();
                        if (result.failure)
                            return [2 /*return*/, result];
                        deleteCustomerCall = {
                            request: new node_fetch_1.Request(this.context.expects.kycServerUrl +
                                ("/customer/" + clientKeypair.publicKey()), {
                                method: "DELETE",
                                headers: {
                                    Authorization: "Bearer " + token
                                }
                            })
                        };
                        return [4 /*yield*/, request_1.makeRequest(deleteCustomerCall, 200, result)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
exports["default"] = [requiresJwtToken, canDeleteCustomer];
