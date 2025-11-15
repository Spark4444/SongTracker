import { Router } from "express";
import { getAllUsers, findUserById, createUser, addSongToCompleted, addSongToTracked, removeSongFromTracked, getTrackedSongs, getCompletedSongs, removeSongFromCompleted, verifyUserPassword } from "../controllers/usersController.js";
import WebError from "../utils/WebError.js";
import generateNavLink, { generateNavLinksReq } from "../utils/linkGenerator.js";
import tryCatch from "../utils/tryCatch.js";
import { auth, alreadyAuth, adminAuth } from "../middleware/auth.js";

const router = Router();

let links = generateNavLink();

// Users list route - ADMIN ONLY
router.get("/users", adminAuth, (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const users = await getAllUsers();
        
        const mappedUsers = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }));
        const links = generateNavLinksReq(req);
        res.render("users", { title: "User List", users: mappedUsers, links });
    });
});

// User profile route
router.get("/users/:id", (req, res, next) => {
    tryCatch(req, res, next, async () => {
        const { id } = req.params;
        const user = await findUserById(id);
        if (!user) {
            throw new WebError("User not found", 404);
        }
        const links = generateNavLinksReq(req);
        res.render("profile", { title: user.name, links, user, currentUser: req.session.user});
    });
});

// Logged-in user's profile route - AUTH REQUIRED
router.get("/profile", auth, (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (!req.session.user) {
            throw new WebError("Not logged in", 401);
        }
        const user = await findUserById(req.session.user.id);
        const links = generateNavLinksReq(req);
        res.render("myProfile", { title: "My Profile", user, links });
    });
});

// Add song to tracked list - AUTH REQUIRED
router.post("/profile/tracked", auth, (req, res, next) => {
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

// Add song to completed list - AUTH REQUIRED
router.post("/profile/completed", auth, (req, res, next) => {
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

// Move song from tracked to completed - AUTH REQUIRED
router.post("/profile/move-to-completed", auth, (req, res, next) => {
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

// Remove song from tracked or completed list - AUTH REQUIRED
router.post("/profile/remove-song", auth, (req, res, next) => {
    tryCatch(req, res, next, async () => {
        if (!req.session.user) {
            throw new WebError("Not logged in", 401);
        }

        const { songId, listType } = req.body;

        if (listType === "tracked") {
            await removeSongFromTracked(req.session.user.id, songId);
            res.status(200).json({ success: true, message: "Song removed from tracked list" });
        } else if (listType === "completed") {
            await removeSongFromCompleted(req.session.user.id, songId);
            res.status(200).json({ success: true, message: "Song removed from completed list" });
        } else {
            throw new WebError("Invalid list type", 400);
        }
    });
});

// User registration route - ALREADY AUTHENTICATED USERS CANNOT ACCESS
router.post("/register", alreadyAuth, (req, res, next) => {
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
            role: newUser.role,
            completedSongs: [], 
            trackedSongs: [] 
        };

        links = generateNavLink(true, newUser.role === "admin");

        res.status(201).render("registerSuccess", { title: "Registration Successful", user: newUser, links });
    });
});

// User login route - ALREADY AUTHENTICATED USERS CANNOT ACCESS
router.post("/login", alreadyAuth, (req, res, next) => {
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
            role: user.role, 
            completedSongs: user.completedSongs || [], 
            trackedSongs: user.trackedSongs || [] 
        };
        links = generateNavLink(true, user.role === "admin");

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

                links = generateNavLink();
                res.status(200).json({ success: true, message: "Logged out successfully" });
            });
        } else {
            throw new WebError("No active session", 400);
        }
    });
});

export default router;