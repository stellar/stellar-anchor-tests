import { default as c } from "ansi-colors";

import { Result, OutputFormat } from "../types";

export function printResult(result: Result, outputFormat: OutputFormat) {
  if (outputFormat === "json") {
    console.dir({
      assertion: result.test.assertion,
      success: !result.failure,
      message: result.failure
        ? result.failure.message
        : result.test.successMessage,
      expected: result.expected ? result.expected : null,
      actual: result.actual ? result.actual : null,
      sep: result.suite ? (result.suite.sep ? result.suite.sep : null) : null,
      suiteName: result.suite ? result.suite.name : null,
    });
  } else if (outputFormat === "coloredText") {
    let color = result.failure ? c.red : c.green;
    let symbol = result.failure ? c.symbols.cross : c.symbols.check;
    let symbolLabel: string = result.failure ? "FAIL" : "PASS";
    let header = `${symbol} ${symbolLabel} `;
    if (result.suite) {
      if (result.suite.sep)
        header += `SEP-${result.suite.sep} ${c.symbols.pointer} `;
      header += `${result.suite.name} ${c.symbols.pointer} `;
    }
    header += `${result.test.assertion} \n`;
    console.log(color(header));
    console.group();
    if (result.failure) {
      console.log(c.bold("Failure Type:\n"));
      console.group();
      console.log(`${result.failure.name}\n`);
      console.groupEnd();
      console.log(c.bold("Description:\n"));
      console.group();
      console.log(result.failure.message + "\n");
      if (result.expected && result.actual) {
        console.log(`Expected: ${result.expected}`);
        console.log(`Received: '${result.actual}'\n`);
      }
    } else {
      console.log(result.test.successMessage + "\n");
    }
    console.groupEnd();
  }
}
