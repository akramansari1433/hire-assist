import { encode } from "gpt-tokenizer";
const CHUNK = 500;
const OVERLAP = 50;

export function chunk(text: string) {
  const tokens = encode(text);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i += CHUNK - OVERLAP) {
    out.push(Buffer.from(tokens.slice(i, i + CHUNK)).toString());
  }
  return out;
}
