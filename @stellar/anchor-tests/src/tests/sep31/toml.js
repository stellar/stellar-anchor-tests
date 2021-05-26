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
exports.hasDirectPaymentServer = void 0;
var tests_1 = require("../sep1/tests");
var failure_1 = require("../../helpers/failure");
exports.hasDirectPaymentServer = {
    assertion: "has DIRECT_PAYMENT_SERVER attribute",
    sep: 31,
    group: "TOML Tests",
    dependencies: [tests_1.tomlExists],
    context: {
        expects: {
            tomlObj: undefined
        },
        provides: {
            directPaymentServerUrl: undefined
        }
    },
    failureModes: {
        DIRECT_PAYMENT_SERVER_NOT_FOUND: {
            name: "DIRECT_PAYMENT_SERVER not found",
            text: function (_args) {
                return "The stellar.toml file does not have a valid DIRECT_PAYMENT_SERVER URL";
            }
        },
        NO_HTTPS: {
            name: "no https",
            text: function (_args) {
                return "The transfer server URL must use HTTPS";
            }
        },
        ENDS_WITH_SLASH: {
            name: "ends with slash",
            text: function (_args) {
                return "The transfer server URL cannot end with a '/'";
            }
        }
    },
    run: function (_config) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                result = { networkCalls: [] };
                this.context.provides.directPaymentServerUrl = this.context.expects.tomlObj.DIRECT_PAYMENT_SERVER;
                if (!this.context.provides.directPaymentServerUrl) {
                    result.failure = failure_1.makeFailure(this.failureModes.DIRECT_PAYMENT_SERVER_NOT_FOUND);
                    return [2 /*return*/, result];
                }
                if (!this.context.provides.directPaymentServerUrl.startsWith("https")) {
                    result.failure = failure_1.makeFailure(this.failureModes.NO_HTTPS);
                    return [2 /*return*/, result];
                }
                if (this.context.provides.directPaymentServerUrl.slice(-1) === "/") {
                    result.failure = failure_1.makeFailure(this.failureModes.ENDS_WITH_SLASH);
                    return [2 /*return*/, result];
                }
                return [2 /*return*/, result];
            });
        });
    }
};
exports["default"] = [exports.hasDirectPaymentServer];
