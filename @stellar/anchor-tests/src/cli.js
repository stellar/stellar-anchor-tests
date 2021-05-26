#!/usr/bin/env node
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var yargs_1 = require("yargs");
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var test_1 = require("./helpers/test");
var stats_1 = require("./helpers/stats");
var console_1 = require("./helpers/console");
var command = yargs_1["default"]
    .options({
    "home-domain": {
        alias: "h",
        requiresArg: true,
        demandOption: true,
        type: "string",
        description: "The home domain of the anchor. The anchor's TOML file should be present at <home-domain>/.well-known/stellar.toml. Prepends 'https://' if no protocol is specified."
    },
    "asset-code": {
        alias: "a",
        requiresArg: true,
        type: "string",
        description: "The asset code to use for testing. Must match one of the CURRENCIES listed in the TOML file."
    },
    seps: {
        alias: "s",
        type: "array",
        requiresArg: true,
        demandOption: true,
        coerce: function (arg) { return arg.map(function (x) { return parseInt(x); }); },
        description: "A list of numbers corresponding to the SEPs to test."
    },
    verbose: {
        alias: "v",
        type: "boolean",
        "default": false,
        description: "Display the each request and response used in each failed test."
    },
    "sep-config": {
        alias: "c",
        type: "string",
        requiresArg: true,
        description: "A relative or absolute file path to JSON file containing the configuration required for SEP 6, 12, & 31."
    }
})
    .check(function (argv) {
    if (!argv.homeDomain.startsWith("http")) {
        argv.homeDomain = "https://" + argv.homeDomain;
        argv.h = "https://" + argv.homeDomain;
        argv["home-domain"] = "https://" + argv.homeDomain;
    }
    var url;
    try {
        url = new url_1.URL(argv.homeDomain);
    }
    catch (_a) {
        throw "error: --home-domain is not a valid URL.";
    }
    if (url.protocol + "//" + url.host + "/" !== url.toString()) {
        throw "error: --home-domain includes protocol, hostname, and port.";
    }
    if (argv.seps) {
        for (var _i = 0, _b = argv.seps; _i < _b.length; _i++) {
            var sep = _b[_i];
            if (![1, 6, 10, 12, 24, 31].includes(sep))
                throw "error: invalid --sep value provided. Choices: 1, 6, 10, 12, 24, 31.";
        }
        if ((argv.seps.includes(6) ||
            argv.seps.includes(12) ||
            argv.seps.includes(31)) &&
            !argv.sepConfig) {
            throw "error: SEP 6, 12, & 31 require a configuration file (--sep-config, -c)";
        }
    }
    return true;
});
var args = command.argv;
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var config, sepConfigObj, startTime, testRuns, _a, _b, testRun, e_1_1, e_2, endTime;
    var e_1, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                config = {
                    homeDomain: args.homeDomain,
                    seps: args.seps
                };
                if (args._.length)
                    config.searchStrings = args._.map(String);
                if (args.assetCode)
                    config.assetCode = args.assetCode;
                if (args.verbose)
                    config.verbose = args.verbose;
                if (args.sepConfig) {
                    if (!path_1["default"].isAbsolute(args.sepConfig)) {
                        args.sepConfig = path_1["default"].resolve(args.sepConfig);
                    }
                    if (!fs_1["default"].existsSync(args.sepConfig)) {
                        yargs_1["default"].showHelp();
                        console.error("\nerror: the file specified with --sep-config does not exist");
                        process.exit(1);
                        return [2 /*return*/];
                    }
                    sepConfigObj = void 0;
                    try {
                        sepConfigObj = JSON.parse(fs_1["default"].readFileSync(args.sepConfig).toString());
                    }
                    catch (_e) {
                        yargs_1["default"].showHelp();
                        console.error("\nerror: --sep-config JSON file contents could not be parsed");
                        process.exit(1);
                        return [2 /*return*/];
                    }
                    config.sepConfig = sepConfigObj;
                }
                startTime = Date.now();
                testRuns = [];
                _d.label = 1;
            case 1:
                _d.trys.push([1, 15, , 16]);
                _d.label = 2;
            case 2:
                _d.trys.push([2, 8, 9, 14]);
                _a = __asyncValues(test_1.run(config));
                _d.label = 3;
            case 3: return [4 /*yield*/, _a.next()];
            case 4:
                if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 7];
                testRun = _b.value;
                testRuns.push(testRun);
                return [4 /*yield*/, console_1.printTestRun(testRun, config.verbose)];
            case 5:
                _d.sent();
                _d.label = 6;
            case 6: return [3 /*break*/, 3];
            case 7: return [3 /*break*/, 14];
            case 8:
                e_1_1 = _d.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 14];
            case 9:
                _d.trys.push([9, , 12, 13]);
                if (!(_b && !_b.done && (_c = _a["return"]))) return [3 /*break*/, 11];
                return [4 /*yield*/, _c.call(_a)];
            case 10:
                _d.sent();
                _d.label = 11;
            case 11: return [3 /*break*/, 13];
            case 12:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 13: return [7 /*endfinally*/];
            case 14: return [3 /*break*/, 16];
            case 15:
                e_2 = _d.sent();
                yargs_1["default"].showHelp();
                console.error("\n" + e_2.name + ": " + e_2.message);
                process.exit(1);
                return [2 /*return*/];
            case 16:
                endTime = Date.now();
                console.log(); // add new line between results and stats
                console_1.printStats(stats_1.getStats(testRuns), startTime, endTime);
                return [2 /*return*/];
        }
    });
}); })();
