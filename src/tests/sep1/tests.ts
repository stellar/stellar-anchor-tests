import fetch from "node-fetch";
import { Request, Response } from "node-fetch";
import toml from "toml";

import { Test, Config, Result, Suite, NetworkCall } from "../../types"

const tomlSuite: Suite = {
	sep: 1,
	name: "Stellar Info File",
	tests: [],
};

const tomlExists: Test = {
	assertion: "The file exists at ./well-known/stellar.toml",
	successMessage: "A TOML-formatted file exists at URL path ./well-known/stellar.toml",
	failureModes: {
		"CONNECTION_ERROR": {
			name: "connection error",
			coloredText: "",
			text: "",
			markdown: ""
		},
		"UNEXPECTED_STATUS_CODE": {
			name: "unexpected status code",
			coloredText: "",
			text: "",
			markdown: ""
		},
		"BAD_CONTENT_TYPE": {
			name: "bad content type",
			coloredText: "",
			text: "",
			markdown: ""
		},
		"PARSE_ERROR": {
			name: "parse error",
			coloredText: "",
			text: "",
			markdown: ""
		}
	},
	async run(config: Config): Promise<Result> {
		const result: Result = {
			test: this,
			suite: tomlSuite,
			networkCalls: []
		}
		const getTomlCall: NetworkCall = {
			request: new Request(
				config.homeDomain + "/.well-known/stellar.toml",
			)
		}
		result.networkCalls.push(getTomlCall);
		let getResponse: Response;
		try {
			getResponse = await fetch(getTomlCall.request.clone());
		} catch (e) {
			result.failure = this.failureModes.CONNECTION_ERROR
			return result;
		}
		getTomlCall.response = getResponse.clone();
		if (getResponse.status !== 200) {
			result.failure = this.failureModes.UNEXPECTED_STATUS_CODE;
			result.expected = 200;
			result.actual = getResponse.status;
		}
		const getResponseContentType = getResponse.headers.get("Content-Type");
		if (!getResponseContentType || !["application/toml", "text/plain"].includes(getResponseContentType)) {
			result.failure = this.failureModes.BAD_CONTENT_TYPE;
			result.expected = "'application/toml' or 'text/plain'";
			result.actual = getResponseContentType;
		}
		try {
			toml.parse(await getResponse.text());
		} catch (e) {
			result.failure = this.failureModes.PARSE_ERROR;
		}
		return result
	},
};
tomlSuite.tests.push(tomlExists);

const suites: Suite[] = [tomlSuite];

export { suites };
