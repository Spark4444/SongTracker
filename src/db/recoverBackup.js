import fs from "fs";
import path from "path";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(process.platform === "win32" ? __filename.slice(1) : __filename);
const backupDir = path.join(__dirname, "../db/backups");
const usersFilePath = path.join(__dirname, "../db/users.json");

// Recover database from a specific backup
export default function recoverBackup(timestamp) {
    const backupFilePath = path.join(backupDir, `${timestamp}.json`);

    if (!fs.existsSync(backupFilePath)) {
        throw new Error("Backup file does not exist");
    }

    fs.copyFileSync(backupFilePath, usersFilePath);
    console.log(`Database recovered from backup taken at ${new Date(parseInt(timestamp, 10)).toISOString()}`);
}