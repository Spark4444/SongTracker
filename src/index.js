import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/userRoutes.js";
import staticRouter from "./routes/staticRouter.js";
import musicRouter from "./routes/musicRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import makeBackups from "./db/backup.js";

makeBackups();

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: process.env.KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000
    },
  })
);

// Use the routers for handling routes
app.use("/", staticRouter);
app.use("/", userRouter);
app.use("/", musicRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).render("404");
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});