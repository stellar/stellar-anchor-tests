import { URL, URLSearchParams } from "url";
import { Test, Result, TestRun, SEP, NetworkCall } from "@stellar/anchor-tests";

export interface SerializedTest {
  sep: SEP;
  assertion: string;
  group: string;
  context: { expects: string[]; provides: string[] };
  failureModes: string[];
}

export interface SerializedResult {
  networkCalls: SerializedNetworkCall[];
  failureMode: string | null;
  failureMessage: string | null;
  skipped: boolean;
  expected?: string;
  actual?: string;
}

export interface SerializedTestRun {
  test: SerializedTest;
  result: SerializedResult;
}

export interface SerializedNetworkCall {
  request: {
    url: string;
    method: string;
    headers: Record<string, string | string[]>;
    params?: Record<string, string | string[]>;
    body?: NetworkCallBody;
  };
  response?: null | {
    headers: Record<string, string | string[]>;
    status: number;
    body?: NetworkCallBody;
  };
}

type NetworkCallBody =
  | string
  | number
  | boolean
  | null
  | NetworkCallBody[]
  | { [key: string]: NetworkCallBody };

export interface SerializedError {
  name: string;
  message: string;
}

export function serializeTest(test: Test): SerializedTest {
  return {
    assertion: test.assertion,
    group: test.group,
    sep: test.sep,
    context: {
      expects: Object.keys(test.context.expects),
      provides: Object.keys(test.context.provides),
    },
    failureModes: Object.values(test.failureModes).map((fm) => fm.name),
  };
}

export async function serializeResult(
  result: Result,
): Promise<SerializedResult> {
  let failureMode = null;
  let failureMessage = null;
  if (result.failure) {
    failureMode = result.failure.name;
    failureMessage = result.failure.message || null;
  }
  const serializedResult: SerializedResult = {
    networkCalls: await Promise.all(
      result.networkCalls.map(serializeNetworkCall),
    ),
    failureMode: failureMode,
    failureMessage: failureMessage,
    skipped: Boolean(result.skipped),
  };
  if (result.expected)
    serializedResult.expected = JSON.stringify(result.expected);
  if (result.actual) serializedResult.actual = JSON.stringify(result.actual);
  return serializedResult;
}

export async function serializeTestRun(
  testRun: TestRun,
): Promise<SerializedTestRun> {
  return {
    test: serializeTest(testRun.test),
    result: await serializeResult(testRun.result),
  };
}

export function serializeError(error: Error): SerializedError {
  return {
    name: error.name,
    message: error.message,
  };
}

async function serializeNetworkCall(
  networkCall: NetworkCall,
): Promise<SerializedNetworkCall> {
  const serializedNetworkCall: SerializedNetworkCall = {
    request: {
      url: networkCall.request.url,
      method: networkCall.request.method,
      headers: networkCall.request.headers.raw(),
    },
  };
  const params = getParamsFromSearchString(
    new URL(networkCall.request.url).searchParams.toString(),
  );
  if (Object.keys(params).length > 0)
    serializedNetworkCall.request.params = params;
  if (networkCall.request.body) {
    const contentType = networkCall.request.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      serializedNetworkCall.request.body = await networkCall.request
        .clone()
        .json();
    } else if (contentType.includes("multipart/form-data")) {
      // TODO
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      serializedNetworkCall.request.body = getParamsFromSearchString(
        await networkCall.request.text(),
      );
    } else {
      serializedNetworkCall.request.body = await networkCall.request.text();
    }
  }
  if (networkCall.response) {
    serializedNetworkCall.response = {
      headers: networkCall.response.headers.raw(),
      status: networkCall.response.status,
    };
    if (networkCall.response.body) {
      const contentType =
        networkCall.response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        serializedNetworkCall.response.body = await networkCall.response
          .clone()
          .json();
      } else {
        serializedNetworkCall.response.body = await networkCall.response
          .clone()
          .text();
      }
    }
  }
  return serializedNetworkCall;
}

function getParamsFromSearchString(
  searchString: string,
): Record<string, string | string[]> {
  let params: Record<string, string | string[]> = {};
  const searchParams = new URLSearchParams(searchString);
  for (const key of Object.keys(searchParams)) {
    const values = searchParams.getAll(key);
    if (values.length === 1) {
      params[key] = values[0];
    } else {
      params[key] = values;
    }
  }
  return params;
}
