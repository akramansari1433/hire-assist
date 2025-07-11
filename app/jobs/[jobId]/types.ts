export interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

export interface Resume {
  id: number;
  candidate: string;
  when: string;
}

export interface MatchResult {
  resumeId: number;
  similarity: number;
  fitScore?: number;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
  createdAt?: string;
}

export interface ComparisonFromAPI {
  resumeId: number;
  similarity: number;
  fitScore?: number;
  matchingSkills: string[];
  missingSkills: string[];
  summary: string;
  createdAt: string;
  candidateName: string;
}

export interface ResumeWithStatus extends Resume {
  isMatched: boolean;
  matchResult?: MatchResult;
  selected?: boolean;
}

export type SortOption =
  | "similarity-desc"
  | "similarity-asc"
  | "fit-desc"
  | "fit-asc"
  | "name-asc"
  | "name-desc"
  | "date-desc"
  | "date-asc";

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
