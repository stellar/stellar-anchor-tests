"use strict";
exports.__esModule = true;
exports.getStats = void 0;
function getStats(testRuns) {
    var skipped = 0;
    var failed = 0;
    var passed = 0;
    for (var _i = 0, testRuns_1 = testRuns; _i < testRuns_1.length; _i++) {
        var testRun = testRuns_1[_i];
        if (testRun.result.skipped) {
            skipped += 1;
        }
        else if (testRun.result.failure) {
            failed += 1;
        }
        else {
            passed += 1;
        }
    }
    return {
        total: testRuns.length,
        passed: passed,
        failed: failed,
        skipped: skipped
    };
}
exports.getStats = getStats;
