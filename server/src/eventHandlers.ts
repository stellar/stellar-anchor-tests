import { Socket } from "socket.io";
import { getTests, run, Config } from "@stellar/anchor-tests";

import {
  serializeTest,
  serializeTestRun,
  serializeError,
  SerializedError,
} from "./serializers";
import logger from "./logging";
import { anchorTestsPkgVersion } from "./anchorTestsPkgVersion";

export const getTestsEventName = "getTests";
export const runTestsEventName = "runTests";
export const getVersionEventName = "getVersion";

export async function onGetTests(
  this: Socket,
  config: Config,
  callback: (error: SerializedError) => void,
) {
  logger.info(`received '${getTestsEventName}' request from ${this.id}`);
  let tests;
  try {
    tests = await getTests(config);
  } catch (e) {
    const error = serializeError(e);
    logger.error(
      `getTests() threw an exception: '${error.name}: ${error.message}\n${e.stack}'`,
    );
    if (callback) callback(error);
    return;
  }
  this.emit(getTestsEventName, tests.map(serializeTest));
}

export async function onRunTests(
  this: Socket,
  config: Config,
  callback: (error: SerializedError) => void,
) {
  logger.info(`received '${runTestsEventName}' request from ${this.id}`);
  try {
    for await (const testRun of run(config)) {
      this.emit(runTestsEventName, await serializeTestRun(testRun));
    }
  } catch (e) {
    const error = serializeError(e);
    logger.error(
      `run() threw an exception: '${error.name}: ${error.message}'\n${e.stack}`,
    );
    if (callback) callback(error);
    return;
  }
}

export async function onGetVersion(
  this: Socket,
  callback: (error: SerializedError) => void,
) {
  logger.info(`received '${getVersionEventName}' request from ${this.id}`);
  try {
    this.emit(getVersionEventName, anchorTestsPkgVersion());
  } catch (e) {
    const error = serializeError(e);
    logger.error(
      `anchorTestsPkgVersion() threw an exception: '${error.name}: ${error.message}\n${e.stack}'`,
    );
    if (callback) callback(error);
    return;
  }
}
