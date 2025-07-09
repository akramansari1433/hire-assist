import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title"),
  jdText: text("jd_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id),
  candidateName: text("candidate_name"),
  fullText: text("full_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const comparisons = pgTable("comparisons", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  jobId: integer("job_id"),
  resumeId: integer("resume_id"),
  similarity: real("similarity"),
  fitScore: real("fit_score"),
  rationale: text("rationale"),
  matchingSkills: text("matching_skills").array(),
  missingSkills: text("missing_skills").array(),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const jobsRelations = relations(jobs, ({ many }) => ({
  resumes: many(resumes),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  job: one(jobs, {
    fields: [resumes.jobId],
    references: [jobs.id],
  }),
}));
