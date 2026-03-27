import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testExtraction() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Tiny dummy image data (1x1 red dot)
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const mimeType = "image/png";
    const prompt = "What is in this image?";

    console.log("Attempting to generate content with inlineData...");
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Extraction test failed:");
    if (error.response) {
       console.error("Status:", error.response.status);
       console.error("Status Text:", error.response.statusText);
       try {
         const json = await error.response.json();
         console.error("Error Body:", JSON.stringify(json, null, 2));
       } catch (e) {}
    } else {
       console.error(error);
    }
  }
}

testExtraction();
