import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const exportMongoDBCollection = async () => {
  const uri =
    ""; // Your MongoDB URI
  const collectionName = "competitions"; // Replace with your actual collection name
  const outputFile = "./output.json"; // Define where to save the output file

  try {
    // Run the mongoexport command with the provided URI and collection name
    const { stdout, stderr } = await execPromise(
      `mongoexport --uri="${uri}" --collection=${collectionName} --out=${outputFile}`
    );

    console.log("Collection exported to:", outputFile);

    if (stderr) {
      console.error("Error:", stderr);
    }
  } catch (error) {
    console.error("Error executing mongoexport:", error);
  }
};

exportMongoDBCollection();
