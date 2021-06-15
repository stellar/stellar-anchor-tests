import io from "socket.io-client";

export const socket = io(
  process.env.REACT_APP_SERVER_HOST || "http://localhost:8000",
  { path: "/api" }
);
