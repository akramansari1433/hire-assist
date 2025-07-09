import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { jobs, resumes, comparisons } from "./schema";

export type Job = InferSelectModel<typeof jobs>;
export type NewJob = InferInsertModel<typeof jobs>;

export type Resume = InferSelectModel<typeof resumes>;
export type NewResume = InferInsertModel<typeof resumes>;

export type Comparison = InferSelectModel<typeof comparisons>;
export type NewComparison = InferInsertModel<typeof comparisons>;
