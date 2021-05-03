import { Config, Failure } from "../types";

export function makeFailure(
  failure: Failure,
  args: object,
  config: Config,
): Failure {
  if (config.outputFormat === "text" || config.outputFormat === "coloredText") {
    failure.message = failure.text(args);
  }
  return failure;
}
