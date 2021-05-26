import { ReadStream, statSync } from "fs";
import { Request } from "node-fetch";
import FormData from "form-data";
import { binaryFields } from "../schemas/sep12";

export function makeSep12Request(requestData: any): Request {
  let requestBody: string | FormData;
  if (hasBinaryFields(requestData.data)) {
    requestBody = new FormData();
    for (const key in requestData.data) {
      if (requestData.data[key] instanceof ReadStream) {
        const stats = statSync(requestData.data[key].path);
        requestBody.append(key, requestData.data[key], {
          knownLength: stats.size,
        });
      } else {
        requestBody.append(key, requestData.data[key]);
      }
    }
  } else {
    requestBody = JSON.stringify(requestData);
    requestData.headers["Content-Type"] = "application/json";
  }
  return new Request(requestData.url, {
    method: "PUT",
    headers: requestData.headers,
    body: requestBody,
  });
}

function hasBinaryFields(requestData: any): boolean {
  for (const key in requestData) {
    if (binaryFields.includes(key)) {
      return true;
    }
  }
  return false;
}
