import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    // Create timestamp as number (milliseconds since epoch)
    const timestamp = Date.now();
    
    // Define backup file path
    const backupDir = path.join(__dirname, "backup");
    const backupFile = path.join(backupDir, `${timestamp}.json`);
    
    // Create backup directory if it doesn"t exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Fetch all data from all tables
    const users = await prisma.user.findMany();
    const trackedSongs = await prisma.trackedSong.findMany();
    const completedSongs = await prisma.completedSong.findMany();
    const sessions = await prisma.session.findMany();
    
    // Create backup object
    const backup = {
      timestamp,
      date: new Date(timestamp).toISOString(),
      data: {
        users,
        trackedSongs,
        completedSongs,
        sessions
      }
    };
    
    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    return { success: true, filepath: backupFile, timestamp };
  } catch (error) {
    console.error("✗ Error during database backup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default backupDatabase;