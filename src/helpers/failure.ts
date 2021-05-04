import { Failure } from "../types";

export function makeFailure(failure: Failure, args?: object): Failure {
  failure.message = failure.text(args);
  return failure;
}
