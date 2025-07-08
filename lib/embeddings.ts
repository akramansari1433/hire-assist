import { pc } from "./pinecone";

export async function embed(text: string): Promise<number[]> {
  const model = "llama-text-embed-v2";

  const embeddings = await pc.inference.embed(model, [text], { inputType: "passage", truncate: "END" });

  // @ts-expect-error - TODO: fix this
  return embeddings.data[0].values;
}
