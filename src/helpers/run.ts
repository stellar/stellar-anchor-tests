import { Config, TestRun } from "../types";
import { getSuites, runSuite } from "./suite";

export async function* run(config: Config): AsyncGenerator<TestRun> {
  const suites = getSuites(config);
  for (const suite of suites) {
    for await (const testRun of runSuite(suite, config)) {
      yield testRun;
    }
  }
}
