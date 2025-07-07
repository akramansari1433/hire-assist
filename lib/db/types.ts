import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { jobs, resumes, resumeChunks, comparisons } from "./schema";

export type Job = InferSelectModel<typeof jobs>;
export type NewJob = InferInsertModel<typeof jobs>;

export type Resume = InferSelectModel<typeof resumes>;
export type NewResume = InferInsertModel<typeof resumes>;

export type ResumeChunk = InferSelectModel<typeof resumeChunks>;
export type NewResumeChunk = InferInsertModel<typeof resumeChunks>;

export type Comparison = InferSelectModel<typeof comparisons>;
export type NewComparison = InferInsertModel<typeof comparisons>;
