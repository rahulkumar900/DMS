import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key length:", apiKey?.length);
console.log("API Key starts with:", apiKey?.substring(0, 7));

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Attempting to generate content...");
    const result = await model.generateContent("Hello, are you there?");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Test failed:");
    console.error(error);
  }
}

test();
