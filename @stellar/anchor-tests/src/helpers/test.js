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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
exports.__esModule = true;
exports.runTests = exports.getTests = exports.run = void 0;
var stellar_sdk_1 = require("stellar-sdk");
var tests_1 = require("../tests/sep1/tests");
var tests_2 = require("../tests/sep6/tests");
var tests_3 = require("../tests/sep10/tests");
var tests_4 = require("../tests/sep12/tests");
var tests_5 = require("../tests/sep24/tests");
var tests_6 = require("../tests/sep31/tests");
var failure_1 = require("./failure");
var config_1 = require("./config");
/**
 * Gets tests based on the SEPs and search strings specified
 * in `config` and calls runTests, which ensures all depedencies are run
 * prior to each test. Each test run is yield'ed back to the caller.
 *
 * The function will raise an exception if a cycle is detected. A
 * cycle is when a test depends, directly or indirectly, on itself.

 * @param config  the [[Config]] object to pass to each [[Test.run]] method.
 * @throws [[ConfigError]]  if the `config` is invalid in some way.
 */
function run(config) {
    return __asyncGenerator(this, arguments, function run_1() {
        var tests, _a, _b, testRun, e_1_1;
        var e_1, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    tests = getTopLevelTests(config);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 8, 9, 14]);
                    _a = __asyncValues(runTests(tests, config));
                    _d.label = 2;
                case 2: return [4 /*yield*/, __await(_a.next())];
                case 3:
                    if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 7];
                    testRun = _b.value;
                    return [4 /*yield*/, __await(testRun)];
                case 4: return [4 /*yield*/, _d.sent()];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6: return [3 /*break*/, 2];
                case 7: return [3 /*break*/, 14];
                case 8:
                    e_1_1 = _d.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 14];
                case 9:
                    _d.trys.push([9, , 12, 13]);
                    if (!(_b && !_b.done && (_c = _a["return"]))) return [3 /*break*/, 11];
                    return [4 /*yield*/, __await(_c.call(_a))];
                case 10:
                    _d.sent();
                    _d.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 13: return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
exports.run = run;
/**
 * Gets all tests that [[run]] would run for a given [[Config]] passed.
 *
 * This is helpful if you want to use test objects prior to running.
 * For example, the tests returned could be displayed in a UI prior
 * to running the tests.
 *
 * The function will raise an exception if a cycle is detected. A
 * cycle is when a test depends, directly or indirectly, on itself.
 *
 * @param config  the [[Config]] object to used to determine which tests to return.
 * @throws [[ConfigError]]  if the `config` is invalid in some way.
 */
function getTests(config) {
    return __awaiter(this, void 0, void 0, function () {
        var topLevelTests;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, config_1.checkConfig(config)];
                case 1:
                    _a.sent();
                    topLevelTests = getTopLevelTests(config);
                    return [2 /*return*/, getAllTestsRecur(topLevelTests, [], new Set())];
            }
        });
    });
}
exports.getTests = getTests;
/*
 * Takes tests from getTopLevelTests() and adds their dependencies.
 *
 * Specifically, dependencies are guarunteed to be present in the
 * returned list prior to those that depend on them. The function will
 * raise an exception if a cycle is detected. A cycle is when a test
 * depends, directly or indirectly, on itself.
 */
function getAllTestsRecur(tests, testDependencyStack, seenTests) {
    var allTests = [];
    for (var _i = 0, tests_7 = tests; _i < tests_7.length; _i++) {
        var test = tests_7[_i];
        if (containsTest(testDependencyStack, test)) {
            throw ("A dependency cycle was detected for test:\n\n" +
                ("SEP: " + test.sep + "\n") +
                ("Group: " + test.group + "\n") +
                ("Assertion: " + test.assertion));
        }
        else if (seenTests.has(testString(test))) {
            continue;
        }
        if (test.dependencies) {
            testDependencyStack.push(test);
            allTests = allTests.concat(getAllTestsRecur(test.dependencies, testDependencyStack, seenTests));
            testDependencyStack.pop();
        }
        seenTests.add(testString(test));
        allTests.push(test);
    }
    return allTests;
}
var FailedDependencyError = /** @class */ (function (_super) {
    __extends(FailedDependencyError, _super);
    function FailedDependencyError(test) {
        var _this = _super.call(this, "A test dependency failed\n\n" +
            ("SEP: " + test.sep + "\nGroup: " + test.group + "\nAssertion: " + test.assertion)) || this;
        _this.name = "FailedDependencyError";
        _this.test = test;
        Object.setPrototypeOf(_this, FailedDependencyError.prototype);
        return _this;
    }
    return FailedDependencyError;
}(Error));
var CyclicDependencyError = /** @class */ (function (_super) {
    __extends(CyclicDependencyError, _super);
    function CyclicDependencyError(test) {
        var _this = _super.call(this, "A dependency cycle was detected\n\n" +
            ("SEP: " + test.sep + "\nGroup: " + test.group + "\nAssertion: " + test.assertion)) || this;
        _this.name = "CyclicDependencyError";
        _this.test = test;
        Object.setPrototypeOf(_this, CyclicDependencyError.prototype);
        return _this;
    }
    return CyclicDependencyError;
}(Error));
/**
 * Runs the tests passed, including dependencies, and yields them
 * back to the caller.
 *
 * Maintains a global context object. Expects each test to provide
 * the data defined in [[Context.provides]] to the global context
 * and ensures the global context has the data defined in each
 * [[Context.expects]].
 *
 * If a test directly or indirectly depends on itself or if one of
 * its dependencies fails, a relevant [[Faliure]] will be added to the
 * test's result and yielded and the test will not be run.
 *
 * @param tests  the list of tests to run in order.
 * @param config  the [[Config]] object to pass to each [[Test.run]] method.
 * @throws [[ConfigError]]  if the `config` is invalid in some way.
 */
