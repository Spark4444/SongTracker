import { Router } from "express";
import { getAllUsers, findUserByEmail, createUser, addSongToCompleted, addSongToTracked, removeSongFromTracked, getTrackedSongs, getCompletedSongs, removeSongFromCompleted, verifyUserPassword } from "../controllers/usersController.js";
import WebError from "../WebError/WebError.js";
import generateNavLink, { generateNavLinksReq } from "../functions/linkGenerator.js";
import tryCatch from "../functions/tryCatch.js";

const router = Router();

let links = generateNavLink();

// Users list route
router.get("/users", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const users = await getAllUsers();
        
        const mappedUsers = users.map((user) => ({
            name: user.name,
            email: user.email
        }));
        const links = generateNavLinksReq(req);
        res.render("users", { title: "User List", users: mappedUsers, links });
    });
});

// User profile route
router.get("/users/:email", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const { email } = req.params;
        const user = await findUserByEmail(email);
        if (!user) {
            throw new WebError("User not found", 404);
        }
        const isOwnProfile = req.session.user && req.session.user.email === email;
        const links = generateNavLinksReq(req);
        res.render("profile", { title: user.name, user, links, isOwnProfile, sessionUser: req.session.user });
    });
});

// Logged-in user's profile route
router.get("/profile", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (!req.session.user) {
            throw new WebError("Not logged in", 401);
        }
        const user = await findUserByEmail(req.session.user.email);
        const links = generateNavLinksReq(req);
        res.render("myProfile", { title: "My Profile", user, links });
    });
});

// Add song to tracked list
router.post("/profile/tracked", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (!req.session.user) {
            throw new WebError("Not logged in", 401);
        }

        const { songId, songName } = req.body;
        const trackedSongs = await getTrackedSongs(req.session.user.id);
        const isTracked = trackedSongs.some((song) => song.songId === songId);

        if (isTracked) {
            // Remove from trackedSongs if already present
            await removeSongFromTracked(req.session.user.id, songId);
            res.status(200).json({ success: true, message: "Song removed from tracked list" });
        } else {
            const completedSongs = await getCompletedSongs(req.session.user.id);
            const isCompleted = completedSongs.some((song) => song.songId === songId);
            
            if (isCompleted) {
                // Remove from completedSongs if present
                await removeSongFromCompleted(req.session.user.id, songId);
            }

            await addSongToTracked(req.session.user.id, songId, songName);
            res.status(200).json({ success: true, message: "Song added to tracked list" });
        }
    });
});

// Add song to completed list
router.post("/profile/completed", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (!req.session.user) {
            throw new WebError("Not logged in", 401);
        }

        const { songId, songName } = req.body;
        const completedSongs = await getCompletedSongs(req.session.user.id);
        const isCompleted = completedSongs.some((song) => song.songId === songId);

        if (isCompleted) {
            // Remove from completedSongs if already present
            await removeSongFromCompleted(req.session.user.id, songId);
            res.status(200).json({ success: true, message: "Song removed from completed list" });
        } else {
            const trackedSongs = await getTrackedSongs(req.session.user.id);
            const isTracked = trackedSongs.some((song) => song.songId === songId);
            
            if (isTracked) {
                // Remove from trackedSongs if present
                await removeSongFromTracked(req.session.user.id, songId);
            }

            await addSongToCompleted(req.session.user.id, songId, songName);
            res.status(200).json({ success: true, message: "Song marked as completed" });
        }
    });
});

// Move song from tracked to completed
router.post("/profile/move-to-completed", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (!req.session.user) {
            throw new WebError("Not logged in", 401);
        }

        const { songId, songName } = req.body;
        
        // Remove from tracked and add to completed
        await removeSongFromTracked(req.session.user.id, songId);
        await addSongToCompleted(req.session.user.id, songId, songName);
        
        res.status(200).json({ success: true, message: "Song marked as completed" });
    });
});

// Remove song from tracked or completed list
router.post("/profile/remove-song", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (!req.session.user) {
            throw new WebError("Not logged in", 401);
        }

        const { songId, listType } = req.body;
        
        if (listType === 'tracked') {
            await removeSongFromTracked(req.session.user.id, songId);
            res.status(200).json({ success: true, message: "Song removed from tracked list" });
        } else if (listType === 'completed') {
            await removeSongFromCompleted(req.session.user.id, songId);
            res.status(200).json({ success: true, message: "Song removed from completed list" });
        } else {
            throw new WebError("Invalid list type", 400);
        }
    });
});

// User registration route
router.post("/register", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (req.session.user) {
            throw new WebError("Already logged in", 400);
        }
        
        const { 
            name,
            email,
            password
        } = req.body;

        const newUser = await createUser({ name, email, password });

        if (!req.session) req.session = {};
        req.session.user = { 
            id: newUser.id,
            name: newUser.name, 
            email: newUser.email, 
            completedSongs: [], 
            trackedSongs: [] 
        };

        links = generateNavLink(true, `/users/${newUser.email}`);

        res.status(201).render("registerSuccess", { title: "Registration Successful", user: newUser, links });
    });
});

// User login route
router.post("/login", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (req.session.user) {
            throw new WebError("Already logged in", 400);
        }

        const { email, password } = req.body;

        const user = await verifyUserPassword(email, password);

        if (!user) {
            throw new WebError("Invalid email or password", 401);
        }

        if (!req.session) req.session = {};
        req.session.user = { 
            id: user.id,
            name: user.name, 
            email: user.email, 
            completedSongs: user.completedSongs || [], 
            trackedSongs: user.trackedSongs || [] 
        };
        links = generateNavLink(true, `/users/${user.email}`);

        res.status(200).render("loginSuccess", { title: "Login Successful", user, links });
    });
});

// User logout route
router.post("/logout", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (req.session) {
            req.session.destroy(err => {
                if (err) {
                    return next(new WebError("Logout failed", 500));
                }

                links = generateNavLink(false);
                res.status(200).json({ success: true, message: "Logged out successfully" });
            });
        } else {
            throw new WebError("No active session", 400);
        }
    });
});

export default router;