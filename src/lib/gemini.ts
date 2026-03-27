import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY || ""
const genAI = new GoogleGenerativeAI(apiKey)

export interface ExtractedDocument {
  vendor_name: string
  document_date: string
  amount: number
  invoice_number: string
  unique_code: string
  state: string
}

export async function extractBillDataFromBuffer(buffer: Buffer, mimeType: string): Promise<ExtractedDocument[]> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

  const base64Data = buffer.toString("base64")

  const prompt = `
    Extract the following fields from this invoice or document image/PDF:
    - Vendor Name
    - Document Date (Format: YYYY-MM-DD or as close as possible)
    - Total Amount (Number only, exclude currency symbols)
    - Invoice Number
    - Bill Number / Unique Code
    - State (Indian state name if available)

    Rules:
    - If a field is not found, leave it empty or null.
    - If the document contains multiple invoices or pages, extract data for each.
    - Return the result ONLY as a JSON array of objects.
    
    Example format:
    [
      {
        "vendor_name": "ABC Corp",
        "document_date": "2024-03-24",
        "amount": 12500.50,
        "invoice_number": "INV-001",
        "unique_code": "UC-789",
        "state": "Maharashtra"
      }
    ]
  `

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    },
  ])

  const response = result.response
  const text = response.text()
  
  // Clean the text to ensure it's valid JSON
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error("Gemini response:", text);
    throw new Error("Could not extract structured data from Gemini response")
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response:", text);
    throw new Error("Invalid JSON format returned from Gemini")
  }
}
