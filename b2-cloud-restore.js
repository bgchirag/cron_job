import { exec } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import axios from "axios";
import { MongoClient } from "mongodb";

dotenv.config();
import crypto from "crypto";

// Function to calculate SHA1
const calculateSHA1 = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha1");
  hash.update(fileBuffer);
  return hash.digest("hex");
};


const {
  SOURCE_URI,
  DEST_URI,
  B2_APP_KEY,
  B2_ACCOUNT_ID,
  B2_BUCKET_ID,
} = process.env;

// === Step 1: MongoDB Dump ===
const dumpMongoDB = (dbName, collectionName, outputDir) => {
  return new Promise((resolve, reject) => {
    const cmd = `mongodump --uri="${SOURCE_URI}" --db=${dbName} --collection=${collectionName} --out=${outputDir}`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(`Mongo dump failed: ${error.message}`);
      if (stderr) console.warn(`MongoDump stderr: ${stderr}`);
      resolve(`${outputDir}/${dbName}/${collectionName}.bson`);
    });
  });
};

// === Step 2: Backblaze B2 Auth ===
const getAuthToken = async () => {
  const credentials = `${B2_ACCOUNT_ID}:${B2_APP_KEY}`;
  const base64 = Buffer.from(credentials).toString("base64");

  const res = await axios.get(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    {
      headers: {
        Authorization: `Basic ${base64}`,
      },
    }
  );

  return res.data;
};

// === Step 3: Get Upload URL ===
const getUploadUrl = async (authToken, apiUrl, bucketId) => {
  const res = await axios.post(
    `${apiUrl}/b2api/v2/b2_get_upload_url`,
    { bucketId },
    { headers: { Authorization: authToken } }
  );
  return res.data;
};

// === Step 4: Upload File ===
const uploadFileToB2 = async (uploadUrl, authToken, filePath) => {
  const fileName = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);
  const sha1 = calculateSHA1(filePath);

  const headers = {
    Authorization: authToken,
    "X-Bz-File-Name": encodeURIComponent(fileName),
    "Content-Type": "b2/x-auto",
    "Content-Length": fileData.length,
    "X-Bz-Content-Sha1": sha1,
  };

  const res = await axios.post(uploadUrl, fileData, { headers });
  console.log(`✅ Upload complete: ${res.data.fileName}`);
};

// === Step 5: Orchestrate ===
const runMigrationAndUpload = async (collectionName, databaseName, outputDir) => {
  const dbName = databaseName;
  const dumpPath = path.resolve(outputDir);

  try {
    const bsonPath = await dumpMongoDB(dbName, collectionName, dumpPath);
    console.log(`✅ Dump created: ${bsonPath}`);

    const { authorizationToken, apiUrl, allowed } = await getAuthToken();
    const { uploadUrl, authorizationToken: uploadAuth } = await getUploadUrl(
      authorizationToken,
      apiUrl,
      B2_BUCKET_ID
    );

    await uploadFileToB2(uploadUrl, uploadAuth, bsonPath);
  } catch (err) {
    console.error("❌ Error:", err);
  }
};

const restoreMongoDB = async (dbName, collectionName, outputDir) => {
  const uri = DEST_URI;
  const bsonPath = path.join(outputDir, dbName, `${collectionName}.bson`);

  const cmd = `mongorestore --uri="${uri}" --db=${dbName} --collection=${collectionName} ${bsonPath}`;

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Restore failed: ${error.message}`);
        return reject(error);
      }
      if (stderr) console.warn(`mongorestore stderr: ${stderr}`);
      console.log(`✅ Restored collection: ${collectionName}`);
      resolve();
    });
  });
};

const deleteDumpFiles = (outputDir, dbName, collectionName) => {
  const collectionPath = path.join(outputDir, dbName, `${collectionName}.bson`);
  const metadataPath = path.join(
    outputDir,
    dbName,
    `${collectionName}.metadata.json`
  );

  try {
    if (fs.existsSync(collectionPath)) {
      fs.unlinkSync(collectionPath);
      console.log(`🗑️ Deleted: ${collectionPath}`);
    }
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
      console.log(`🗑️ Deleted: ${metadataPath}`);
    }
  } catch (err) {
    console.error(`⚠️ Failed to delete files: ${err.message}`);
  }
};


export async function dumpDbtoCloud(dbName, outputDir) {
  const client = new MongoClient(SOURCE_URI);

  try {
    await client.connect();
    const db = client.db(dbName);

    const collections = await db.listCollections().toArray();
    console.log(`Started dumping database: ${dbName}`);
    console.log(`Found ${collections.length} collections:`);
    const restorePath = `./${outputDir}/${dbName}`;
    for (const col of collections) {
      await runMigrationAndUpload(col.name, dbName, outputDir);
      await restoreMongoDB(dbName, col.name, outputDir);
      deleteDumpFiles(outputDir, dbName, col.name);
    }
  } catch (err) {
    console.error("Error fetching collections:", err);
  } finally {
    await client.close();
  }
}

