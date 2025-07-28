import { AutoTokenizer } from "@xenova/transformers";

const tokenizerPromise = AutoTokenizer.from_pretrained("intfloat/e5-small-v2", { quantized: false });

const CHUNK = 450;
const OVERLAP = 50;

export async function chunk(text: string): Promise<string[]> {
  const tokenizer = await tokenizerPromise;
  const ids = tokenizer.encode(text);
  const out: string[] = [];

  for (let i = 0; i < ids.length; i += CHUNK - OVERLAP) {
    const slice = ids.slice(i, i + CHUNK);
    out.push(tokenizer.decode(slice));
  }

  return out;
}
