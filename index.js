import cron from "node-cron";
import { dumpDbtoCloud } from "./b2-cloud-restore.js";
import dotenv from "dotenv";  

dotenv.config();

const DB_NAME = process.env.DB_NAME;
const OUTPUT_DIR = process.env.OUTPUT_DIR;

cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running scheduled task: dumpDbtoCloud");
  try {
    await dumpDbtoCloud(DB_NAME, OUTPUT_DIR)
      .then(() => console.log("✅ Migration and upload completed successfully"))
      .catch((err) => console.error("❌ Migration and upload failed:", err));
    console.log("✅ dumpDbtoCloud completed successfully.");
  } catch (error) {
    console.error("❌ Error running dumpDbtoCloud:", error);
  }
});

console.log("Cron job scheduled. Waiting for the next execution...");
