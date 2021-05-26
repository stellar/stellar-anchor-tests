"use strict";
exports.__esModule = true;
exports.genericFailures = exports.badContentType = exports.unexpectedStatusCode = exports.connectionFailure = exports.makeFailure = void 0;
function makeFailure(failure, args) {
    failure.message = failure.text(args);
    return failure;
}
exports.makeFailure = makeFailure;
// generic failures
exports.connectionFailure = {
    name: "connection error",
    text: function (args) {
        return ("A connection failure occured when making a request to: " +
            ("\n\n" + args.url + "\n\n") +
            "Make sure that CORS is enabled.");
    }
};
exports.unexpectedStatusCode = {
    name: "unexpected status code",
    text: function (args) {
        return ("An unexpected status code was included in the response to: " +
            ("\n\n" + args.method + " " + args.url));
    }
};
exports.badContentType = {
    name: "bad content type",
    text: function (args) {
        return "The response to " + args.method + " " + args.url + " uses an unexpected Content-Type.";
    }
};
exports.genericFailures = {
    CONNECTION_ERROR: exports.connectionFailure,
    UNEXPECTED_STATUS_CODE: exports.unexpectedStatusCode,
    BAD_CONTENT_TYPE: exports.badContentType
};
