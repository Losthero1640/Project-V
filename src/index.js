import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import http from "http";
import { app } from "./app.js";
import connectDB from "./db/index.js";
import { initializeSocket } from "./socket.js";

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);

// Initialize WebSockets on HTTP server
initializeSocket(httpServer);

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  });

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception thrown:", error);
  process.exit(1);
});