import { exec } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const { DEST_URI, SOURCE_URI } = process.env;

const cmd = `mongodump --uri="${SOURCE_URI}" --archive | mongorestore --uri="${DEST_URI}" --archive --verbose`;

exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Migration failed: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(`stdout: ${stdout}`);
});
