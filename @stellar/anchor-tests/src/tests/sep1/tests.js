"use strict";
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
exports.hasNetworkPassphrase = exports.tomlExists = void 0;
var stellar_sdk_1 = require("stellar-sdk");
var jsonschema_1 = require("jsonschema");
var toml_1 = require("toml");
var node_fetch_1 = require("node-fetch");
var node_fetch_2 = require("node-fetch");
var sep1_1 = require("../../schemas/sep1");
var failure_1 = require("../../helpers/failure");
var group = "TOML Tests";
var tests = [];
exports.tomlExists = {
    assertion: "the TOML file exists at ./well-known/stellar.toml",
    sep: 1,
    group: group,
    failureModes: {
        TOML_CONNECTION_ERROR: {
            name: "connection error",
            text: function (args) {
                return ("A connection failure occured when making a request to: " +
                    ("\n\n" + args.url + "\n\n") +
                    "Make sure that CORS is enabled.");
            }
        },
        TOML_UNEXPECTED_STATUS_CODE: {
            name: "unexpected status code",
            text: function (_args) {
                return "A HTTP 200 Success is expected for responses.";
            }
        },
        TOML_BAD_CONTENT_TYPE: {
            name: "bad content type",
            text: function (_args) {
                return ("HTTP responses containing TOML-formatted files must have a Content-Type " +
                    "header of 'application/toml' or 'text/plain'");
            }
        },
        TOML_PARSE_ERROR: {
            name: "parse error",
            text: function (args) {
                return ("stellar.toml files must comply with the TOML format specification\n\n" +
                    "https://toml.io/en/v1.0.0\n\nThe parsing library returned:\n\n" +
                    ("Line: " + args.line + "\nColumn: " + args.column + "\nError: " + args.message));
            }
        }
    },
    context: {
        expects: {},
        provides: {
            tomlObj: undefined,
            tomlContentBuffer: undefined
        }
    },
    run: function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, getTomlCall, _a, e_1, contentType, acceptedContentTypes, matched, _i, acceptedContentTypes_1, acceptedContentType, _b, _c, _d, e_2;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        result = { networkCalls: [] };
                        getTomlCall = {
                            request: new node_fetch_2.Request(config.homeDomain + "/.well-known/stellar.toml")
                        };
                        result.networkCalls.push(getTomlCall);
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        _a = getTomlCall;
                        return [4 /*yield*/, node_fetch_1["default"](getTomlCall.request.clone())];
                    case 2:
                        _a.response = _e.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _e.sent();
                        result.failure = failure_1.makeFailure(this.failureModes.TOML_CONNECTION_ERROR, {
                            homeDomain: config.homeDomain
                        });
                        return [2 /*return*/, result];
                    case 4:
                        if (getTomlCall.response.status !== 200) {
                            result.failure = failure_1.makeFailure(this.failureModes.TOML_UNEXPECTED_STATUS_CODE);
                            result.expected = 200;
                            result.actual = getTomlCall.response.status;
                            return [2 /*return*/, result];
                        }
                        contentType = getTomlCall.response.headers.get("Content-Type");
                        acceptedContentTypes = ["application/toml", "text/plain"];
                        matched = false;
                        for (_i = 0, acceptedContentTypes_1 = acceptedContentTypes; _i < acceptedContentTypes_1.length; _i++) {
                            acceptedContentType = acceptedContentTypes_1[_i];
                            if (contentType && contentType.includes(acceptedContentType)) {
                                matched = true;
                            }
                        }
                        if (!contentType || !matched) {
                            result.failure = failure_1.makeFailure(this.failureModes.TOML_BAD_CONTENT_TYPE);
                            result.expected = "'application/toml' or 'text/plain'";
                            if (contentType) {
                                result.actual = contentType;
                            }
                            else {
                                result.actual = "not found";
                            }
                            return [2 /*return*/, result];
                        }
                        _e.label = 5;
                    case 5:
                        _e.trys.push([5, 8, , 9]);
                        _b = this.context.provides;
                        return [4 /*yield*/, getTomlCall.response
                                .clone()
                                .arrayBuffer()];
                    case 6:
                        _b.tomlContentBuffer = _e.sent();
                        _c = this.context.provides;
                        _d = toml_1.parse;
                        return [4 /*yield*/, getTomlCall.response.clone().text()];
                    case 7:
                        _c.tomlObj = _d.apply(void 0, [_e.sent()]);
                        return [3 /*break*/, 9];
                    case 8:
                        e_2 = _e.sent();
                        result.failure = failure_1.makeFailure(this.failureModes.TOML_PARSE_ERROR, {
                            message: e_2.message,
                            line: e_2.line,
                            column: e_2.column
                        });
                        return [2 /*return*/, result];
                    case 9: return [2 /*return*/, result];
                }
            });
        });
    }
};
tests.push(exports.tomlExists);
var validFileSize = {
    assertion: "the file has a size less than 100KB",
    group: group,
    sep: 1,
    dependencies: [exports.tomlExists],
    context: {
        expects: {
            tomlContentBuffer: undefined
        },
        provides: {}
    },
    failureModes: {
        MAX_SIZE_EXCEEDED: {
            name: "max file sized exceeded",
            text: function (args) {
                return "The max file size is 100KB, but the file is " + args.kb;
            }
        }
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                if (this.context.expects.tomlContentBuffer.byteLength > 100000) {
                    result.failure = failure_1.makeFailure(this.failureModes.MAX_SIZE_EXCEEDED, {
                        kb: this.context.expects.tomlContentBuffer.byteLength / 1000
                    });
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(validFileSize);
exports.hasNetworkPassphrase = {
    assertion: "has a valid network passphrase",
    group: group,
    sep: 1,
    dependencies: [exports.tomlExists],
    failureModes: {
        NOT_FOUND: {
            name: "not found",
            text: function (_args) {
                return "NETWORK_PASSPHRASE is missing from the TOML file";
            }
        },
        INVALID_PASSPHRASE: {
            name: "invalid NETWORK_PASSPHRASE",
            text: function (_args) {
                return "NETWORK_PASSPHRASE is not one of the accepted values";
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
                if (!this.context.expects.tomlObj.NETWORK_PASSPHRASE) {
                    result.failure = failure_1.makeFailure(this.failureModes.NOT_FOUND);
                }
                else if (![stellar_sdk_1.Networks.TESTNET, stellar_sdk_1.Networks.PUBLIC].includes(this.context.expects.tomlObj.NETWORK_PASSPHRASE)) {
                    result.failure = failure_1.makeFailure(this.failureModes.INVALID_PASSPHRASE);
                    result.expected = "$'{Networks.TESTNET}' or '" + stellar_sdk_1.Networks.PUBLIC + "'";
                    result.actual = this.context.expects.tomlObj.NETWORK_PASSPHRASE;
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(exports.hasNetworkPassphrase);
var hasCurrenciesSection = {
    assertion: "has a valid CURRENCIES section",
    group: group,
    sep: 1,
    dependencies: [exports.tomlExists],
    context: {
        expects: {
            tomlObj: undefined
        },
        provides: {}
    },
    failureModes: {
        NOT_FOUND: {
            name: "not found",
            text: function (_args) {
                return "CURRENCIES is missing from the TOML file";
            }
        },
        INVALID_SCHEMA: {
            name: "invalid schema",
            text: function (args) {
                return ("The CURRENCIES entry for " + args.currency + " does not comply with the schema defined here:\n\n" +
                    "https://github.com/stellar/stellar-anchor-tests/tree/master/src/schemas/sep1.ts#L1\n\n" +
                    "The definitions of each attribute can be found on the stellar-protocol repository:\n\n" +
                    "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md#currency-documentation\n\n" +
                    "The errors returned from the schema validation:\n\n" +
                    ("" + args.errors));
            }
        }
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _i, _a, currency, validatorResult;
            return __generator(this, function (_b) {
                result = { networkCalls: [] };
                if (!this.context.expects.tomlObj.CURRENCIES) {
                    result.failure = failure_1.makeFailure(this.failureModes.NOT_FOUND);
                    return [2 /*return*/, result];
                }
                for (_i = 0, _a = this.context.expects.tomlObj.CURRENCIES; _i < _a.length; _i++) {
                    currency = _a[_i];
                    validatorResult = jsonschema_1.validate(currency, sep1_1.currencySchema);
                    if (validatorResult.errors.length !== 0) {
                        result.failure = failure_1.makeFailure(this.failureModes.INVALID_SCHEMA, {
                            currency: currency.code,
                            errors: validatorResult.errors.join("\n")
                        });
                        break;
                    }
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(hasCurrenciesSection);
var validUrls = {
    assertion: "all URLs are HTTPS and end without slashes",
    sep: 1,
    group: group,
    dependencies: [exports.tomlExists],
    failureModes: {
        NOT_FOUND: {
            name: "not found",
            text: function (_args) {
                return "No URLs found. The TOML likely did not parse correctly.";
            }
        },
        NO_HTTPS: {
            name: "HTTPS not used",
            text: function (_args) {
                return "All URLs must use HTTPS";
            }
        },
        ENDS_WITH_SLASH: {
            name: "URL ends with a slash",
            text: function (_args) {
                return "All URLs must not end with '/'";
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
            var result, urlAttributes, checkUrl, _i, urlAttributes_1, attr;
            var _this = this;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                urlAttributes = [
                    "FEDERATION_SERVER",
                    "AUTH_SERVER",
                    "TRANSFER_SERVER",
                    "TRANSFER_SERVER_SEP0024",
                    "KYC_SERVER",
                    "WEB_AUTH_ENDPOINT",
                    "HORIZON_URL",
                    "DIRECT_PAYMENT_SERVER",
                    "ANCHOR_QUOTE_SERVER",
                    "ORG_URL",
                    "ORG_LOGO",
                    "ORG_PHYSICAL_ADDRESS_ATTESTATION",
                    "ORG_PHONE_NUMBER_ATTESTATION",
                    "image",
                    "attestation_of_reserve",
                    "approval_server",
                ];
                checkUrl = function (u) {
                    if (!u)
                        return;
                    if (!u.startsWith("https://")) {
                        result.failure = failure_1.makeFailure(_this.failureModes.NO_HTTPS);
                    }
                    else if (u.slice(-1) === "/") {
                        result.failure = failure_1.makeFailure(_this.failureModes.ENDS_WITH_SLASH);
                    }
                };
                for (_i = 0, urlAttributes_1 = urlAttributes; _i < urlAttributes_1.length; _i++) {
                    attr = urlAttributes_1[_i];
                    if (attr.startsWith("ORG")) {
                        if (!this.context.expects.tomlObj.DOCUMENTATION) {
                            continue;
                        }
                        checkUrl(this.context.expects.tomlObj.DOCUMENTATION[attr]);
                    }
                    else if (["image", "attestation_of_reserve", "approval_server"].includes(attr)) {
                        if (!this.context.expects.tomlObj.CURRENCIES) {
                            continue;
                        }
                        checkUrl(this.context.expects.tomlObj.CURRENCIES[attr]);
                    }
                    else {
                        checkUrl(this.context.expects.tomlObj[attr]);
                    }
                    if (result.failure)
                        return [2 /*return*/, result];
                }
                return [2 /*return*/, result];
            });
        });
    }
};
tests.push(validUrls);
exports["default"] = tests;
