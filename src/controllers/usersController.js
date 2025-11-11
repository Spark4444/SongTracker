import fs from "fs";
import path from "path";
import WebError from "../WebError/WebError.js";
import bcrypt from "bcrypt";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const usersFilePath = path.join(__dirname, "../db/users.json");

// Ensure user object has correct format
export function ensureCorrectUserFormat(user) {
    const requiredFields = ["name", "email", "password", "trackedSongs", "completedSongs"];
    for (const field of requiredFields) {
        if (!(field in user)) {
            const missingFields = requiredFields.filter(f => !(f in user));
            throw new WebError(`User is missing required fields: ${missingFields.join(", ")}`, 400);
        }
    }

    const userKeys = Object.keys(user).sort();
    const requiredKeys = requiredFields.sort();
    if (JSON.stringify(userKeys) !== JSON.stringify(requiredKeys)) {
        throw new WebError("User has extra fields or incorrect structure", 400);
    }

    if (!Array.isArray(user.trackedSongs)) {
        throw new WebError("trackedSongs must be an array", 400);
    }
}

// Read all users from the database
export function readAllUsers() {
    if (!fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, "[]", "utf-8");
    }

    const users = fs.readFileSync(usersFilePath, "utf-8");
    return JSON.parse(users);
}

// Save all users to the database
export function writeUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), "utf-8");
}

// Find user by email
export function findUserByEmail(users, email) {
    return users.find(user => user.email === email);
}

// Verify database integrity
export function verifyDBIntegrity() {
    const users = readAllUsers();
    users.forEach((user, index) => {
        try {
            ensureCorrectUserFormat(user);
        } catch (err) {
            throw new WebError(`Data integrity issue with user at index ${index}: ${err.message}`, 500);
        }
    });
}