function runTests(tests, config) {
    return __asyncGenerator(this, arguments, function runTests_1() {
        var _a, _b, testRun, e_2_1;
        var e_2, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, __await(config_1.checkConfig(config))];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 9, 10, 15]);
                    _a = __asyncValues(runTestsRecur(tests, config, [], {}, {}));
                    _d.label = 3;
                case 3: return [4 /*yield*/, __await(_a.next())];
                case 4:
                    if (!(_b = _d.sent(), !_b.done)) return [3 /*break*/, 8];
                    testRun = _b.value;
                    return [4 /*yield*/, __await(testRun)];
                case 5: return [4 /*yield*/, _d.sent()];
                case 6:
                    _d.sent();
                    _d.label = 7;
                case 7: return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 15];
                case 9:
                    e_2_1 = _d.sent();
                    e_2 = { error: e_2_1 };
                    return [3 /*break*/, 15];
                case 10:
                    _d.trys.push([10, , 13, 14]);
                    if (!(_b && !_b.done && (_c = _a["return"]))) return [3 /*break*/, 12];
                    return [4 /*yield*/, __await(_c.call(_a))];
                case 11:
                    _d.sent();
                    _d.label = 12;
                case 12: return [3 /*break*/, 14];
                case 13:
                    if (e_2) throw e_2.error;
                    return [7 /*endfinally*/];
                case 14: return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}
