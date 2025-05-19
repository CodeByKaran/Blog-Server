import "dotenv/config";
import "./config/eventEmitter.config";
import "./events/user.event";
import "./config/cloudinary.config";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import Tokens from "csrf";

import { errorHandler, notFoundHandler } from "./utils/errorHandler";
import cookieParser from "cookie-parser";

// Add this before your routes

const app: Application = express();
const PORT = process.env.PORT || 3000;
const tokens = new Tokens();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

//csrf
app.use((req, res, next) => {
  if (!req.cookies.csrfSecret) {
    const secret = tokens.secretSync();

    res.cookie("csrfSecret", secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.locals.csrfSecret = secret;
  } else {
    res.locals.csrfSecret = req.cookies.csrfSecret;
  }

  const token = tokens.create(res.locals.csrfSecret);
  res.locals.csrfToken = token;

  next();
});

app.use((req, res, next) => {
  const exemptPaths = ["/api/v1/user/sign-in", "/api/v1/user/sign-up"];
  console.log(req.path);

  if (
    exemptPaths.includes(req.path) ||
    ["GET", "HEAD", "OPTIONS"].includes(req.method)
  ) {
    return next();
  }

  const token =
    res.locals.csrfToken ||
    req.headers["x-csrf-token"] ||
    req.headers["x-xsrf-token"] ||
    req.body?._csrf;

  if (!token || !tokens.verify(req.cookies.csrfSecret, token)) {
    const err = new ApiError(
      "csrf token issue check that you provided crsf token in headers if provided then it is not valid refresh csrf token",
      HttpStatus.NOT_FOUND
    );
    return next(err);
  }

  next();
});

// Route to get CSRF token for client-side use
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: res.locals.csrfToken });
});

//limit api rate
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
  skip: (req, res) => {
    const devIPs = ["::ffff:127.0.0.1"];
    const isDevIP = devIPs.includes(req.ip!);

    return isDevIP;
  },
});
app.use(limiter);

// server health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});
// get csrf token
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: res.locals.csrfToken });
});

// routes
import userRouter from "./routes/user.route";
import blogRouter from "./routes/blog.route";
import commentRouter from "./routes/comments.route";
import likesRouter from "./routes/likes.route";
import saveRouter from "./routes/saves.route";
import { ApiError, HttpStatus } from "./utils/apiResponse";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/like", likesRouter);
app.use("/api/v1/save", saveRouter);

// Handle 404 - Keep this after all defined routes
app.use(notFoundHandler);

// Global error handler - Keep this last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
