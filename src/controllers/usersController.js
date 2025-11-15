import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import WebError from "../WebError/WebError.js";

const prisma = new PrismaClient();

// Find a user by email
export async function findUserByEmail(email) {
    try {
        const user = await prisma.user.findUnique({
        where: { email },
        include: {
            trackedSongs: true,
            completedSongs: true,
        },
        });
        return user;
    } catch (error) {
        console.error("Error finding user by email:", error);
        throw new WebError("Database error", 500);
    }
}

// Get all users
export async function getAllUsers() {
    try {
        const users = await prisma.user.findMany({
        include: {
            trackedSongs: true,
            completedSongs: true,
        },
        });
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw new WebError("Database error", 500);
    }
}

// Create a new user
export async function createUser(userData) {
    try {
        const { name, email, password } = userData;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
        where: { email },
        });

        if (existingUser) {
        throw new WebError("User already exists", 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
        include: {
            trackedSongs: true,
            completedSongs: true,
        },
        });

        return user;
    } catch (error) {
        if (error instanceof WebError) {
        throw error;
        }
        console.error("Error creating user:", error);
        throw new WebError("Failed to create user", 500);
    }
}

// Update user profile
export async function updateUser(id, updateData) {
    try {
        const { name, email, password } = updateData;
        const data = {};

        if (name) data.name = name;
        if (email) data.email = email;
        if (password) {
        data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
        where: { id },
        data,
        include: {
            trackedSongs: true,
            completedSongs: true,
        },
        });

        return user;
    } catch (error) {
        console.error("Error updating user:", error);
        throw new WebError("Failed to update user", 500);
    }
}

// Delete a user
export async function deleteUser(id) {
    try {
        const user = await prisma.user.delete({
        where: { id },
        include: {
            trackedSongs: true,
            completedSongs: true,
        },
        });

        return user;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new WebError("Failed to delete user", 500);
    }
}

// Verify user password
export async function verifyUserPassword(email, password) {
    try {
        const user = await findUserByEmail(email);

        if (!user) {
        return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
        return user;
        }

        return null;
    } catch (error) {
        console.error("Error verifying password:", error);
        throw new WebError("Authentication error", 500);
    }
}

// Get tracked songs for a user
export async function getTrackedSongs(userId) {
    try {
        const trackedSongs = await prisma.trackedSong.findMany({
        where: { userId },
        });

        return trackedSongs;
    } catch (error) {
        console.error("Error fetching tracked songs:", error);
        throw new WebError("Database error", 500);
    }
}

// Add a song to tracked list
export async function addSongToTracked(userId, songId, songName) {
    try {
        // Check if song is already tracked
        const existing = await prisma.trackedSong.findUnique({
        where: {
            userId_songId: {
            userId,
            songId,
            },
        },
        });

        if (existing) {
        throw new WebError("Song already in tracked list", 400);
        }

        const trackedSong = await prisma.trackedSong.create({
        data: {
            userId,
            songId,
            songName,
        },
        });

        return trackedSong;
    } catch (error) {
        if (error instanceof WebError) {
        throw error;
        }
        console.error("Error adding song to tracked:", error);
        throw new WebError("Failed to add song to tracked list", 500);
    }
}

// Remove a song from tracked list
export async function removeSongFromTracked(userId, songId) {
    try {
        const trackedSong = await prisma.trackedSong.delete({
        where: {
            userId_songId: {
            userId,
            songId,
            },
        },
        });

        return trackedSong;
    } catch (error) {
        console.error("Error removing song from tracked:", error);
        throw new WebError("Failed to remove song from tracked list", 500);
    }
}

// Get completed songs for a user
export async function getCompletedSongs(userId) {
    try {
        const completedSongs = await prisma.completedSong.findMany({
        where: { userId },
        });

        return completedSongs;
    } catch (error) {
        console.error("Error fetching completed songs:", error);
        throw new WebError("Database error", 500);
    }
}

// Add a song to completed list
export async function addSongToCompleted(userId, songId, songName) {
    try {
        // Check if song is already completed
        const existing = await prisma.completedSong.findUnique({
        where: {
            userId_songId: {
            userId,
            songId,
            },
        },
        });

        if (existing) {
        throw new WebError("Song already in completed list", 400);
        }

        const completedSong = await prisma.completedSong.create({
        data: {
            userId,
            songId,
            songName,
        },
        });

        return completedSong;
    } catch (error) {
        if (error instanceof WebError) {
        throw error;
        }
        console.error("Error adding song to completed:", error);
        throw new WebError("Failed to add song to completed list", 500);
    }
}

// Remove a song from completed list
export async function removeSongFromCompleted(userId, songId) {
    try {
        const completedSong = await prisma.completedSong.delete({
        where: {
            userId_songId: {
            userId,
            songId,
            },
        },
        });

        return completedSong;
    } catch (error) {
        console.error("Error removing song from completed:", error);
        throw new WebError("Failed to remove song from completed list", 500);
    }
}

// Move a song from tracked to completed
export async function moveToCompleted(userId, songId, songName) {
    try {
        await removeSongFromTracked(userId, songId);
        const completedSong = await addSongToCompleted(userId, songId, songName);
        return completedSong;
    } catch (error) {
        console.error("Error moving song to completed:", error);
        throw new WebError("Failed to move song to completed list", 500);
    }
}

// Move a song from completed to tracked
export async function moveToTracked(userId, songId, songName) {
    try {
        await removeSongFromCompleted(userId, songId);
        const trackedSong = await addSongToTracked(userId, songId, songName);
        return trackedSong;
    } catch (error) {
        console.error("Error moving song to tracked:", error);
        throw new WebError("Failed to move song to tracked list", 500);
    }
}