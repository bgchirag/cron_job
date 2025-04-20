import { exec } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const { SOURCE_URI } = process.env;

const restoreMongoDB = async () => {
  const uri = SOURCE_URI;
  const dbName = "test";
  const backupPath = "./backup/test";

  const restoreCommand = `mongorestore --uri="${uri}" --db ${dbName} ${backupPath}`;

  try {
    exec(restoreCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing mongorestore: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });
  } catch (err) {
    console.error(`Error during restore process: ${err}`);
  }
};

restoreMongoDB();
