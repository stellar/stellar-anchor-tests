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
exports.returnsValidJwt = exports.hasWebAuthEndpoint = void 0;
var stellar_sdk_1 = require("stellar-sdk");
var node_fetch_1 = require("node-fetch");
var node_fetch_2 = require("node-fetch");
var url_1 = require("url");
var request_1 = require("../../helpers/request");
var failure_1 = require("../../helpers/failure");
var horizon_1 = require("../../helpers/horizon");
var sep10_1 = require("../../helpers/sep10");
var tests_1 = require("../sep1/tests");
var tomlTests = "TOML Tests";
var getAuthGroup = "GET /auth";
var postAuthGroup = "POST /auth";
var signerSupportGroup = "Account Signer Support";
var tests = [];
exports.hasWebAuthEndpoint = {
    assertion: "has a valid WEB_AUTH_ENDPOINT in the TOML file",
    sep: 10,
    group: tomlTests,
    dependencies: [tests_1.tomlExists],
    failureModes: {
        NOT_FOUND: {
            name: "not found",
            text: function (_args) {
                return "The TOML file does not have a WEB_AUTH_ENDPOINT attribute";
            }
        },
        NO_HTTPS: {
            name: "no https",
            text: function (_args) {
                return "The WEB_AUTH_ENDPOINT must use HTTPS";
            }
        },
        ENDS_WITH_SLASH: {
            name: "ends with slash",
            text: function (_args) {
                return "WEB_AUTH_ENDPOINT cannot end with a '/'";
            }
        }
    },
    context: {
        expects: {
            tomlObj: undefined
        },
        provides: {
            webAuthEndpoint: undefined
        }
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                if (!this.context.expects.tomlObj.WEB_AUTH_ENDPOINT) {
                    result.failure = failure_1.makeFailure(this.failureModes.NOT_FOUND);
                    return [2 /*return*/, result];
                }
                if (!this.context.expects.tomlObj.WEB_AUTH_ENDPOINT.startsWith("https")) {
                    result.failure = failure_1.makeFailure(this.failureModes.NO_HTTPS);
                    return [2 /*return*/, result];
                }
                this.context.provides.webAuthEndpoint = this.context.expects.tomlObj.WEB_AUTH_ENDPOINT;
                if (this.context.expects.tomlObj.WEB_AUTH_ENDPOINT.slice(-1) === "/") {
                    this.context.provides.webAuthEndpoint = this.context.provides.webAuthEndpoint.slice(0, -1);
                    result.failure = failure_1.makeFailure(this.failureModes.ENDS_WITH_SLASH);
                    return [2 /*return*/, result];
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(exports.hasWebAuthEndpoint);
var hasSigningKey = {
    assertion: "has valid SIGNING_KEY",
    sep: 10,
    group: tomlTests,
    dependencies: [tests_1.tomlExists],
    failureModes: {
        SIGNING_KEY_NOT_FOUND: {
            name: "SIGNING_KEY not found",
            text: function (_args) {
                return ("A SIGNING_KEY attribute is required in stellar.toml files for SEP-10.\n" +
                    "The value is the public key of the keypair used to sign SEP-10 challenge transactions.");
            }
        },
        INVALID_SIGNING_KEY: {
            name: "invalid SIGNING_KEY",
            text: function (_args) {
                return ("The SIGNING_KEY is not a valid Stellar keypair public key." +
                    "See the documentation for more information:\n\n" +
                    "https://developers.stellar.org/docs/glossary/accounts/#keypair");
            }
        }
    },
    context: {
        expects: {
            tomlObj: undefined
        },
        provides: {}
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                if (!this.context.expects.tomlObj.SIGNING_KEY) {
                    result.failure = failure_1.makeFailure(this.failureModes.SIGNING_KEY_NOT_FOUND);
                    return [2 /*return*/, result];
                }
                try {
                    stellar_sdk_1.Keypair.fromPublicKey(this.context.expects.tomlObj.SIGNING_KEY).publicKey();
                }
                catch (_b) {
                    result.failure = failure_1.makeFailure(this.failureModes.INVALID_SIGNING_KEY);
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(hasSigningKey);
var returnsValidChallengeResponse = {
    assertion: "returns a valid GET /auth response",
    sep: 10,
    group: getAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    failureModes: {
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
                return "Responses must return a 200 status for valid requests.";
            }
        },
        BAD_CONTENT_TYPE: {
            name: "bad content type",
            text: function (_args) {
                return "Content-Type headers for GET /auth responses must be 'application/json'";
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
        UNRECOGNIZED_RESPONSE_ATTRIBUTE: {
            name: "unrecognized response attribute",
            text: function (args) {
                return ("An unrecognized response attribute(s) were included in the response: " + args.attributes + "." +
                    "The accepted attributes are 'transaction' and `network_passphrase'.");
            }
        },
        UNRECOGNIZED_NETWORK_PASSPHRASE: {
            name: "unrecognized network passphrase",
            text: function (args) {
                return ("This tool only supports testing anchors on the test and public networks.\n\n" +
                    ("Testnet passphrase: " + args.testnet) +
                    ("Pubnet passphrase: " + args.pubnet) +
                    ("Got passphrase: " + args.passphrase));
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
        },
        SOURCE_ACCOUNT_NOT_SIGNING_KEY: {
            name: "source account doesn't match signing key",
            text: function (_args) {
                return "Challenge transactions must have a source account matching the SIGNING_KEY in the TOML file.";
            }
        },
        MIN_TIME_TOO_EARLY: {
            name: "minumum timebound too early",
            text: function (_args) {
                return "The challenge transaction's minumum timebound is before the request for the challenge was made.";
            }
        },
        MIN_TIME_TOO_LATE: {
            name: "minimum timebound too late",
            text: function (_args) {
                return "The challenge transaction's minimum timebound is after the challenge was received.";
            }
        },
        NO_MAX_TIME: {
            name: "no maximum timebound",
            text: function (_args) {
                return ("The challenge transaction's maximum timebound was not set. " +
                    "15 minutes from when the challenge was issued is recommended.");
            }
        },
        FIRST_OP_NOT_MANAGE_DATA: {
            name: "first operation not of type ManageData",
            text: function (_args) {
                return "The first operation of a challenge transaction must be of type ManageData.";
            }
        },
        HOME_DOMAIN_NOT_IN_OP_KEY: {
            name: "home domain not found in first operation's key",
            text: function (_args) {
                return ("The first operation within a challenge transaction must be a ManageData operation with a key matching " +
                    "'<home domain> auth', where the home domain is the domain hosting the TOML file.");
            }
        },
        INVALID_FIRST_OP_VALUE: {
            name: "invalid first operation key value",
            text: function (_args) {
                return "The value of the challenge's first ManageData operation must be a base64-encoded string of 48 bytes";
            }
        },
        NO_WEB_AUTH_DOMAIN_OP: {
            name: "no ManageData operation containing 'web_auth_domain'",
            text: function (_args) {
                return ("Challenge transactions must contain a ManageData operation where the key is 'web_auth_domain'" +
                    " and value is the domain of the service issuing the challenge transaction.");
            }
        },
        INVALID_WEB_AUTH_DOMAIN: {
            name: "invalid 'web_auth_domain' value",
            text: function (_args) {
                return "The 'web_auth_domain' value must be the WEB_AUTH_ENDPOINT domain.";
            }
        },
        INCLUDES_NON_MANAGE_DATA_OP: {
            name: "non-ManageData operation included",
            text: function (_args) {
                return "All operations within a challenge transaction must be of type ManageData";
            }
        },
        INVALID_OP_SOURCE: {
            name: "invalid operation source",
            text: function (_args) {
                return "Exluding the first, all operation source accounts must be the SIGNING_KEY";
            }
        },
        MISSING_SERVER_SIGNATURE: {
            name: "no signature on challenge transaction",
            text: function (_args) {
                return "Challenge transactions must be signed by the SIGNING_KEY from the TOML file.";
            }
        },
        INVALID_SERVER_SIGNATURE: {
            name: "invalid transaction signature",
            text: function (_args) {
                return "The signature on the challenge transaction must be from the TOML's SIGNING_KEY";
            }
        },
        UNEXPECTED_SIGNATURES: {
            name: "unexpected transaction signature(s)",
            text: function (_args) {
                return "Only one signature from SIGNING_KEY is accepted on challenge transactions.";
            }
        }
    },
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, getAuthCall, timeBeforeCall, responseBody, timeAfterCall, responseKeys, challenge, firstOpDataValue, webAuthDomainOp, _i, _a, op, expectedWebAuthDomain;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        getAuthCall = {
                            request: new node_fetch_2.Request(this.context.expects.webAuthEndpoint +
                                ("?account=" + clientKeypair.publicKey()))
                        };
                        result.networkCalls.push(getAuthCall);
                        timeBeforeCall = Math.floor(Date.now() / 1000);
                        return [4 /*yield*/, request_1.makeRequest(getAuthCall, 200, result, "application/json")];
                    case 1:
                        responseBody = _b.sent();
                        timeAfterCall = Math.floor(Date.now() / 1000);
                        if (!responseBody.transaction) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_TRANSACTION);
                            return [2 /*return*/, result];
                        }
                        if (![undefined, stellar_sdk_1.Networks.PUBLIC, stellar_sdk_1.Networks.TESTNET].includes(responseBody.network_passphrase)) {
                            result.failure = failure_1.makeFailure(this.failureModes.UNRECOGNIZED_NETWORK_PASSPHRASE, {
                                pubnet: stellar_sdk_1.Networks.PUBLIC,
                                testnet: stellar_sdk_1.Networks.TESTNET,
                                passphrase: responseBody.network_passphrase
                            });
                            return [2 /*return*/, result];
                        }
                        responseKeys = Object.keys(responseBody);
                        if ((responseBody.network_passphrase && responseKeys.length > 2) ||
                            (!responseBody.network_passphrase && responseKeys.length > 1)) {
                            result.failure = failure_1.makeFailure(this.failureModes.UNRECOGNIZED_RESPONSE_ATTRIBUTE, {
                                attributes: responseKeys.filter(function (attr) { return !["transaction", "network_passphrase"].includes(attr); })
                            });
                        }
                        try {
                            challenge = stellar_sdk_1.TransactionBuilder.fromXDR(responseBody.transaction, this.context.expects.tomlObj.NETWORK_PASSPHRASE);
                        }
                        catch (_c) {
                            result.failure = failure_1.makeFailure(this.failureModes.DESERIALIZATION_FAILED, {
                                transaction: responseBody.transaction,
                                networkPassphrase: this.context.expects.tomlObj.NETWORK_PASSPHRASE
                            });
                            return [2 /*return*/, result];
                        }
                        if (challenge instanceof stellar_sdk_1.FeeBumpTransaction) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_TRANSACTION_TYPE);
                            return [2 /*return*/, result];
                        }
                        else if (challenge.sequence !== "0") {
                            result.failure = failure_1.makeFailure(this.failureModes.NONZERO_SEQUENCE_NUMBER);
                            result.expected = "0";
                            result.actual = challenge.sequence;
                            return [2 /*return*/, result];
                        }
                        else if (challenge.source !== this.context.expects.tomlObj.SIGNING_KEY) {
                            result.failure = failure_1.makeFailure(this.failureModes.SOURCE_ACCOUNT_NOT_SIGNING_KEY);
                            result.expected = this.context.expects.tomlObj.SIGNING_KEY;
                            result.actual = challenge.source;
                            return [2 /*return*/, result];
                        }
                        else if (!challenge.timeBounds || !challenge.timeBounds.maxTime) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_MAX_TIME);
                            return [2 /*return*/, result];
                        }
                        else if (challenge.timeBounds.minTime < timeBeforeCall.toString()) {
                            result.failure = failure_1.makeFailure(this.failureModes.MIN_TIME_TOO_EARLY);
                            return [2 /*return*/, result];
                        }
                        else if (challenge.timeBounds.minTime > timeAfterCall.toString()) {
                            result.failure = failure_1.makeFailure(this.failureModes.MIN_TIME_TOO_LATE);
                            return [2 /*return*/, result];
                        }
                        else if (challenge.operations[0].type !== "manageData") {
                            result.failure = failure_1.makeFailure(this.failureModes.FIRST_OP_NOT_MANAGE_DATA);
                            return [2 /*return*/, result];
                        }
                        else if (challenge.operations[0].name !== new url_1.URL(config.homeDomain).host + " auth") {
                            result.failure = failure_1.makeFailure(this.failureModes.HOME_DOMAIN_NOT_IN_OP_KEY);
                            result.expected = new url_1.URL(config.homeDomain).host + " auth";
                            result.actual = challenge.operations[0].name;
                            return [2 /*return*/, result];
                        }
                        firstOpDataValue = challenge.operations[0].value;
                        if (!firstOpDataValue ||
                            Buffer.from(firstOpDataValue.toString(), "base64").length !== 48) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_FIRST_OP_VALUE);
                            if (firstOpDataValue)
                                console.log(firstOpDataValue.length);
                            return [2 /*return*/, result];
                        }
                        for (_i = 0, _a = challenge.operations.slice(1); _i < _a.length; _i++) {
                            op = _a[_i];
                            if (op.type !== "manageData") {
                                result.failure = failure_1.makeFailure(this.failureModes.INCLUDES_NON_MANAGE_DATA_OP);
                                return [2 /*return*/, result];
                            }
                            else if (op.source !== this.context.expects.tomlObj.SIGNING_KEY) {
                                result.failure = failure_1.makeFailure(this.failureModes.INVALID_OP_SOURCE);
                                result.expected = this.context.expects.tomlObj.SIGNING_KEY;
                                result.actual = op.source;
                                return [2 /*return*/, result];
                            }
                            else if (op.name === "web_auth_domain") {
                                expectedWebAuthDomain = new url_1.URL(this.context.expects.webAuthEndpoint).host;
                                if (!op.value || op.value.compare(Buffer.from(expectedWebAuthDomain))) {
                                    result.failure = failure_1.makeFailure(this.failureModes.INVALID_WEB_AUTH_DOMAIN);
                                    result.expected = expectedWebAuthDomain;
                                    if (op.value)
                                        result.actual = op.value.toString();
                                    return [2 /*return*/, result];
                                }
                                webAuthDomainOp = op;
                            }
                        }
                        if (!webAuthDomainOp) {
                            result.failure = failure_1.makeFailure(this.failureModes.NO_WEB_AUTH_DOMAIN_OP);
                            return [2 /*return*/, result];
                        }
                        if (challenge.signatures.length !== 1) {
                            result.failure = failure_1.makeFailure(this.failureModes.UNEXPECTED_SIGNATURES);
                            return [2 /*return*/, result];
                        }
                        if (!stellar_sdk_1.Utils.verifyTxSignedBy(challenge, this.context.expects.tomlObj.SIGNING_KEY)) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_SERVER_SIGNATURE);
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(returnsValidChallengeResponse);
var noAccount = {
    assertion: "rejects requests with no 'account' parameter",
    sep: 10,
    group: getAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    failureModes: {
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
                return "400 Bad Request is expected for requests without an 'account' parameter";
            }
        },
        INVALID_ERROR_SCHEMA: {
            name: "invalid error schema",
            text: function (_args) {
                return "Error responses must contain an 'error' key and string value";
            }
        },
        BAD_CONTENT_TYPE: {
            name: "bad content type",
            text: function (_args) {
                return "Content-Type headers for GET /auth responses must be 'application/json'";
            }
        }
    },
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getAuthCall, responseBody;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getAuthCall = {
                            request: new node_fetch_2.Request(this.context.expects.webAuthEndpoint)
                        };
                        result.networkCalls.push(getAuthCall);
                        return [4 /*yield*/, request_1.makeRequest(getAuthCall, 400, result, "application/json")];
                    case 1:
                        responseBody = _a.sent();
                        if (!responseBody)
                            return [2 /*return*/, result];
                        if (!responseBody.error ||
                            !(typeof responseBody.error === "string" ||
                                responseBody.error instanceof String)) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_ERROR_SCHEMA);
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(noAccount);
var invalidAccount = {
    assertion: "rejects requests with an invalid 'account' parameter",
    sep: 10,
    group: getAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    failureModes: noAccount.failureModes,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getAuthCall, responseBody;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getAuthCall = {
                            request: new node_fetch_2.Request(this.context.expects.webAuthEndpoint + "?account=invalid-account")
                        };
                        result.networkCalls.push(getAuthCall);
                        return [4 /*yield*/, request_1.makeRequest(getAuthCall, 400, result, "application/json")];
                    case 1:
                        responseBody = _a.sent();
                        if (!responseBody)
                            return [2 /*return*/, result];
                        if (!responseBody.error ||
                            !(typeof responseBody.error === "string" ||
                                responseBody.error instanceof String)) {
                            result.failure = failure_1.makeFailure(this.failureModes.INVALID_ERROR_SCHEMA);
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(invalidAccount);
exports.returnsValidJwt = {
    assertion: "returns a valid JWT",
    sep: 10,
    group: postAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {
            token: undefined,
            clientKeypair: undefined
        }
    },
    failureModes: sep10_1.postChallengeFailureModes,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        result = { networkCalls: [] };
                        this.context.provides.clientKeypair = stellar_sdk_1.Keypair.random();
                        _a = this.context.provides;
                        return [4 /*yield*/, sep10_1.postChallenge(this.context.provides.clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 1:
                        _a.token = _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(exports.returnsValidJwt);
var acceptsJson = {
    assertion: "accepts JSON requests",
    sep: 10,
    group: postAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    failureModes: sep10_1.postChallengeFailureModes,
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.postChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result, true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(acceptsJson);
var postAuthBadRequest = function (result, webAuthEndpoint, requestBody, failureText) { return __awaiter(void 0, void 0, void 0, function () {
    var postAuthRequest, postAuthCall, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                postAuthRequest = new node_fetch_2.Request(webAuthEndpoint, {
                    method: "POST",
                    body: JSON.stringify(requestBody),
                    headers: { "Content-Type": "application/json" }
                });
                postAuthCall = { request: postAuthRequest };
                result.networkCalls.push(postAuthCall);
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                _a = postAuthCall;
                return [4 /*yield*/, node_fetch_1["default"](postAuthCall.request.clone())];
            case 2:
                _a.response = _c.sent();
                return [3 /*break*/, 4];
            case 3:
                _b = _c.sent();
                result.failure = failure_1.makeFailure(sep10_1.postChallengeFailureModes.CONNECTION_ERROR, {
                    url: postAuthCall.request.url
                });
                return [2 /*return*/, result];
            case 4:
                if (postAuthCall.response.status !== 400) {
                    result.failure = {
                        name: "unexpected status code",
                        text: function (_args) {
                            return failureText;
                        },
                        message: failureText
                    };
                    result.expected = 400;
                    result.actual = postAuthCall.response.status;
                    return [2 /*return*/, result];
                }
                return [2 /*return*/, result];
        }
    });
}); };
var failsWithNoBody = {
    assertion: "fails with no 'transaction' key in the body",
    sep: 10,
    group: postAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    failureModes: {
        CONNECTION_ERROR: sep10_1.getChallengeFailureModes.CONNECTION_ERROR,
        POST_AUTH_UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return ("A 400 Bad Request is expected for requests with no " +
                    "'transaction' attribute in the body.");
            }
        }
    },
    context: {
        expects: {
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        return [4 /*yield*/, postAuthBadRequest(result, this.context.expects.webAuthEndpoint, {}, this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE.text())];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
};
tests.push(failsWithNoBody);
var failsWithNoClientSignature = {
    assertion: "fails if the challenge is not signed by the client",
    sep: 10,
    group: postAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    failureModes: __assign({ POST_AUTH_UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return ("A 400 Bad Request is expected if the challenge " +
                    " is not signed by the client.");
            }
        } }, sep10_1.getChallengeFailureModes),
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, challenge;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.getChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 1:
                        challenge = _a.sent();
                        if (!challenge)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, postAuthBadRequest(result, this.context.expects.webAuthEndpoint, { transaction: challenge.toXDR() }, this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE.text())];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
};
tests.push(failsWithNoClientSignature);
var failsWithInvalidTransactionValue = {
    assertion: "fails if the 'transaction' value is invalid",
    sep: 10,
    group: postAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    failureModes: {
        CONNECTION_ERROR: sep10_1.getChallengeFailureModes.CONNECTION_ERROR,
        POST_AUTH_UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return ("A 400 Bad Request is expected if the 'transaction' " +
                    " value is not a base64-encoded transaction string.");
            }
        }
    },
    context: {
        expects: {
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        return [4 /*yield*/, postAuthBadRequest(result, this.context.expects.webAuthEndpoint, { transaction: { "not a transaction string": true } }, this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE.text())];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
};
tests.push(failsWithInvalidTransactionValue);
var failsIfChallengeNotSignedByServer = {
    assertion: "fails if the challenge is not signed by SIGNING_KEY",
    sep: 10,
    group: postAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    failureModes: {
        CONNECTION_ERROR: sep10_1.getChallengeFailureModes.CONNECTION_ERROR,
        POST_AUTH_UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return ("A 400 Bad Request is expected if the challenge " +
                    " is not signed by the SIGNING_KEY from the TOML.");
            }
        }
    },
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, anchorHost, challengeXdr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        anchorHost = new url_1.URL(config.homeDomain).host;
                        challengeXdr = stellar_sdk_1.Utils.buildChallengeTx(clientKeypair, clientKeypair.publicKey(), anchorHost, 15, this.context.expects.tomlObj.NETWORK_PASSPHRASE, anchorHost);
                        return [4 /*yield*/, postAuthBadRequest(result, this.context.expects.webAuthEndpoint, { transaction: challengeXdr }, this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE.text())];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
};
tests.push(failsIfChallengeNotSignedByServer);
var extraClientSigners = {
    assertion: "fails if a challenge for a nonexistent account has extra client signatures",
    sep: 10,
    group: postAuthGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    failureModes: __assign({ POST_AUTH_UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return "A 400 Bad Request is expected if the challenge has extra signatures.";
            }
        } }, sep10_1.getChallengeFailureModes),
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, challenge;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.getChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 1:
                        challenge = _a.sent();
                        if (!challenge)
                            return [2 /*return*/, result];
                        challenge.sign(clientKeypair);
                        challenge.sign(stellar_sdk_1.Keypair.random());
                        return [4 /*yield*/, postAuthBadRequest(result, this.context.expects.webAuthEndpoint, { transaction: challenge.toXDR() }, this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE.text())];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
};
tests.push(extraClientSigners);
var failsIfWeighBelowMediumThreshold = {
    assertion: "fails if the challenge signature weight is less than the account's medium threshold",
    sep: 10,
    group: signerSupportGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    failureModes: __assign(__assign({ POST_AUTH_UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return ("A 400 Bad Request is expected if the signature weight on the challenge is not greater than " +
                    "or equal to the account's medium threshold.");
            }
        } }, sep10_1.getChallengeFailureModes), sep10_1.friendbotFailureModes),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, clientAccount, raiseThresoldsTx, horizonResponse, challenge;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.friendBot(clientKeypair.publicKey(), result)];
                    case 1:
                        _a.sent();
                        if (result.failure)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, horizon_1.loadAccount(clientKeypair.publicKey(), result)];
                    case 2:
                        clientAccount = _a.sent();
                        if (!clientAccount)
                            return [2 /*return*/, result];
                        raiseThresoldsTx = new stellar_sdk_1.TransactionBuilder(clientAccount, {
                            fee: "10000",
                            networkPassphrase: stellar_sdk_1.Networks.TESTNET
                        })
                            .addOperation(stellar_sdk_1.Operation.setOptions({
                            lowThreshold: 2,
                            medThreshold: 2,
                            highThreshold: 2
                        }))
                            .setTimeout(30)
                            .build();
                        raiseThresoldsTx.sign(clientKeypair);
                        return [4 /*yield*/, horizon_1.submitTransaction(raiseThresoldsTx.toXDR(), result)];
                    case 3:
                        horizonResponse = _a.sent();
                        if (!horizonResponse)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, sep10_1.getChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 4:
                        challenge = _a.sent();
                        if (!challenge)
                            return [2 /*return*/, result];
                        challenge.sign(clientKeypair);
                        return [4 /*yield*/, postAuthBadRequest(result, this.context.expects.webAuthEndpoint, { transaction: challenge.toXDR() }, this.failureModes.POST_AUTH_UNEXPECTED_STATUS_CODE.text())];
                    case 5: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
};
tests.push(failsIfWeighBelowMediumThreshold);
var signedByNonMasterSigner = {
    assertion: "succeeds with a signature from a non-master signer",
    sep: 10,
    group: signerSupportGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    failureModes: __assign(__assign({}, sep10_1.postChallengeFailureModes), { UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return ("Challenge transactions signed by non-master signer(s) with weight greater than " +
                    "or equal to the account's medium threshold are valid, but the request was rejected.");
            }
        } }),
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, clientSignerKeypair, clientAccount, raiseThresholdsTx, challenge;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        clientSignerKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.friendBot(clientKeypair.publicKey(), result)];
                    case 1:
                        _a.sent();
                        if (result.failure)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, horizon_1.loadAccount(clientKeypair.publicKey(), result)];
                    case 2:
                        clientAccount = _a.sent();
                        if (!clientAccount)
                            return [2 /*return*/, result];
                        raiseThresholdsTx = new stellar_sdk_1.TransactionBuilder(clientAccount, {
                            fee: "10000",
                            networkPassphrase: stellar_sdk_1.Networks.TESTNET
                        })
                            .addOperation(stellar_sdk_1.Operation.setOptions({
                            lowThreshold: 1,
                            medThreshold: 1,
                            highThreshold: 1,
                            signer: {
                                ed25519PublicKey: clientSignerKeypair.publicKey(),
                                weight: 1
                            }
                        }))
                            .setTimeout(30)
                            .build();
                        raiseThresholdsTx.sign(clientKeypair);
                        return [4 /*yield*/, horizon_1.submitTransaction(raiseThresholdsTx.toXDR(), result)];
                    case 3:
                        _a.sent();
                        if (result.failure)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, sep10_1.getChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 4:
                        challenge = _a.sent();
                        if (!challenge)
                            return [2 /*return*/, result];
                        challenge.sign(clientSignerKeypair);
                        return [4 /*yield*/, sep10_1.postChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result, false, challenge)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(signedByNonMasterSigner);
