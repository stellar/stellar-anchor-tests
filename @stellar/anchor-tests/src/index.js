"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.ConfigError = exports.runTests = exports.getTests = exports.run = void 0;
__exportStar(require("./types"), exports);
var test_1 = require("./helpers/test");
__createBinding(exports, test_1, "run");
__createBinding(exports, test_1, "getTests");
__createBinding(exports, test_1, "runTests");
var config_1 = require("./helpers/config");
__createBinding(exports, config_1, "ConfigError");
