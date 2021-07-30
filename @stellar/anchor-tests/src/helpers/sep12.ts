import { ReadStream, statSync } from "fs";
import { Request } from "node-fetch";
import FormData from "form-data";
import { binaryFields } from "../schemas/sep12";

export function makeSep12Request(requestData: any): Request {
  let requestBody: string | FormData;
  if (hasBinaryFields(requestData.data)) {
    requestBody = new FormData();
    for (const key in requestData.data) {
      if (
        typeof requestData.data[key] === "object" &&
        requestData.data[key].data instanceof ReadStream
      ) {
        const stats = statSync(requestData.data[key].data.path);
        requestBody.append(key, requestData.data[key].data, {
          knownLength: stats.size,
          contentType: requestData.data[key].contentType,
          filename: requestData.data[key].fileName,
        });
      } else if (
        typeof requestData.data[key] === "object" &&
        requestData.data[key].data instanceof Buffer
      ) {
        requestBody.append(key, requestData.data[key].data, {
          knownLength: requestData.data[key].data.length,
          contentType: requestData.data[key].contentType,
          filename: requestData.data[key].fileName,
        });
      } else {
        requestBody.append(key, requestData.data[key]);
      }
    }
  } else {
    requestBody = JSON.stringify(requestData.data);
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
