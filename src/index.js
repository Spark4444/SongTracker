import express from "express";
import session from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/userRoutes.js";
import staticRouter from "./routes/staticRouter.js";
import musicRouter from "./routes/musicRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { generateNavLinksReq } from "./utils/linkGenerator.js";
import requestLogger from "./middleware/requestLogger.js";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;
const prisma = new PrismaClient();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // 2 minutes - cleanup expired sessions
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  })
);

// Request logging middleware
app.use(requestLogger);

// Use the routers for handling routes
app.use("/", staticRouter);
app.use("/", userRouter);
app.use("/", musicRouter);

// 404 handler
app.use((req, res) => {
  const links = generateNavLinksReq(req);
  res.status(404).render("404", { title: "404 - Page Not Found", links });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});