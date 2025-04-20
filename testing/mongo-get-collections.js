import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const {SOURCE_URI} = process.env;

const uri =  SOURCE_URI;
const dbName = "test";

async function listCollections() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const collections = await db.listCollections().toArray();
    console.log(`Collections in "${dbName}":`);
    collections.forEach((col) => console.log(`- ${col.name}`));
  } catch (err) {
    console.error("Error fetching collections:", err);
  } finally {
    await client.close();
  }
}

listCollections();
