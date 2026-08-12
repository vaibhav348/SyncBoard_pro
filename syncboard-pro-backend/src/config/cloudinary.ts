// config/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config(); 

// 1. .trim() removes any hidden spaces or newline characters from your .env file
const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const api_key = process.env.CLOUDINARY_API_KEY?.trim();
const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

// 2. This will instantly tell you if your server is failing to read the .env file
if (!cloud_name || !api_key || !api_secret) {
  console.error("🔴 CLOUDINARY ERROR: Missing or undefined environment variables!");
  console.log({
    cloud_name: cloud_name ? "✅ Loaded" : "❌ MISSING",
    api_key: api_key ? "✅ Loaded" : "❌ MISSING",
    api_secret: api_secret ? "✅ Loaded" : "❌ MISSING",
  });
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

export default cloudinary;