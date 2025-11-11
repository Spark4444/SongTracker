import { time } from "console";
import fs from "fs";
import path from "path";

const backupInterval = 24 * 60 * 60 * 1000; // 24 hours
const maxBackupAge = 7 * 24 * 60 * 60 * 1000; // 7 days

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const backupDir = path.join(__dirname, "../db/backups");

// Create a backup of the database
function backupDB() {
    const timestamp = new Date().getTime();
    const backupSubDir = path.join(backupDir, `${timestamp}.json`);
    fs.copyFileSync(path.join(__dirname, "../db/users.json"), backupSubDir);
    const currentTime = new Date().toISOString();
    console.log(`Database backed up at ${currentTime}`);
}

// Cleanup old backups
function cleanupOldBackups() {
    if (!fs.existsSync(backupDir)) {
        return;
    }

    const now = new Date().getTime();
    const backups = fs.readdirSync(backupDir).filter(name => fs.lstatSync(path.join(backupDir, name)).isDirectory());

    backups.forEach(name => {
        const backupTime = parseInt(name, 10);
        if (now - backupTime > maxBackupAge) {
            const backupPath = path.join(backupDir, name);
            fs.rmSync(backupPath, { recursive: true, force: true });
            console.log(`Old backup ${name} deleted`);
        }
    });
}

// Main function to initiate backups
export default function makeBackups() {
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().getTime();
    const backups = fs.readdirSync(backupDir).filter(name => !fs.statSync(path.join(backupDir, name)).isDirectory());

    // Find last backup and compare timestamps and if it's less than 24 hours ago, skip backup
    const lastBackUp = backups.length > 0 ? Math.max(...backups.map(name => parseInt(name, 10))) : 0;

    // If backup was made more than 24 hours ago, make a new backup
    if (timestamp - lastBackUp > backupInterval) {
        backupDB();
        cleanupOldBackups();
        const intervalId = setInterval(backupDB, backupInterval);

        return intervalId;
    }
    else {
        const nextBackupIn = backupInterval - (timestamp - lastBackUp);
        const timeoutId = setTimeout(function() {
            backupDB();
            cleanupOldBackups();
            setInterval(backupDB, backupInterval);
        }, nextBackupIn);

        return timeoutId;
    }
}