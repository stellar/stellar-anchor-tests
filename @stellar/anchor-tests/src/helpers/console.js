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
exports.printTestRun = exports.printStats = void 0;
var ansi_colors_1 = require("ansi-colors");
var util_1 = require("util");
util_1.inspect.styles.string = "yellow";
function printStats(stats, startTime, endTime) {
    printColoredTextStats(stats, startTime, endTime);
}
exports.printStats = printStats;
function printTestRun(testRun, verbose) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, printColoredTextTestRun(testRun, verbose)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.printTestRun = printTestRun;
function printColoredTextStats(stats, startTime, endTime) {
    var testsLine = "Tests:       ";
    if (stats.failed !== 0)
        testsLine += ansi_colors_1["default"].red(stats.failed + " failed") + ", ";
    if (stats.passed !== 0)
        testsLine += ansi_colors_1["default"].green(stats.passed + " passed") + ", ";
    if (stats.skipped !== 0)
        testsLine += ansi_colors_1["default"].gray(stats.skipped + " skipped") + ", ";
    testsLine += stats.total + " total";
    console.log(testsLine);
    var secondsString = ((endTime - startTime) / 1000).toFixed(3);
    console.log("Time:        " + secondsString + "s");
}
function printColoredTextTestRun(testRun, verbose) {
    return __awaiter(this, void 0, void 0, function () {
        var color, symbol, header, _i, _a, networkCall, requestHeaders, requestHeaderKeys, _b, requestHeaderKeys_1, header_1, requestBodyIsJson, requestBody, responseHeaders, responseHeaderKeys, _c, responseHeaderKeys_1, header_2, contentType, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    if (testRun.result.skipped) {
                        color = ansi_colors_1["default"].gray.bold;
                        symbol = ansi_colors_1["default"].symbols.pointer;
                    }
                    else if (testRun.result.failure) {
                        color = ansi_colors_1["default"].red.bold;
                        symbol = ansi_colors_1["default"].symbols.cross;
                    }
                    else {
                        color = ansi_colors_1["default"].green.bold;
                        symbol = ansi_colors_1["default"].symbols.check;
                    }
                    header = symbol + " ";
                    if (testRun.test.group) {
                        if (testRun.test.sep)
                            header += "SEP-" + testRun.test.sep + " " + ansi_colors_1["default"].symbols.pointerSmall + " ";
                        header += testRun.test.group + " " + ansi_colors_1["default"].symbols.pointerSmall + " ";
                    }
                    header += "" + testRun.test.assertion;
                    console.log(color(header));
                    console.group(); // result group
                    if (testRun.result.failure) {
                        console.log();
                        console.log(ansi_colors_1["default"].bold("Failure Type:\n"));
                        console.group(); // failure type group
                        console.log(testRun.result.failure.name + "\n");
                        console.groupEnd(); // failure type group
                        console.log(ansi_colors_1["default"].bold("Description:\n"));
                        console.group(); // description group
                        console.log(testRun.result.failure.message + "\n");
                        if (testRun.result.expected || testRun.result.actual) {
                            console.log("Expected: " + testRun.result.expected);
                            console.log("Received: " + testRun.result.actual + "\n");
                        }
                        console.groupEnd(); // description group
                    }
                    if (!(verbose && testRun.result.networkCalls.length)) return [3 /*break*/, 14];
                    console.log(ansi_colors_1["default"].bold("Network Calls:\n"));
                    _i = 0, _a = testRun.result.networkCalls;
                    _h.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 14];
                    networkCall = _a[_i];
                    console.log("Request:\n");
                    console.group(); // request group
                    console.log(networkCall.request.method + " " + networkCall.request.url + "\n");
                    requestHeaders = Object.fromEntries(networkCall.request.headers.entries());
                    requestHeaderKeys = Object.keys(requestHeaders);
                    if (requestHeaderKeys.length !== 0) {
                        console.log("Headers:\n");
                        console.group(); // header group
                        for (_b = 0, requestHeaderKeys_1 = requestHeaderKeys; _b < requestHeaderKeys_1.length; _b++) {
                            header_1 = requestHeaderKeys_1[_b];
                            console.log(header_1 + ": " + requestHeaders[header_1]);
                        }
                        console.groupEnd(); // header group
                        console.log();
                    }
                    console.groupEnd(); // request group
                    requestBodyIsJson = false;
                    requestBody = null;
                    if (!(requestHeaders["content-type"] &&
                        requestHeaders["content-type"].includes("json"))) return [3 /*break*/, 3];
                    requestBodyIsJson = true;
                    return [4 /*yield*/, networkCall.request.json()];
                case 2:
                    requestBody = _h.sent();
                    return [3 /*break*/, 6];
                case 3:
                    if (!(requestHeaders["content-type"] &&
                        requestHeaders["content-type"].includes("multipart/form-data"))) return [3 /*break*/, 4];
                    requestBody = ""; // TODO
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, networkCall.request.text()];
                case 5:
                    requestBody = _h.sent();
                    _h.label = 6;
                case 6:
                    if (requestBody) {
                        console.log("Body:\n");
                        if (requestBodyIsJson) {
                            console.dir(requestBody, { depth: Infinity, colors: true });
                        }
                        else {
                            console.group(); // request body group
                            console.log(requestBody);
                            console.groupEnd();
                        }
                        console.log();
                    }
                    console.log("Response:\n");
                    console.group(); // response group
                    if (!networkCall.response) return [3 /*break*/, 11];
                    console.log("Status Code: " + networkCall.response.status + "\n");
                    responseHeaders = Object.fromEntries(networkCall.response.headers.entries());
                    responseHeaderKeys = Object.keys(responseHeaders);
                    if (responseHeaderKeys.length !== 0) {
                        console.log("Headers:\n");
                        console.group(); // header group
                        for (_c = 0, responseHeaderKeys_1 = responseHeaderKeys; _c < responseHeaderKeys_1.length; _c++) {
                            header_2 = responseHeaderKeys_1[_c];
                            console.log(header_2 + ": " + responseHeaders[header_2]);
                        }
                        console.groupEnd(); // header group
                        console.log();
                    }
                    console.log("Body:\n");
                    contentType = networkCall.response.headers.get("Content-Type");
                    if (!(contentType && contentType.includes("json"))) return [3 /*break*/, 8];
                    _e = (_d = console).dir;
                    return [4 /*yield*/, networkCall.response.json()];
                case 7:
                    _e.apply(_d, [_h.sent(), {
                            depth: Infinity,
                            colors: true
                        }]);
                    return [3 /*break*/, 10];
                case 8:
                    console.group(); // body group
                    _g = (_f = console).log;
                    return [4 /*yield*/, networkCall.response.text()];
                case 9:
                    _g.apply(_f, [_h.sent()]);
                    console.groupEnd(); // body group
                    _h.label = 10;
                case 10:
                    console.log();
                    return [3 /*break*/, 12];
                case 11:
                    console.log("No response returned.\n");
                    _h.label = 12;
                case 12:
                    console.groupEnd(); // response group
                    _h.label = 13;
                case 13:
                    _i++;
                    return [3 /*break*/, 1];
                case 14:
                    console.groupEnd(); // result group
                    return [2 /*return*/];
            }
        });
    });
}
