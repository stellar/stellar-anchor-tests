"use strict";
exports.__esModule = true;
var getCustomer_1 = require("./getCustomer");
var putCustomer_1 = require("./putCustomer");
var deleteCustomer_1 = require("./deleteCustomer");
exports["default"] = putCustomer_1["default"].concat(getCustomer_1["default"], deleteCustomer_1["default"]);
