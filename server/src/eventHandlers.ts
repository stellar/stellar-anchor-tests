import { Socket } from "socket.io";
import { getTests, run, Config } from "@stellar/anchor-tests";

import {
  serializeTest,
  serializeTestRun,
  serializeError,
  SerializedError,
} from "./serializers";
import logger from "./logging";

export const getTestsEventName = "getTests";
export const runTestsEventName = "runTests";

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
      `getTests() threw an exception: '${error.name}: ${error.message}'`,
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
  console.log(`received '${runTestsEventName}' request from ${this.id}`);
  try {
    for await (const testRun of run(config)) {
      this.emit(runTestsEventName, serializeTestRun(testRun));
    }
  } catch (e) {
    const error = serializeError(e);
    logger.error(`run() threw an exception: '${error.name}: ${error.message}'`);
    if (callback) callback(error);
    return;
  }
}
