// lib/chunk.ts  — HF/JS version, works everywhere Node can run
import { AutoTokenizer } from "@xenova/transformers";

const tokenizerPromise = AutoTokenizer.from_pretrained(
  "intfloat/e5-small-v2", // or 'Xenova/Llama-2-7b-hf' etc.
  { quantized: false }
);

const CHUNK = 450; // stay safely under 512
const OVERLAP = 50;

export async function chunk(text: string) {
  const tokenizer = await tokenizerPromise;
  const ids = tokenizer.encode(text); // an array of wordpiece IDs
  const out: string[] = [];
  for (let i = 0; i < ids.length; i += CHUNK - OVERLAP) {
    const slice = ids.slice(i, i + CHUNK);
    out.push(tokenizer.decode(slice));
  }
  return out;
}
