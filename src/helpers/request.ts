import fetch from "node-fetch";

import { NetworkCall, Result } from "../types";
import { makeFailure, genericFailures } from "./failure";

/*
 * Makes the request specified by networkCall and performs status checks.
 * If contentType is specified, the content type is also checked and
 * the response body is return.
 */
export async function makeRequest(
  networkCall: NetworkCall,
  expectedStatus: number,
  result: Result,
  contentType?: string,
): Promise<any> {
  try {
    networkCall.response = await fetch(networkCall.request.clone());
  } catch {
    result.failure = makeFailure(genericFailures.CONNECTION_ERROR, {
      url: networkCall.request.url,
    });
    return;
  }
  if (networkCall.response.status !== expectedStatus) {
    result.failure = makeFailure(genericFailures.UNEXPECTED_STATUS_CODE, {
      url: networkCall.request.url,
      method: networkCall.request.method,
    });
    result.expected = expectedStatus;
    result.actual = networkCall.response.status;
    return;
  }
  if (!contentType) return;
  const responseContentType = networkCall.response.headers.get("Content-Type");
  if (!responseContentType || !responseContentType.includes(contentType)) {
    result.failure = makeFailure(genericFailures.BAD_CONTENT_TYPE, {
      method: networkCall.request.method,
      url: networkCall.request.method,
    });
    return result;
  }
  if (responseContentType.includes(contentType)) {
    return await networkCall.response.clone().json();
  } else {
    return await networkCall.response.clone().text();
  }
}
