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
exports.postChallenge = exports.getChallenge = exports.postChallengeFailureModes = exports.getChallengeFailureModes = exports.friendBot = exports.friendbotFailureModes = void 0;
var stellar_sdk_1 = require("stellar-sdk");
var node_fetch_1 = require("node-fetch");
var node_fetch_2 = require("node-fetch");
var jsonwebtoken_1 = require("jsonwebtoken");
var jsonschema_1 = require("jsonschema");
var failure_1 = require("./failure");
var sep10_1 = require("../schemas/sep10");
exports.friendbotFailureModes = {
    FRIENDBOT_CONNECTION_ERROR: {
        name: "connection error",
        text: function (_args) {
            return ("A connection error occured when trying to fund a " +
                "testnet account using friendbot");
        }
    },
    FRIENDBOT_UNEXPECTED_STATUS_CODE: {
        name: "unexpected status code",
        text: function (_args) {
            return "A 200 Success code is expected for friendbot requests";
        }
    }
};
var friendBot = function (account, result) { return __awaiter(void 0, void 0, void 0, function () {
    var friendBotNetworkCall, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                friendBotNetworkCall = {
                    request: new node_fetch_2.Request("https://friendbot.stellar.org/?addr=" + account)
                };
                result.networkCalls.push(friendBotNetworkCall);
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                _a = friendBotNetworkCall;
                return [4 /*yield*/, node_fetch_1["default"](friendBotNetworkCall.request.clone())];
            case 2:
                _a.response = _c.sent();
                return [3 /*break*/, 4];
            case 3:
                _b = _c.sent();
                result.failure = failure_1.makeFailure(exports.friendbotFailureModes.FRIENDBOT_CONNECTION_ERROR);
                return [2 /*return*/];
            case 4:
                if (friendBotNetworkCall.response.status !== 200) {
                    result.failure = failure_1.makeFailure(exports.friendbotFailureModes.FRIENDBOT_UNEXPECTED_STATUS_CODE);
                    return [2 /*return*/];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.friendBot = friendBot;
exports.getChallengeFailureModes = {
    NO_TOML: {
        name: "no TOML file",
        text: function (_args) {
            return "Unable to fetch TOML";
        }
    },
    NO_WEB_AUTH_ENDPOINT: {
        name: "no WEB_AUTH_ENDPOINT",
        text: function (_args) {
            return "No WEB_AUTH_ENDPOINT in TOML file";
        }
    },
    CONNECTION_ERROR: {
        name: "connection error",
        text: function (args) {
            return ("A connection failure occured when making a request to: " +
                ("\n\n" + args.url + "\n\n") +
                "Make sure that CORS is enabled.");
        }
    },
    UNEXPECTED_STATUS_CODE: {
        name: "unexpected status code",
        text: function (_args) {
            return "200 Success is expected for valid requests";
        }
    },
    BAD_CONTENT_TYPE: {
        name: "bad content type",
        text: function (_args) {
            return "Content-Type headers for responses must be 'application/json'";
        }
    },
    NO_TRANSACTION: {
        name: "missing 'transaction' field",
        text: function (_args) {
            return ("GET /auth response bodies must include a 'transaction' attribute containing a challenge transaction." +
                "See here for more information:\n\n" +
                "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response");
        }
    },
    DESERIALIZATION_FAILED: {
        name: "transaction deserialization failed",
        text: function (args) {
            return ("Unable to decode the 'transaction' value:\n\n. " +
                (args.transaction + "\n\n") +
                ("With network passphrase: " + args.networkPassphrase + "\n\n") +
                "'transaction' must be a base64-encoded string of the Stellar transaction XDR.");
        }
    },
    INVALID_TRANSACTION_TYPE: {
        name: "invalid transaction type",
        text: function (_args) {
            return "FeeBumpTransactions are not valid challenge transactions";
        }
    },
    NONZERO_SEQUENCE_NUMBER: {
        name: "non-zero sequence number",
        text: function (_args) {
            return ("Challenge transaction must have a sequence number of 0. See the documentation:\n\n" +
                "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md#response");
        }
    }
};
exports.postChallengeFailureModes = __assign({ NO_TOKEN: {
        name: "no token",
        text: function (_args) {
            return "A 'token' attribute must be present in responses to valid POST /auth requests";
        }
    }, JWT_DECODE_FAILURE: {
        name: "JWT decode failure",
        text: function (args) {
            return ("Unable to decode the JWT.\n\n" +
                ("The jsonwebtoken library returned: " + args.error));
        }
    }, JWT_NOT_JSON: {
        name: "JWT contents is not JSON",
        text: function (_args) {
            return "jsonwebtoken was unable to parse the JWT's contents as JSON";
        }
    }, INVALID_JWT_SCHEMA: {
        name: "invalid JWT content schema",
        text: function (args) {
            return "" + args.errors;
        }
    }, INVALID_JWT_SUB: {
        name: "invalid jwt 'sub' attribute",
        text: function (_args) {
            return ("The 'sub' attribute must be the public key of the account " +
                "authenticating via SEP-10 - the client's public key.");
        }
    } }, exports.getChallengeFailureModes);
function getChallenge(clientKeypair, webAuthEndpoint, networkPassphrase, result) {
    return __awaiter(this, void 0, void 0, function () {
        var getAuthCall, _a, _b, getAuthContentType, responseBody, challenge;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!webAuthEndpoint) {
                        result.failure = failure_1.makeFailure(exports.getChallengeFailureModes.NO_WEB_AUTH_ENDPOINT);
                        return [2 /*return*/];
                    }
                    getAuthCall = {
                        request: new node_fetch_2.Request(webAuthEndpoint + ("?account=" + clientKeypair.publicKey()))
                    };
                    result.networkCalls.push(getAuthCall);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    _a = getAuthCall;
                    return [4 /*yield*/, node_fetch_1["default"](getAuthCall.request.clone())];
                case 2:
                    _a.response = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _b = _c.sent();
                    result.failure = failure_1.makeFailure(exports.getChallengeFailureModes.CONNECTION_ERROR, {
                        url: getAuthCall.request.url
                    });
                    return [2 /*return*/];
                case 4:
                    if (getAuthCall.response.status !== 200) {
                        result.failure = failure_1.makeFailure(exports.getChallengeFailureModes.UNEXPECTED_STATUS_CODE);
                        result.expected = 200;
                        result.actual = getAuthCall.response.status;
                        return [2 /*return*/];
                    }
                    getAuthContentType = getAuthCall.response.headers.get("Content-Type");
                    if (!getAuthContentType || !getAuthContentType.includes("application/json")) {
                        result.failure = failure_1.makeFailure(exports.getChallengeFailureModes.BAD_CONTENT_TYPE);
                        result.expected = "application/json";
                        if (getAuthContentType)
                            result.actual = getAuthContentType;
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getAuthCall.response.clone().json()];
                case 5:
                    responseBody = _c.sent();
                    if (!responseBody.transaction) {
                        result.failure = failure_1.makeFailure(exports.getChallengeFailureModes.NO_TRANSACTION);
                        return [2 /*return*/];
                    }
                    try {
                        challenge = stellar_sdk_1.TransactionBuilder.fromXDR(responseBody.transaction, networkPassphrase);
                    }
                    catch (_d) {
                        result.failure = failure_1.makeFailure(exports.getChallengeFailureModes.DESERIALIZATION_FAILED, {
                            transaction: responseBody.transaction,
                            networkPassphrase: networkPassphrase
                        });
                        return [2 /*return*/];
                    }
                    if (challenge instanceof stellar_sdk_1.FeeBumpTransaction) {
                        result.failure = failure_1.makeFailure(exports.getChallengeFailureModes.INVALID_TRANSACTION_TYPE);
                        return [2 /*return*/];
                    }
                    else if (challenge.sequence !== "0") {
                        result.failure = failure_1.makeFailure(exports.getChallengeFailureModes.NONZERO_SEQUENCE_NUMBER);
                        return [2 /*return*/];
                    }
                    return [2 /*return*/, challenge];
            }
        });
    });
}
exports.getChallenge = getChallenge;
function postChallenge(clientKeypair, webAuthEndpoint, networkPassphrase, result, useJson, challenge) {
    if (useJson === void 0) { useJson = false; }
    return __awaiter(this, void 0, void 0, function () {
        var request, postAuthCall, _a, _b, postAuthResponseContentType, responseBody, jwtContents, validatorResult;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!!challenge) return [3 /*break*/, 2];
                    return [4 /*yield*/, getChallenge(clientKeypair, webAuthEndpoint, networkPassphrase, result)];
                case 1:
                    challenge = (_c.sent());
                    if (!challenge)
                        return [2 /*return*/];
                    challenge.sign(clientKeypair);
                    _c.label = 2;
                case 2:
                    if (useJson) {
                        request = new node_fetch_2.Request(webAuthEndpoint, {
                            method: "POST",
                            body: JSON.stringify({ transaction: challenge.toXDR() }),
                            headers: { "Content-Type": "application/json" }
                        });
                    }
                    else {
                        request = new node_fetch_2.Request(webAuthEndpoint, {
                            method: "POST",
                            body: "transaction=" + encodeURIComponent(challenge.toXDR()),
                            headers: { "Content-Type": "application/x-www-form-urlencoded" }
                        });
                    }
                    postAuthCall = { request: request };
                    result.networkCalls.push(postAuthCall);
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    _a = postAuthCall;
                    return [4 /*yield*/, node_fetch_1["default"](postAuthCall.request.clone())];
                case 4:
                    _a.response = _c.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _b = _c.sent();
                    result.failure = failure_1.makeFailure(exports.postChallengeFailureModes.CONNECTION_ERROR, {
                        url: postAuthCall.request.url
                    });
                    return [2 /*return*/];
                case 6:
                    if (postAuthCall.response.status !== 200) {
                        result.failure = failure_1.makeFailure(exports.postChallengeFailureModes.UNEXPECTED_STATUS_CODE);
                        result.expected = 200;
                        result.actual = postAuthCall.response.status;
                        return [2 /*return*/];
                    }
                    postAuthResponseContentType = postAuthCall.response.headers.get("Content-Type");
                    if (!postAuthResponseContentType ||
                        !postAuthResponseContentType.includes("application/json")) {
                        result.failure = failure_1.makeFailure(exports.postChallengeFailureModes.BAD_CONTENT_TYPE);
                        result.expected = "application/json";
                        if (postAuthResponseContentType)
                            result.actual = postAuthResponseContentType;
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, postAuthCall.response.clone().json()];
                case 7:
                    responseBody = _c.sent();
                    if (!responseBody.token) {
                        result.failure = failure_1.makeFailure(exports.postChallengeFailureModes.NO_TOKEN);
                        return [2 /*return*/];
                    }
                    try {
                        jwtContents = jsonwebtoken_1.decode(responseBody.token);
                    }
                    catch (e) {
                        result.failure = failure_1.makeFailure(exports.postChallengeFailureModes.JWT_DECODE_FAILURE, {
                            error: e.message
                        });
                        return [2 /*return*/];
                    }
                    if (!jwtContents || typeof jwtContents !== "object") {
                        result.failure = failure_1.makeFailure(exports.postChallengeFailureModes.JWT_NOT_JSON);
                        return [2 /*return*/];
                    }
                    validatorResult = jsonschema_1.validate(jwtContents, sep10_1.jwtSchema);
                    if (validatorResult.errors.length !== 0) {
                        result.failure = failure_1.makeFailure(exports.postChallengeFailureModes.INVALID_JWT_SCHEMA, {
                            errors: validatorResult.errors.join("\n")
                        });
                        return [2 /*return*/];
                    }
                    try {
                        stellar_sdk_1.Keypair.fromPublicKey(jwtContents.sub);
                    }
                    catch (_d) {
                        result.failure = failure_1.makeFailure(exports.postChallengeFailureModes.INVALID_JWT_SUB);
                        return [2 /*return*/];
                    }
                    return [2 /*return*/, responseBody.token];
            }
        });
    });
}
exports.postChallenge = postChallenge;
