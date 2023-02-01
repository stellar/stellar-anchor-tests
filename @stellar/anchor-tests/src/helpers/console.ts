import { default as c } from "ansi-colors";
import { inspect } from "util";
import * as fs from "fs-extra";

inspect.styles.string = "yellow";

import { TestRun, Stats } from "../types";

export function printStats(stats: Stats, startTime: number, endTime: number) {
  printColoredTextStats(stats, startTime, endTime);
}

export async function printTestRun(testRun: TestRun, verbose: boolean) {
  await printColoredTextTestRun(testRun, verbose);
}

function writeStatsSummary(reportLine: string, secondsString: string) {
  fs.writeFileSync(
    "./@stellar/anchor-tests/src/tests/tests_summary.txt",
    reportLine + "\n" + secondsString,
    { flag: "w+" },
  );
  console.log("Tests summary file has been saved!");
}

function printColoredTextStats(
  stats: Stats,
  startTime: number,
  endTime: number,
) {
  let testsLine = "Tests:       ";
  let reportLine = "Tests:       ";
  if (stats.failed !== 0) testsLine += c.red(`${stats.failed} failed`) + ", ";
  reportLine += stats.failed + " failed" + ", ";
  if (stats.passed !== 0) testsLine += c.green(`${stats.passed} passed`) + ", ";
  reportLine += stats.passed + " passed" + ", ";
  if (stats.skipped !== 0)
    testsLine += c.gray(`${stats.skipped} skipped`) + ", ";
  reportLine += stats.skipped + " skipped" + ", ";
  testsLine += `${stats.total} total`;
  reportLine += stats.total + " total";
  console.log(testsLine);
  const secondsString = ((endTime - startTime) / 1000).toFixed(3);
  console.log(`Time:        ${secondsString}s`);
  writeStatsSummary(reportLine, "Time:        " + secondsString + "s");
}

function writeTestReport(
  sep: number,
  testGroup: string,
  testName: string,
  testRun: string,
) {
  testName = testName.replace(/[^a-zA-Z]/g, "");
  testGroup = testGroup.replace(/[^a-zA-Z]/g, "");
  if (sep == 39)
    fs.writeFileSync(
      "./@stellar/anchor-tests/src/tests/sep" +
        "38v2" +
        "/output/report-" +
        testGroup +
        "-" +
        testName +
        ".txt",
      testRun,
      { flag: "w+" },
    );
  else
    fs.writeFileSync(
      "./@stellar/anchor-tests/src/tests/sep" +
        sep +
        "/output/report-" +
        testGroup +
        "-" +
        testName +
        ".txt",
      testRun,
      { flag: "w+" },
    );
  console.log("Tests report file has been saved!");
}

