import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";

dotenv.config();

import { B2_APP_KEY, B2_ACCOUNT_ID, B2_BUCKET_NAME } from process.env;

// Backblaze B2 Functions
const getAuthToken = async () => {
  const accountId = B2_ACCOUNT_ID;
  const appKey = B2_APP_KEY;

  const response = await axios.post(
    "https://api.backblazeb2.com/b2api/v2/authentication",
    {
      accountId,
      appKey,
    }
  );

  return response.data;
};

const getUploadUrl = async (authToken, apiUrl, bucketId) => {
  const response = await axios.post(
    `${apiUrl}/b2api/v2/b2_get_upload_url`,
    { bucketId },
    { headers: { Authorization: authToken } }
  );
  return response.data.uploadUrl;
};

const uploadFileToB2 = async (authToken, apiUrl, bucketId, filePath) => {
  const uploadUrl = await getUploadUrl(authToken, apiUrl, bucketId);
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("fileName", path.basename(filePath));

  const response = await axios.post(uploadUrl, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: authToken,
    },
  });

  console.log(`Upload of ${filePath} successful:`, response.data);
};

// Upload the single file
const uploadSingleFile = async (filePath) => {
  const authDetails = await getAuthToken();
  const { authorizationToken, apiUrl } = authDetails;

  const bucketId = B2_BUCKET_NAME; // Use the bucket ID you want to upload to

  console.log(`Uploading file: ${filePath}`);
  await uploadFileToB2(authorizationToken, apiUrl, bucketId, filePath);

  console.log("File upload completed.");
};

// Specify the path to your BSON file
const filePath =
  "C:/Users/CHIRAG/Desktop/Algo_Uni/algo_project/cron-job/backup/test/competitions.bson";

// Upload the file
uploadSingleFile(filePath);
