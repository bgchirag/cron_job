import { exec } from "child_process";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const { SOURCE_NEON_URI, DEST_NEON_URI } = process.env;

const PG_DUMP = `"/usr/lib/postgresql/17/bin/pg_dump"`;
const PG_RESTORE = `"/usr/lib/postgresql/17/bin/pg_restore"`;

const migratePostgres = () => {
  const dumpFile = path.resolve(`./neon_backup_${Date.now()}.bak`);
  const dumpCommand = `${PG_DUMP} -Fc -v -d "${SOURCE_NEON_URI}" -f "${dumpFile}"`;

  console.log("⏳ Starting dump...");
  exec(dumpCommand, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Dump failed:", err.message);
      return;
    }

    console.log("✅ Dump successful:", dumpFile);

    const restoreCommand = `${PG_RESTORE} --clean --if-exists --no-acl --no-owner -v -O -d "${DEST_NEON_URI}" "${dumpFile}"`;
    console.log("⏳ Starting restore...");

    exec(restoreCommand, (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Restore failed:", err.message);
        return;
      }

      // Filter out known noisy warnings
      const filteredStderr = stderr
        .split("\n")
        .filter((line) => {
          return (
            !line.includes("does not exist") &&
            !line.includes("WARNING: no privileges could be revoked") &&
            !line.includes("owner of object")
          );
        })
        .join("\n");

      if (filteredStderr.trim()) {
        console.warn("⚠️ Restore warnings:\n", filteredStderr);
      }

      console.log("✅ Restore to Neon completed.");
    });
  });
};