// upload.js
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import B2 from "backblaze-b2";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize B2
const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

const uploadToB2 = async (localFilePath, b2FileName) => {
  try {
    await b2.authorize();

    // Start large file upload or get upload URL for small files
    const { data: uploadUrlData } = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID,
    });

    const fileData = fs.readFileSync(localFilePath);
    const stats = fs.statSync(localFilePath);

    const response = await b2.uploadFile({
      uploadUrl: uploadUrlData.uploadUrl,
      uploadAuthToken: uploadUrlData.authorizationToken,
      fileName: b2FileName,
      data: fileData,
      contentLength: stats.size,
      mime: "application/octet-stream",
    });

    console.log("✅ File uploaded successfully:", response.data.fileName);
  } catch (error) {
    console.error("❌ Error uploading to B2:", error.message || error);
  }
};

// Example usage
const localPath = "C:\\Users\\CHIRAG\\Downloads\\luffy_upscaled.png"
uploadToB2(localPath, "luffy_upscaled.png");
