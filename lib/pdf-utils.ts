import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Extract text from PDF using pdf2json
 */
export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    // Dynamic import to avoid webpack issues
    const PDFParser = (await import("pdf2json")).default;

    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("PDF parser error:", errData);
        reject(new Error("Failed to parse PDF"));
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          let fullText = "";

          // Extract text from all pages
          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            for (const page of pdfData.Pages) {
              if (page.Texts && Array.isArray(page.Texts)) {
                for (const textBlock of page.Texts) {
                  if (textBlock.R && Array.isArray(textBlock.R)) {
                    for (const textRun of textBlock.R) {
                      if (textRun.T) {
                        // Decode URI component to handle special characters
                        const decodedText = decodeURIComponent(textRun.T);
                        fullText += decodedText + " ";
                      }
                    }
                  }
                }
              }
              fullText += "\n";
            }
          }

          resolve(fullText.trim());
        } catch (parseError) {
          console.error("Text extraction error:", parseError);
          reject(new Error("Failed to extract text from PDF"));
        }
      });

      // Parse the PDF buffer
      pdfParser.parseBuffer(Buffer.from(buffer));
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract candidate name from resume text using AI
 */
export async function extractCandidateName(text: string): Promise<string> {
  try {
    // Truncate text to first 2000 characters to focus on header section
    const truncatedText = text.substring(0, 2000);

    const prompt = `
    Extract the candidate's full name from this resume text. The name is usually at the top of the resume.

    Resume text:
    ${truncatedText}

    Instructions:
    - Return ONLY the candidate's full name (first and last name)
    - Do not include titles, degrees, or certifications
    - If you find multiple names, return the one that appears to be the candidate's name (usually at the top)
    - If no clear name is found, return an empty string
    - Do not return any other text or explanation

    Examples:
    - "John Smith" 
    - "Sarah Johnson"
    - "Michael O'Connor"
    - ""

    Name:`;

    const { text: extractedName } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: prompt,
      temperature: 0.1,
      maxTokens: 50,
    });

    // Clean up the response
    let name = extractedName.trim();

    // Remove common prefixes/suffixes that might be included
    name = name.replace(/^(Name:|Candidate:|Resume of|CV of|Mr\.|Ms\.|Mrs\.|Dr\.)/i, "").trim();
    name = name.replace(/\n[\s\S]*$/, "").trim(); // Remove everything after first line

    // Basic validation - should be 2-4 words, reasonable length
    const words = name.split(/\s+/).filter((word) => word.length > 0);
    if (words.length < 2 || words.length > 4 || name.length > 50) {
      return "";
    }

    // Check if it looks like a real name (contains only letters, spaces, common name characters)
    if (name && !/^[a-zA-Z\s\-'.]+$/.test(name)) {
      return "";
    }

    return name || "";
  } catch (error) {
    console.error("Name extraction error:", error);
    return "";
  }
}
