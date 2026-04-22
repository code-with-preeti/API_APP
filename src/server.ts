import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes";
import monitoredAPIRoutes from "./routes/monitoredAPIRoutes";
import publicRoutes from "./routes/publicRoutes";

const app = express();
dotenv.config();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
    credentials: true,
  })
);
app.use(express.json());
// Load env before starting background worker (Prisma needs DATABASE_URL).
void import("./worker");

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", monitoredAPIRoutes);
app.use("/api", publicRoutes);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
);

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
