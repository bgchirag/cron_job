import { dumpDbtoCloud } from "./b2-cloud-restore.js";
import dotenv from "dotenv";

dotenv.config();

const DB_NAME = process.env.DB_NAME;
const OUTPUT_DIR = process.env.OUTPUT_DIR;

(async () => {
  console.log("⏰ Starting dumpDbtoCloud task");
  try {
    await dumpDbtoCloud(DB_NAME, OUTPUT_DIR);
    console.log("✅ Migration and upload completed successfully.");
  } catch (error) {
    console.error("❌ Error running dumpDbtoCloud:", error);
  }
})();
