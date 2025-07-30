import { Pinecone, type PineconeRecord } from "@pinecone-database/pinecone";

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const index = pc.index(process.env.PINECONE_INDEX!);

/**
 * Upsert vectors into a named namespace ("resumes" or "jobs").
 */
export async function upsertVectors(
  records: PineconeRecord<{ resumeId?: number; jobId?: number }>[],
  namespace: "resumes" | "jobs" = "resumes"
) {
  // target the namespace first, then upsert the array
  await index.namespace(namespace).upsert(records);
}

/**
 * Delete a job embedding from Pinecone
 */
export async function deleteJobEmbedding(jobId: number) {
  const ids = [`job-${jobId}`];
  await index.namespace("jobs").deleteMany(ids);
}

/**
 * Delete all resume embeddings for a specific resume from Pinecone
 */
export async function deleteResumeEmbeddings(resumeId: number) {
  // Query for all vectors with this resumeId to get their IDs
  const queryResponse = await index.namespace("resumes").query({
    vector: new Array(1024).fill(0), // dummy vector for metadata filtering
    topK: 10000, // high number to get all chunks
    filter: { resumeId: resumeId },
    includeMetadata: false,
  });

  if (queryResponse.matches && queryResponse.matches.length > 0) {
    const idsToDelete = queryResponse.matches.map((match) => match.id);
    await index.namespace("resumes").deleteMany(idsToDelete);
  }
}

/**
 * Delete all resume embeddings for multiple resumes from Pinecone
 */
export async function deleteBulkResumeEmbeddings(resumeIds: number[]) {
  for (const resumeId of resumeIds) {
    await deleteResumeEmbeddings(resumeId);
  }
}

/**
 * Delete all resume embeddings linked to a specific job from Pinecone
 */
export async function deleteAllJobResumeEmbeddings(jobId: number) {
  // Query for all vectors with this jobId to get their IDs
  const queryResponse = await index.namespace("resumes").query({
    vector: new Array(1024).fill(0), // dummy vector for metadata filtering
    topK: 10000, // high number to get all chunks
    filter: { jobId: jobId },
    includeMetadata: false,
  });

  if (queryResponse.matches && queryResponse.matches.length > 0) {
    const idsToDelete = queryResponse.matches.map((match) => match.id);
    await index.namespace("resumes").deleteMany(idsToDelete);
  }
}
