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
exports.makeRequest = void 0;
var node_fetch_1 = require("node-fetch");
var failure_1 = require("./failure");
/*
 * Makes the request specified by networkCall and performs status checks.
 * If contentType is specified, the content type is also checked and
 * the response body is return.
 */
function makeRequest(networkCall, expectedStatus, result, contentType) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, statusCondition, responseContentType;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _a = networkCall;
                    return [4 /*yield*/, node_fetch_1["default"](networkCall.request.clone())];
                case 1:
                    _a.response = _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _b = _c.sent();
                    result.failure = failure_1.makeFailure(failure_1.genericFailures.CONNECTION_ERROR, {
                        url: networkCall.request.url
                    });
                    return [2 /*return*/];
                case 3:
                    if (typeof expectedStatus === "number") {
                        statusCondition = networkCall.response.status !== expectedStatus;
                    }
                    else {
                        statusCondition = !expectedStatus.includes(networkCall.response.status);
                    }
                    if (statusCondition) {
                        result.failure = failure_1.makeFailure(failure_1.genericFailures.UNEXPECTED_STATUS_CODE, {
                            url: networkCall.request.url,
                            method: networkCall.request.method
                        });
                        result.expected = expectedStatus;
                        result.actual = networkCall.response.status;
                        return [2 /*return*/];
                    }
                    if (!contentType)
                        return [2 /*return*/];
                    responseContentType = networkCall.response.headers.get("Content-Type");
                    if (!responseContentType || !responseContentType.includes(contentType)) {
                        result.failure = failure_1.makeFailure(failure_1.genericFailures.BAD_CONTENT_TYPE, {
                            method: networkCall.request.method,
                            url: networkCall.request.method
                        });
                        result.expected = contentType;
                        if (responseContentType)
                            result.actual = responseContentType;
                        return [2 /*return*/, result];
                    }
                    if (!responseContentType.includes("application/json")) return [3 /*break*/, 5];
                    return [4 /*yield*/, networkCall.response.clone().json()];
                case 4: return [2 /*return*/, _c.sent()];
                case 5: return [4 /*yield*/, networkCall.response.clone().text()];
                case 6: return [2 /*return*/, _c.sent()];
            }
        });
    });
}
exports.makeRequest = makeRequest;
