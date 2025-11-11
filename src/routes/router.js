import { Router } from "express";
import fs, { link } from "fs";
import path from "path";
import { writeNewUser, ensureCorrectUserFormat, readAllUsers, findUserByEmail } from "../controllers/usersController.js";
import bcrypt from "bcrypt";
import WebError from "../WebError/WebError.js";
import generateNavLink from "../functions/linkGenerator.js";

const router = Router();

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const staticViewsDir = path.join(__dirname, "../views/static");

let links = generateNavLink();

function tryCatch(req, res, next, callback) {
    try {
        callback(req, res);
    } catch (error) {
        next(error);
    }
}

// Dynamically create routes for static views
fs.readdirSync(staticViewsDir).forEach(file => {
    if (file.endsWith(".ejs")) {
        const route = `/${file.replace(".ejs", "").replace("_", "/")}`;
        const title = file.replace(".ejs", "").replace("_", " ");
        router.get(route, (req, res, next) => {
            tryCatch(req, res, next, () => {
                res.render(path.join(staticViewsDir, file), { title, links });
            });
        });
    }
});

function addNewUserRoute(userId, user) {
    router.get(`/users/${userId}`, (req, res, next) => {
        tryCatch(req, res, next, () => {
            const currentUserName = req.session && req.session.user ? req.session.user.name : null;
            const title = currentUserName === user.name ? "My Profile" : `${user.name}'s Profile`;
            res.render("profile", { title, user, links });
        });
    });
}

const users = readAllUsers();

users.forEach((user, index) => {
    addNewUserRoute(index, user);
});

router.post("/register", (req, res, next) => {
    tryCatch(req, res, next, () => {
        if (req.session.user) {
            throw new WebError("Already logged in", 400);
        }
        
        const { 
            name,
            email,
            password,
            trackedSongs = [],
            completedSongs = []
        } = req.body;

        const newUser = { name, email, password, trackedSongs, completedSongs };

        ensureCorrectUserFormat(newUser);

        writeNewUser(newUser);

        const newUserId = readAllUsers().length - 1;

        if (!req.session) req.session = {};
        req.session.user = { id: newUserId, name: newUser.name, email: newUser.email };

        addNewUserRoute(newUserId, newUser);
        links = generateNavLink(true, `/users/${newUserId}`);

        res.status(201).render("registerSuccess", { title: "Registration Successful", user: newUser, links });
    });
});

router.post("/login", (req, res, next) => {
    tryCatch(req, res, next, () => {
        if (req.session.user) {
            throw new WebError("Already logged in", 400);
        }

        const { email, password } = req.body;

        const user = findUserByEmail(email);

        const passwordMatches = bcrypt.compareSync(password, user.password);

        if (!passwordMatches) {
            throw new WebError("Invalid email or password", 401);
        }

        const users = readAllUsers();
        const userId = users.findIndex(u => u.email === email);

        if (!req.session) req.session = {};
        req.session.user = { id: userId, name: user.name, email: user.email };
        req.session.profileLink = `/users/${userId}`;
        links = generateNavLink(true, `/users/${userId}`);

        res.status(200).render("loginSuccess", { title: "Login Successful", user, profileLink: req.session.profileLink, links });
    });
});

router.post("/logout", (req, res, next) => {
    tryCatch(req, res, next, () => {
        if (req.session) {
            req.session.destroy(err => {
                if (err) {
                    return next(new WebError("Logout failed", 500));
                }

                links = generateNavLink(false);
                res.status(200).render("logout", { title: "Logged Out", links });
            });
        } else {
            throw new WebError("No active session", 400);
        }
    });
});

export default router;