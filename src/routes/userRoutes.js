import { Router } from "express";
import { readAllUsers, writeUsers, findUserByEmail, createUser } from "../controllers/usersController.js";
import bcrypt from "bcrypt";
import WebError from "../WebError/WebError.js";
import generateNavLink from "../functions/linkGenerator.js";
import tryCatch from "../functions/tryCatch.js";

const router = Router();

let links = generateNavLink();

let users = readAllUsers();

// Users list route
router.get("/users", (req, res, next) => {
    tryCatch(req, res, next, () => {
        const mappedUsers = users.map((user) => ({
            name: user.name,
            email: user.email
        }));
        res.render("users", { title: "User List", users, links });
    });
});

// User profile route
router.get("/users/:email", (req, res, next) => {
    tryCatch(req, res, next, () => {
        const { email } = req.params;
        const user = findUserByEmail(users, email);
        if (!user) {
            throw new WebError("User not found", 404);
        }
        res.render("profile", { title: user.name, user, links });
    });
});

// Logged-in user's profile route
router.get("/profile", (req, res, next) => {
    tryCatch(req, res, next, () => {
        if (!req.session.user) {
            throw new WebError("Not logged in", 401);
        }
        const user = findUserByEmail(users, req.session.user.email);
        res.render("myProfile", { title: "My Profile", user, links });
    });
});

// User registration route
router.post("/register", (req, res, next) => {
    tryCatch(req, res, next, () => {
        if (req.session.user) {
            throw new WebError("Already logged in", 400);
        }
        
        const { 
            name,
            email,
            password
        } = req.body;

        const newUser = { name, email, password };

        users = createUser(users, newUser);

        if (!req.session) req.session = {};
        req.session.user = { name: newUser.name, email: newUser.email };

        links = generateNavLink(true, `/users/${newUser.email}`);

        res.status(201).render("registerSuccess", { title: "Registration Successful", user: newUser, links });
    });
});

// User login route
router.post("/login", (req, res, next) => {
    tryCatch(req, res, next, () => {
        if (req.session.user) {
            throw new WebError("Already logged in", 400);
        }

        const { email, password } = req.body;

        const user = findUserByEmail(users, email);

        const passwordMatches = bcrypt.compareSync(password, user ? user.password : "");

        if (!passwordMatches) {
            throw new WebError("Invalid email or password", 401);
        }

        if (!req.session) req.session = {};
        req.session.user = { name: user.name, email: user.email };
        links = generateNavLink(true, `/users/${user.email}`);

        res.status(200).render("loginSuccess", { title: "Login Successful", user, links });
    });
});

// User logout route
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

// Persist users data on server exit or restart
const saveUsersOnExit = () => {
    writeUsers(users);
};

process.on("exit", saveUsersOnExit);
process.on("SIGINT", () => {
    saveUsersOnExit();
    process.exit(0);
});
process.on("SIGTERM", () => {
    saveUsersOnExit();
    process.exit(0);
});
process.on("SIGUSR2", () => {
    // SIGUSR2 is what nodemon uses
    saveUsersOnExit();
    process.exit(0);
});

export default router;