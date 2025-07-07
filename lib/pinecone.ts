import { Pinecone, type PineconeRecord } from "@pinecone-database/pinecone";

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!, // env handles host/region
  // controllerHostUrl: process.env.PINECONE_CONTROLLER_HOST, // optional override
});

export const index = pc.index(process.env.PINECONE_INDEX!);

/**
 * Upsert vectors into a named namespace (“resumes” or “jobs”).
 */
export async function upsertVectors(
  records: PineconeRecord<{ resumeId?: number; jobId?: number }>[],
  namespace: "resumes" | "jobs" = "resumes"
) {
  // target the namespace first, then upsert the array
  await index.namespace(namespace).upsert(records);
}