var failsWithDuplicateSignatures = {
    assertion: "fails for challenges signed more than once by the same signer",
    sep: 10,
    group: signerSupportGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    failureModes: __assign(__assign({}, sep10_1.postChallengeFailureModes), { UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return ("The weight of a signer's signature should only be used once when " +
                    "calculating the cumulative weight of the signatures on a challenge. " +
                    "Not checking for duplicate signatures enables a signer to get a " +
                    "token that can be used for operations the signer is not authenticated " +
                    "to perform without signatures from other signers.");
            }
        } }),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, clientSignerKeypair, clientAccount, raiseThresholdsTx, challenge;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        clientSignerKeypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.friendBot(clientKeypair.publicKey(), result)];
                    case 1:
                        _a.sent();
                        if (result.failure)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, horizon_1.loadAccount(clientKeypair.publicKey(), result)];
                    case 2:
                        clientAccount = _a.sent();
                        if (!clientAccount)
                            return [2 /*return*/, result];
                        raiseThresholdsTx = new stellar_sdk_1.TransactionBuilder(clientAccount, {
                            fee: "10000",
                            networkPassphrase: stellar_sdk_1.Networks.TESTNET
                        })
                            .addOperation(stellar_sdk_1.Operation.setOptions({
                            lowThreshold: 2,
                            medThreshold: 2,
                            highThreshold: 2,
                            signer: {
                                ed25519PublicKey: clientSignerKeypair.publicKey(),
                                weight: 1
                            }
                        }))
                            .setTimeout(30)
                            .build();
                        raiseThresholdsTx.sign(clientKeypair);
                        return [4 /*yield*/, horizon_1.submitTransaction(raiseThresholdsTx.toXDR(), result)];
                    case 3:
                        _a.sent();
                        if (result.failure)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, sep10_1.getChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 4:
                        challenge = _a.sent();
                        if (!challenge)
                            return [2 /*return*/, result];
                        challenge.sign(clientSignerKeypair);
                        challenge.sign(clientSignerKeypair);
                        return [4 /*yield*/, postAuthBadRequest(result, this.context.expects.webAuthEndpoint, { transaction: challenge.toXDR() }, this.failureModes.UNEXPECTED_STATUS_CODE.text())];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(failsWithDuplicateSignatures);
