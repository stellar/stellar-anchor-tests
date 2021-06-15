import io from "socket.io-client";

export const socket = io(
  process.env.REACT_APP_SERVER_HOST || "https://localhost:8000",
  { path: "/api" }
);
