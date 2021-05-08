import { Failure } from "../types";

export function makeFailure(failure: Failure, args?: object): Failure {
  failure.message = failure.text(args);
  return failure;
}

// generic failures

export const connectionFailure: Failure = {
  name: "connection error",
  text(args: any): string {
    return (
      `A connection failure occured when making a request to: ` +
      `\n\n${args.url}\n\n` +
      `Make sure that CORS is enabled.`
    );
  },
};

export const unexpectedStatusCode: Failure = {
  name: "unexpected status code",
  text(args: any): string {
    return (
      "An unexpected status code was included in the response to: " +
      `\n\n${args.url}`
    );
  },
};
