import express from "express";
import cors from "cors";
import http from "http";
import authRoutes from "./routes/authRoutes";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import taskRoutes from "./routes/taskRoutes";
import monitoredAPIRoutes from "./routes/monitoredAPIRoutes";
import publicRoutes from "./routes/publicRoutes";

// ── NEW ──────────────────────────────────────────────────────────────────────
import apiKeyRoutes from "./routes/apiKeys";
import { apiKeyAuth } from "./middleware/apiKeyAuth";
import { rateLimiter, getRateLimitStats } from "./middleware/rateLimiter";
import { redisSubscriber } from "./lib/redis";
import { API_UPDATE_CHANNEL } from "./queues/apiCheckQueue";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server, path: "/ws" });
const clients = new Map<WebSocket, number>(); 

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", monitoredAPIRoutes);
app.use("/api", publicRoutes);

// ── NEW: API key management (JWT-protected — uses your existing auth cookie) ─
app.use("/api/keys", apiKeyRoutes);


wsServer.on("connection", (socket, request) => {
  try {
    const host = request.headers.host ?? "localhost";
    const reqUrl = new URL(request.url ?? "", `http://${host}`);
    const token = reqUrl.searchParams.get("token");
    if (!token) {
      socket.close(1008, "Missing token");
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    clients.set(socket, decoded.userId);
  } catch {
    socket.close(1008, "Invalid token");
    return;
  }

  socket.on("close", () => {
    clients.delete(socket);
  });
});

void redisSubscriber.subscribe(API_UPDATE_CHANNEL);

redisSubscriber.on("message", (channel, payload) => {
  if (channel !== API_UPDATE_CHANNEL) return;

  let event: { userId?: number };

  try {
    event = JSON.parse(payload);
  } catch {
    return;
  }

  for (const [socket, userId] of clients.entries()) {
    if (event.userId !== userId) continue;
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
});

const port = Number(process.env.PORT ?? 4000);

server.listen(port, () => {
  console.log(`Server + WS running on http://localhost:${port}`);
});