var multipleNonMasterSigners = {
    assertion: "returns a token for challenges with sufficient signatures from multiple non-master signers",
    sep: 10,
    group: signerSupportGroup,
    dependencies: [tests_1.tomlExists, exports.hasWebAuthEndpoint],
    context: {
        expects: {
            tomlObj: undefined,
            webAuthEndpoint: undefined
        },
        provides: {}
    },
    failureModes: __assign(__assign({}, sep10_1.postChallengeFailureModes), { UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return ("Challenges can be signed by multiple signers to reach the medium threshold of the account. " +
                    "However, the SEP-10 server did not return a token for such a challenge.");
            }
        } }),
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, clientKeypair, clientSignerKeypair, clientSigner2Keypair, clientAccount, raiseThresholdsTx, challenge;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = { networkCalls: [] };
                        clientKeypair = stellar_sdk_1.Keypair.random();
                        clientSignerKeypair = stellar_sdk_1.Keypair.random();
                        clientSigner2Keypair = stellar_sdk_1.Keypair.random();
                        return [4 /*yield*/, sep10_1.friendBot(clientKeypair.publicKey(), result)];
                    case 1:
                        _a.sent();
                        if (result.failure)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, horizon_1.loadAccount(clientKeypair.publicKey(), result)];
                    case 2:
                        clientAccount = _a.sent();
                        if (!clientAccount)
                            return [2 /*return*/, result];
                        raiseThresholdsTx = new stellar_sdk_1.TransactionBuilder(clientAccount, {
                            fee: "10000",
                            networkPassphrase: stellar_sdk_1.Networks.TESTNET
                        })
                            .addOperation(stellar_sdk_1.Operation.setOptions({
                            lowThreshold: 2,
                            medThreshold: 2,
                            highThreshold: 2,
                            signer: {
                                ed25519PublicKey: clientSignerKeypair.publicKey(),
                                weight: 1
                            }
                        }))
                            .addOperation(stellar_sdk_1.Operation.setOptions({
                            signer: {
                                ed25519PublicKey: clientSigner2Keypair.publicKey(),
                                weight: 1
                            }
                        }))
                            .setTimeout(30)
                            .build();
                        raiseThresholdsTx.sign(clientKeypair);
                        return [4 /*yield*/, horizon_1.submitTransaction(raiseThresholdsTx.toXDR(), result)];
                    case 3:
                        _a.sent();
                        if (result.failure)
                            return [2 /*return*/, result];
                        return [4 /*yield*/, sep10_1.getChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result)];
                    case 4:
                        challenge = _a.sent();
                        if (!challenge)
                            return [2 /*return*/, result];
                        challenge.sign(clientSignerKeypair);
                        challenge.sign(clientSigner2Keypair);
                        return [4 /*yield*/, sep10_1.postChallenge(clientKeypair, this.context.expects.webAuthEndpoint, this.context.expects.tomlObj.NETWORK_PASSPHRASE, result, false, challenge)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(multipleNonMasterSigners);
exports["default"] = tests;