async function printColoredTextTestRun(testRun: TestRun, verbose: boolean) {
  let color, symbol;
  let sepNumber = testRun.test.sep;
  let reportDump = "-------------------------------------------------\n";
  let testName = testRun.test.assertion;
  let testGroup = testRun.test.group;
  if (testRun.result.skipped) {
    color = c.gray.bold;
    symbol = c.symbols.pointer;
  } else if (testRun.result.failure) {
    color = c.red.bold;
    symbol = c.symbols.cross;
  } else {
    color = c.green.bold;
    symbol = c.symbols.check;
  }
  let header = `${symbol} `;
  if (testRun.test.group) {
    if (testRun.test.sep)
      header += `SEP-${testRun.test.sep} ${c.symbols.pointerSmall} `;
    header += `${testRun.test.group} ${c.symbols.pointerSmall} `;
    reportDump += testRun.test.group + " ";
  }
  header += `${testRun.test.assertion}`;
  reportDump += "" + testRun.test.assertion + "\n";
  console.log(color(header));
  console.group(); // result group
  if (testRun.result.failure) {
    reportDump += "FAILED\n";
    console.log();
    console.log(c.bold("Failure Type:\n"));
    reportDump += "Failure Type:\n";
    console.group(); // failure type group
    console.log(`${testRun.result.failure.name}\n`);
    reportDump += "-" + testRun.result.failure.name + "\n";
    console.groupEnd(); // failure type group
    console.log(c.bold("Description:\n"));
    reportDump += "\nDescription\n";
    console.group(); // description group
    console.log(testRun.result.failure.message + "\n");
    reportDump += "-" + testRun.result.failure.message + "\n";
    if (testRun.result.expected || testRun.result.actual) {
      console.log(`Expected: ${testRun.result.expected}`);
      reportDump += "Expected: " + testRun.result.expected + "\n";
      console.log(`Received: ${testRun.result.actual}\n`);
      reportDump += "Received: " + testRun.result.actual + "\n";
    }
    console.groupEnd(); // description group
    if (testRun.result.failure.links) {
      const resources = Object.entries(testRun.result.failure.links);
      if (resources.length) {
        console.log(c.bold(`Resource Links:\n`));
        reportDump += "\nResource Links:\n";
      }
      console.group(); // resource links group
      for (const [label, link] of resources) {
        console.log(`${label}: ${link}\n`);
        reportDump += label + ": " + link + "\n";
      }
      console.groupEnd(); // resource links group
    }
  } else {
    reportDump += "PASSED";
  }
  writeTestReport(sepNumber, testGroup, testName, reportDump);
  if (verbose && testRun.result.failure && testRun.result.networkCalls.length) {
    console.log(c.bold("Network Calls:\n"));
    for (const networkCall of testRun.result.networkCalls) {
      console.log("Request:\n");
      console.group(); // request group
      console.log(`${networkCall.request.method} ${networkCall.request.url}\n`);
      const requestHeaders = Object.fromEntries(
        networkCall.request.headers.entries(),
      );
      const requestHeaderKeys = Object.keys(requestHeaders);
      if (requestHeaderKeys.length !== 0) {
        console.log("Headers:\n");
        console.group(); // header group
        for (const header of requestHeaderKeys) {
          console.log(`${header}: ${requestHeaders[header]}`);
        }
        console.groupEnd(); // header group
        console.log();
      }
      console.groupEnd(); // request group
      let requestBodyIsJson = false;
      let requestBody: string | object | null = null;
      if (
        requestHeaders["content-type"] &&
        requestHeaders["content-type"].includes("json")
      ) {
        requestBodyIsJson = true;
        requestBody = await networkCall.request.json();
      } else if (
        requestHeaders["content-type"] &&
        requestHeaders["content-type"].includes("multipart/form-data")
      ) {
        // TODO:
        //
        // FormData does not provide a method for retrieving key-value pairs.
        // .toString() does not work if binary data was appended, which is the
        // only time FormData is used.
        //
        // https://github.com/stellar/stellar-anchor-tests/issues/3
        requestBody = "binary data content";
      } else {
        requestBody = await networkCall.request.text();
      }
      if (requestBody) {
        console.log(`Body:\n`);
        if (requestBodyIsJson) {
          console.dir(requestBody, { depth: Infinity, colors: true });
        } else {
          console.group(); // request body group
          console.log(requestBody);
          console.groupEnd();
        }
        console.log();
      }
      console.log("Response:\n");
      console.group(); // response group
      if (networkCall.response) {
        console.log(`Status Code: ${networkCall.response.status}\n`);
        const responseHeaders = Object.fromEntries(
          networkCall.response.headers.entries(),
        );
        const responseHeaderKeys = Object.keys(responseHeaders);
        if (responseHeaderKeys.length !== 0) {
          console.log("Headers:\n");
          console.group(); // header group
          for (const header of responseHeaderKeys) {
            console.log(`${header}: ${responseHeaders[header]}`);
          }
          console.groupEnd(); // header group
          console.log();
        }
        console.log(`Body:\n`);
        const contentType = networkCall.response.headers.get("Content-Type");
        if (contentType && contentType.includes("json")) {
          console.dir(await networkCall.response.json(), {
            depth: Infinity,
            colors: true,
          });
        } else {
          console.group(); // body group
          console.log(await networkCall.response.text());
          console.groupEnd(); // body group
        }
        console.log();
      } else {
        console.log("No response returned.\n");
      }
      console.groupEnd(); // response group
    }
  }
  console.groupEnd(); // result group
}
