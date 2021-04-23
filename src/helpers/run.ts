import { Config, Result } from "../types";
import { getSuites, runSuite } from "./suite";

export async function* run(config: Config): AsyncGenerator<Result> {
	const suites = getSuites(config);
    for (const suite of suites) {
        for await (const result of runSuite(suite, config)) {
            yield result; 
        }
    }
}
