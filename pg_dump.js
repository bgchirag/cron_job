import { execSync } from "child_process";
import fs from "fs";

export function backupPostgres(SOURCE, TARGET) {
  const TMP_FOLDER = "./tmp";
  const DUMP_FILE = `${TMP_FOLDER}/backup.dump`;
  const TABLES_SOURCE = `${TMP_FOLDER}/tables_source.txt`;
  const TABLES_TARGET = `${TMP_FOLDER}/tables_target.txt`;
  const NEW_TABLES_FILE = `${TMP_FOLDER}/new_tables.list`;

  if (!fs.existsSync(TMP_FOLDER)) fs.mkdirSync(TMP_FOLDER);

  try {
    console.log("⏳ Dumping schema...");
    execSync(
      `pg_dump --format=custom --schema-only "${SOURCE}" -f ${DUMP_FILE}`
    );

    console.log("⏳ Listing tables in SOURCE...");
    execSync(
      `pg_restore -l ${DUMP_FILE} | grep "TABLE " | grep -v "TABLE DATA" > ${TABLES_SOURCE}`
    );

    console.log("⏳ Listing tables in TARGET...");
    execSync(
      `psql "${TARGET}" -c "COPY (SELECT tablename FROM pg_tables WHERE schemaname = 'public') TO STDOUT" > ${TABLES_TARGET}`
    );

    console.log("⏳ Identifying new tables...");
    const existing = fs
      .readFileSync(TABLES_TARGET, "utf-8")
      .split("\n")
      .filter(Boolean);
    const dumpList = fs
      .readFileSync(TABLES_SOURCE, "utf-8")
      .split("\n")
      .filter(Boolean);

    const newTableLines = dumpList.filter((line) => {
      const match = line.match(/TABLE\s+public\.(\w+)/);
      return match && !existing.includes(match[1]);
    });

    fs.writeFileSync(NEW_TABLES_FILE, newTableLines.join("\n"));

    if (newTableLines.length > 0) {
      console.log("⏳ Restoring new tables...");
      execSync(`pg_restore -L ${NEW_TABLES_FILE} -d "${TARGET}" ${DUMP_FILE}`, {
        stdio: "inherit",
      });
      console.log("✅ Restored new tables:", newTableLines.length);
    } else {
      console.log("✅ No new tables to restore.");
    }
  } catch (error) {
    console.error("❌ Error during PostgreSQL backup process:", error);
    throw error;
  }
}
