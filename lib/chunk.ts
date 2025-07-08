// lib/chunk.ts  — Simple version for debugging
import { AutoTokenizer } from "@xenova/transformers";

const tokenizerPromise = AutoTokenizer.from_pretrained(
  "intfloat/e5-small-v2", // or 'Xenova/Llama-2-7b-hf' etc.
  { quantized: false }
);

const CHUNK = 450; // stay safely under 512
const OVERLAP = 50;

// Simple fallback chunking function
function simpleChunk(text: string): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  const wordsPerChunk = 100; // roughly 400-500 characters

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunk = words.slice(i, i + wordsPerChunk).join(" ");
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }

  // If no chunks were created, return the original text
  return chunks.length > 0 ? chunks : [text];
}

export async function chunk(text: string): Promise<string[]> {
  console.log("Starting chunk process for text length:", text.length);

  try {
    const tokenizer = await tokenizerPromise;
    const ids = tokenizer.encode(text); // an array of wordpiece IDs
    const out: string[] = [];
    for (let i = 0; i < ids.length; i += CHUNK - OVERLAP) {
      const slice = ids.slice(i, i + CHUNK);
      out.push(tokenizer.decode(slice));
    }

    console.log("Tokenizer chunking successful, created", out.length, "chunks");
    return out.length > 0 ? out : simpleChunk(text);
  } catch (error) {
    console.error("Tokenizer chunking failed, falling back to simple chunking:", error);
    return simpleChunk(text);
  }
}
