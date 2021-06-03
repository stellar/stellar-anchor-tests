import io from "socket.io-client";

import { MODE } from "constants/env";

export const socket = io(
  process.env.NODE_ENV === MODE.DEVELOPMENT
    ? "http://localhost:8000"
    : "https://api.stellar-anchor-tests.com",
  {
    withCredentials: true,
  }
);
