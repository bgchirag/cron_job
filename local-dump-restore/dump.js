import { exec } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const { SOURCE_URI } = process.env;

const dumpDatabase = async () => {
  const command = `mongodump --uri="${SOURCE_URI}test" --out=./backup`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing dump: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

dumpDatabase();
