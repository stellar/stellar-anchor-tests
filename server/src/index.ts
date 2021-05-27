import express from "express";
import { Server, Socket } from "socket.io";
import { createServer } from "http";

import {
  getTestsEventName,
  runTestsEventName,
  onGetTests,
  onRunTests,
} from "./eventHandlers";
import logger from "./logging";

const port = 8000;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

io.on("connection", (socket: Socket) => {
  socket.on(getTestsEventName, onGetTests);
  socket.on(runTestsEventName, onRunTests);
  socket.on("disconnect", (reason: string) => {
    logger.info(`socket ${socket.id} disconnected: ${reason}`);
  });
  socket.onAny((event, ..._args) => {
    if (![getTestsEventName, runTestsEventName].includes(event)) {
      logger.warning(`unexpected event received: ${event}`);
    }
  });
});

httpServer.listen(port);
logger.info(`Server listening on port ${port}`);
