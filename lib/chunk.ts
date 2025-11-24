// Character-based chunking (simpler and sufficient since embedding API handles truncation)
// Using ~4 chars/token ratio: 450 tokens ≈ 1800 chars, 50 tokens ≈ 200 chars
const CHUNK_SIZE = 1800; // ~450 tokens (4 chars/token average for English)
const OVERLAP = 200; // ~50 tokens

export function chunk(text: string): string[] {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
    const chunk = text.slice(i, i + CHUNK_SIZE);
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks.length > 0 ? chunks : [text]; // Fallback to full text if no chunks created
}
