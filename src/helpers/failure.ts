import { Config, Failure } from "../types";

export function makeFailure(
  failure: Failure,
  args: object,
  config: Config,
): Failure {
  if (config.outputFormat === "text") {
    failure.message = failure.text(args);
  } else {
    failure.message = failure.markdown(args);
  }
  return failure;
}
