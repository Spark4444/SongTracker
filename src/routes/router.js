import { Router } from "express";
import fs from "fs";
import path from "path";
import { writeNewUser, ensureCorrectUserFormat, readAllUsers } from "../controllers/usersController.js";
import session from "express-session";

const router = Router();

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const staticViewsDir = path.join(__dirname, "../views/static");

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
                res.render(path.join(staticViewsDir, file), { title });
            });
        });
    }
});

function addNewUserRoute(userId, user) {
    router.get(`/users/${userId}`, (req, res, next) => {
        tryCatch(req, res, next, () => {
            res.render("userProfile", { title: session.user.name === user.name ? "My Profile" : `${user.name}'s Profile`, user });
        });
    });
}

const users = readAllUsers();

users.forEach((user, index) => {
    addNewUserRoute(index, user);
});

router.post("/register", (req, res, next) => {
    tryCatch(req, res, next, () => {
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

        session.user = { id: newUserId, name: newUser.name, email: newUser.email };

        addNewUserRoute(newUserId, newUser);

        res.status(201).render("registerSuccess", { title: "Registration Successful", user: newUser, accountLink: `/users/${newUserId}` });
    });
});

export default router;