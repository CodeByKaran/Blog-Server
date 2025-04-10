import "dotenv/config";
import "./config/eventEmitter.config";
import "./events/user.event";
import "./config/cloudinary.config";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import Logger from "./utils/logger";
import { errorHandler, notFoundHandler } from "./utils/errorHandler";
import cookieParser from "cookie-parser";

// Add this before your routes

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// limit api rate
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
  skip: (req, res) => {
    const devIPs = ["::ffff:127.0.0.1"];
    const isDevMode = process.env.NODE_ENV === "development";
    const isDevIP = devIPs.includes(req.ip!);

    return isDevMode || isDevIP;
  },
});
app.use(limiter);

// server health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// routes
import userRouter from "./routes/user.route";
import blogRouter from "./routes/blog.route";
import commentRouter from "./routes/comments.route";
import likesRouter from "./routes/likes.route";
import saveRouter from "./routes/saves.route";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likesRouter);
app.use("/api/v1/saves", saveRouter);

// Handle 404 - Keep this after all defined routes
app.use(notFoundHandler);

// Global error handler - Keep this last
app.use(errorHandler);

app.listen(PORT, () => {
  Logger.info(`🚀 Server running on port ${PORT}`);
});
