"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.checkConfig = exports.ConfigError = void 0;
var node_fetch_1 = require("node-fetch");
var stellar_sdk_1 = require("stellar-sdk");
var jsonschema_1 = require("jsonschema");
var toml_1 = require("toml");
var fs_1 = require("fs");
var path_1 = require("path");
var config_1 = require("../schemas/config");
var sep12_1 = require("../schemas/sep12");
var ConfigError = /** @class */ (function (_super) {
    __extends(ConfigError, _super);
    function ConfigError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = "ConfigError";
        return _this;
    }
    return ConfigError;
}(Error));
exports.ConfigError = ConfigError;
function checkConfig(config) {
    return __awaiter(this, void 0, void 0, function () {
        var tomlObj, tomlResponse, _a, _b, customerName, customerData, _i, binaryFields_1, binaryField;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    try {
                        jsonschema_1.validate(config, config_1.configSchema, { throwFirst: true });
                    }
                    catch (e) {
                        throw new ConfigError(e.errors);
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, node_fetch_1["default"](config.homeDomain + "/.well-known/stellar.toml")];
                case 2:
                    tomlResponse = _c.sent();
                    _a = toml_1.parse;
                    return [4 /*yield*/, tomlResponse.text()];
                case 3:
                    tomlObj = _a.apply(void 0, [_c.sent()]);
                    return [3 /*break*/, 5];
                case 4:
                    _b = _c.sent();
                    return [3 /*break*/, 5];
                case 5:
                    if (tomlObj) {
                        if (![stellar_sdk_1.Networks.PUBLIC, stellar_sdk_1.Networks.TESTNET].includes(tomlObj.NETWORK_PASSPHRASE)) {
                            throw new ConfigError("NETWORK_PASSPHRASE is not one of the accepted values:\n\n" +
                                ("'" + stellar_sdk_1.Networks.TESTNET + "'\n'" + stellar_sdk_1.Networks.PUBLIC + "\n'"));
                        }
                        config.networkPassphrase = tomlObj.NETWORK_PASSPHRASE;
                    }
                    if (!config.sepConfig) {
                        return [2 /*return*/];
                    }
                    if (config.seps.includes(31)) {
                        if (!config.sepConfig["31"] || !config.sepConfig["12"]) {
                            throw new ConfigError("configuration for SEP-12 and SEP-31 is required to run SEP-31 tests.");
                        }
                        try {
                            stellar_sdk_1.Keypair.fromSecret(config.sepConfig["31"].sendingAnchorClientSecret);
                        }
                        catch (_d) {
                            throw new ConfigError("invalid 'sendingAnchorClientSecret'");
                        }
                        if (!config.sepConfig["12"].customers[config.sepConfig["31"].sendingClientName] ||
                            !config.sepConfig["12"].customers[config.sepConfig["31"].receivingClientName]) {
                            throw new ConfigError(config.sepConfig["31"].sendingClientName + " and " +
                                (config.sepConfig["31"].receivingClientName + " keys are required in ") +
                                "SEP-12's customer data");
                        }
                    }
                    if (config.seps.includes(12)) {
                        if (!config.sepConfig["12"]) {
                            throw new ConfigError("SEP 12 configuration is required to run SEP 6, 12, or 31 tests.");
                        }
                        for (customerName in config.sepConfig["12"].customers) {
                            customerData = config.sepConfig["12"].customers[customerName];
                            for (_i = 0, binaryFields_1 = sep12_1.binaryFields; _i < binaryFields_1.length; _i++) {
                                binaryField = binaryFields_1[_i];
                                if (!customerData[binaryField])
                                    continue;
                                if (typeof customerData[binaryField] !== "string") {
                                    throw new ConfigError("unrecognized type for binary customer field: " +
                                        (typeof customerData[binaryField] + ", expected file path."));
                                }
                                if (!path_1.isAbsolute(customerData[binaryField])) {
                                    customerData[binaryField] = path_1.resolve(customerData[binaryField]);
                                }
                                if (!fs_1.existsSync(customerData[binaryField])) {
                                    throw new ConfigError("'" + binaryField + "' file for '" + customerName + "' was not found at " +
                                        ("" + customerData[binaryField]));
                                }
                                customerData[binaryField] = fs_1.createReadStream(customerData[binaryField]);
                            }
                        }
                    }
                    if (config.seps.includes(6)) {
                        if (!config.sepConfig["6"]) {
                            throw new ConfigError("SEP 6 configuration is required to run SEP-6 tests.");
                        }
                        if (!config.sepConfig["12"] ||
                            !config.sepConfig["12"].customers ||
                            Object.keys(config.sepConfig["12"].customers).length < 1) {
                            throw new ConfigError("One customer record in SEP-12's configuration is required to run SEP-6 tests.");
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.checkConfig = checkConfig;
