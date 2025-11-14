import { Router } from "express";
import fs from "fs";
import path from "path";
import tryCatch from "../functions/tryCatch.js";
import generateNavLinks, { generateNavLinksReq } from "../functions/linkGenerator.js";

const router = Router();

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(process.platform === "win32" ? __filename.slice(1) : __filename);

const staticViewsDir = path.join(__dirname, "../views/static");

let links = generateNavLinks();

// Home route
router.get("/", (req, res) => {
    tryCatch(req, res, null, () => {
        links = generateNavLinksReq(req);
        res.render("index", { title: "Home", links });
    });
});

// Dynamically create routes for static views
fs.readdirSync(staticViewsDir).forEach(file => {
    if (file.endsWith(".ejs")) {
        const route = `/${file.replace(".ejs", "").replace("_", "/")}`.toLowerCase();

        const title = file.replace(".ejs", "").replace("_", " ");
        router.get(route, (req, res, next) => {
            tryCatch(req, res, next, () => {
                links = generateNavLinksReq(req);
                res.render(path.join(staticViewsDir, file), { title, links });
            });
        });
    }
});

export default router;
