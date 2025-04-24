import { dumpDbtoCloud } from "./b2-cloud-restore.js";
import { backupPostgres } from "./pg_dump.js";
import dotenv from "dotenv";

dotenv.config();

const DB_NAME = process.env.DB_NAME;
const OUTPUT_DIR = process.env.OUTPUT_DIR;
const NEON_SOURCE = process.env.SOURCE_NEON_URI;
const NEON_TARGET = process.env.DEST_NEON_URI;

(async () => {
  console.log("⏰ Starting dumpDbtoCloud task");
  try {
    await dumpDbtoCloud(DB_NAME, OUTPUT_DIR);

    console.log("⏰ Starting PostgreSQL backup task");
    backupPostgres(NEON_SOURCE, NEON_TARGET);

    console.log("✅ Migration, upload, and backup completed successfully.");
  } catch (error) {
    console.error("❌ Error running tasks:", error);
  }
})();
