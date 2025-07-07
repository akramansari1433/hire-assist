import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed(text: string): Promise<number[]> {
  const { data } = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return data[0].embedding;
}