exports.runTests = runTests;
function runTestsRecur(tests, config, chain, globalContext, ranTests) {
    return __asyncGenerator(this, arguments, function runTestsRecur_1() {
        var _loop_1, _i, tests_8, test;
        var e_3, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _loop_1 = function (test) {
                        var failedDependencyError, cycleError, _c, _d, testRun, e_3_1, error_1, cycleDetectedFailure, failedDependencyFailure, expectedContextFailure, testRun, providedContextFailure;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    if (containsTest(chain, test)) {
                                        throw new CyclicDependencyError(test);
                                    }
                                    else if (testString(test) in ranTests) {
                                        if (!ranTests[testString(test)].result.failure) {
                                            return [2 /*return*/, "continue"];
                                        }
                                        else {
                                            throw new FailedDependencyError(test);
                                        }
                                    }
                                    failedDependencyError = undefined;
                                    cycleError = undefined;
                                    if (!test.dependencies) return [3 /*break*/, 18];
                                    chain.push(test);
                                    _e.label = 1;
                                case 1:
                                    _e.trys.push([1, 16, , 17]);
                                    _e.label = 2;
                                case 2:
                                    _e.trys.push([2, 9, 10, 15]);
                                    _c = (e_3 = void 0, __asyncValues(runTestsRecur(test.dependencies, config, chain, globalContext, ranTests)));
                                    _e.label = 3;
                                case 3: return [4 /*yield*/, __await(_c.next())];
                                case 4:
                                    if (!(_d = _e.sent(), !_d.done)) return [3 /*break*/, 8];
                                    testRun = _d.value;
                                    return [4 /*yield*/, __await(testRun)];
                                case 5: return [4 /*yield*/, _e.sent()];
                                case 6:
                                    _e.sent();
                                    if (testRun.result.failure) {
                                        throw new FailedDependencyError(testRun.test);
                                    }
                                    _e.label = 7;
                                case 7: return [3 /*break*/, 3];
                                case 8: return [3 /*break*/, 15];
                                case 9:
                                    e_3_1 = _e.sent();
                                    e_3 = { error: e_3_1 };
                                    return [3 /*break*/, 15];
                                case 10:
                                    _e.trys.push([10, , 13, 14]);
                                    if (!(_d && !_d.done && (_a = _c["return"]))) return [3 /*break*/, 12];
                                    return [4 /*yield*/, __await(_a.call(_c))];
                                case 11:
                                    _e.sent();
                                    _e.label = 12;
                                case 12: return [3 /*break*/, 14];
                                case 13:
                                    if (e_3) throw e_3.error;
                                    return [7 /*endfinally*/];
                                case 14: return [7 /*endfinally*/];
                                case 15: return [3 /*break*/, 17];
                                case 16:
                                    error_1 = _e.sent();
                                    if (error_1 instanceof CyclicDependencyError) {
                                        if (testString(error_1.test) === testString(test)) {
                                            cycleError = error_1;
                                        }
                                        else {
                                            chain.pop();
                                            throw error_1;
                                        }
                                    }
                                    else if (error_1 instanceof FailedDependencyError) {
                                        failedDependencyError = error_1;
                                    }
                                    else {
                                        // unexpected exception
                                        throw error_1;
                                    }
                                    return [3 /*break*/, 17];
                                case 17:
                                    chain.pop();
                                    _e.label = 18;
                                case 18:
                                    if (!cycleError) return [3 /*break*/, 21];
                                    cycleDetectedFailure = {
                                        name: "dependency cycle detected",
                                        text: function (_args) {
                                            return cycleError.message;
                                        }
                                    };
                                    return [4 /*yield*/, __await({
                                            test: test,
                                            result: {
                                                networkCalls: [],
                                                failure: failure_1.makeFailure(cycleDetectedFailure)
                                            }
                                        })];
                                case 19: return [4 /*yield*/, _e.sent()];
                                case 20:
                                    _e.sent();
                                    return [3 /*break*/, 34];
                                case 21:
                                    if (!failedDependencyError) return [3 /*break*/, 24];
                                    failedDependencyFailure = {
                                        name: "failed dependency",
                                        text: function (_args) {
                                            return failedDependencyError.message;
                                        }
                                    };
                                    return [4 /*yield*/, __await({
                                            test: test,
                                            result: {
                                                networkCalls: [],
                                                failure: failure_1.makeFailure(failedDependencyFailure)
                                            }
                                        })];
                                case 22: return [4 /*yield*/, _e.sent()];
                                case 23:
                                    _e.sent();
                                    return [3 /*break*/, 34];
                                case 24:
                                    expectedContextFailure = provideExpectedContext(globalContext, test);
                                    if (!expectedContextFailure) return [3 /*break*/, 27];
                                    return [4 /*yield*/, __await({
                                            test: test,
                                            result: {
                                                networkCalls: [],
                                                failure: expectedContextFailure
                                            }
                                        })];
                                case 25: return [4 /*yield*/, _e.sent()];
                                case 26:
                                    _e.sent();
                                    return [2 /*return*/, "continue"];
                                case 27: return [4 /*yield*/, __await(runTest(test, config))];
                                case 28:
                                    testRun = _e.sent();
                                    ranTests[testString(test)] = testRun;
                                    if (!!testRun.result.failure) return [3 /*break*/, 31];
                                    providedContextFailure = updateWithProvidedContext(globalContext, test);
                                    if (!providedContextFailure) return [3 /*break*/, 31];
                                    return [4 /*yield*/, __await({
                                            test: test,
                                            result: {
                                                networkCalls: [],
                                                failure: providedContextFailure
                                            }
                                        })];
                                case 29: return [4 /*yield*/, _e.sent()];
                                case 30:
                                    _e.sent();
                                    return [2 /*return*/, "continue"];
                                case 31: return [4 /*yield*/, __await(testRun)];
                                case 32: return [4 /*yield*/, _e.sent()];
                                case 33:
                                    _e.sent();
                                    _e.label = 34;
                                case 34: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, tests_8 = tests;
                    _b.label = 1;
                case 1:
                    if (!(_i < tests_8.length)) return [3 /*break*/, 4];
                    test = tests_8[_i];
                    return [5 /*yield**/, _loop_1(test)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/*
 * Runs the `test` passed, including the before() and after() methods
 * if present, and returns the corresponding TestRun object.
 *
 * Note that dependencies are not run prior to running `test`.
 */
function runTest(test, config) {
    return __awaiter(this, void 0, void 0, function () {
        var result, e_4, failure;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, test.run(config)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, { test: test, result: result }];
                case 2:
                    e_4 = _a.sent();
                    failure = {
                        name: "unexpected exception",
                        text: function (args) {
                            return ("An unexpected exception occurred while running:\n\n" +
                                ("SEP: '" + test.sep + "'\nGroup: '" + test.group + "'\nTest: '" + test.assertion + "'\n\n") +
                                ("Exception message: '" + args.exception + "'\n\n") +
                                "Please report this bug at https://github.com/stellar/stellar-anchor-tests/issues");
                        }
                    };
                    return [2 /*return*/, {
                            test: test,
                            result: {
                                networkCalls: [],
                                failure: failure_1.makeFailure(failure, { exception: e_4.message })
                            }
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/*
 * Returns the tests that should run for the given `config`, not
 * including dependencies.
 */
function getTopLevelTests(config) {
    var tests = [];
    if (config.seps.includes(1)) {
        tests = tests.concat(tests_1["default"]);
    }
    if (config.seps.includes(10)) {
        if (config.networkPassphrase === stellar_sdk_1.Networks.PUBLIC) {
            // signer support tests not yet supported on pubnet
            var filteredSep10Suites = tests_3["default"].filter(function (test) { return !test.group.includes("Account Signer Support"); });
            tests = tests.concat(filteredSep10Suites);
        }
        else {
            tests = tests.concat(tests_3["default"]);
        }
    }
    if (config.seps.includes(12)) {
        tests = tests.concat(tests_4["default"]);
    }
    if (config.seps.includes(6)) {
        tests = tests.concat(tests_2["default"]);
    }
    if (config.seps.includes(24)) {
        tests = tests.concat(tests_5["default"]);
    }
    if (config.seps.includes(31)) {
        tests = tests.concat(tests_6["default"]);
    }
    return filterBySearchStrings(tests, config.searchStrings);
}
/*
 * Returns a subset of `tests` which match one of the `searchStrings`
 * provided.
 *
 * A test matches one of the search strings if `Test.assertion` or
 * `Test.group` contains one of the `searchStrings`.
 */
function filterBySearchStrings(tests, searchStrings) {
    if (!searchStrings) {
        return tests;
    }
    var filteredTests = [];
    for (var _i = 0, tests_9 = tests; _i < tests_9.length; _i++) {
        var test = tests_9[_i];
        var groupNameLower = test.group.toLowerCase();
        var assertionLower = test.assertion.toLowerCase();
        for (var _a = 0, searchStrings_1 = searchStrings; _a < searchStrings_1.length; _a++) {
            var searchString = searchStrings_1[_a];
            var searchStringLower = searchString.toLowerCase();
            if (groupNameLower.includes(searchStringLower) ||
                assertionLower.includes(searchStringLower)) {
                filteredTests.push(test);
                break;
            }
        }
    }
    return filteredTests;
}
function containsTest(tests, test) {
    for (var _i = 0, tests_10 = tests; _i < tests_10.length; _i++) {
        var t = tests_10[_i];
        if (testString(t) === testString(test))
            return true;
    }
    return false;
}
function provideExpectedContext(globalContext, test) {
    var _loop_2 = function (key) {
        if (globalContext[key] === undefined) {
            return { value: failure_1.makeFailure({
                    name: "missing expected context",
                    text: function (args) {
                        return ("The following test expected context '" + key + "':\n\n" +
                            ("SEP: " + args.test.sep + "\n") +
                            ("Group: " + args.test.group + "\n") +
                            ("Assertion: " + args.test.assertion));
                    }
                }, { test: test, key: key }) };
        }
        test.context.expects[key] = globalContext[key];
    };
    for (var key in test.context.expects) {
        var state_1 = _loop_2(key);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return;
}
function updateWithProvidedContext(globalContext, test) {
    var _loop_3 = function (key) {
        if (test.context.provides[key] === undefined) {
            return { value: failure_1.makeFailure({
                    name: "missing provided context",
                    text: function (args) {
                        return ("The following test was expected to provide context '" + key + "':\n\n" +
                            ("SEP: " + args.test.sep + "\n") +
                            ("Group: " + args.test.group + "\n") +
                            ("Assertion: " + args.test.assertion));
                    }
                }, { test: test, key: key }) };
        }
        globalContext[key] = test.context.provides[key];
    };
    for (var key in test.context.provides) {
        var state_2 = _loop_3(key);
        if (typeof state_2 === "object")
            return state_2.value;
    }
    return;
}
function testString(test) {
    return test.sep + "-" + test.group + "-" + test.assertion;
}
