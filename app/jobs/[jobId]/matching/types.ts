export interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

export interface MatchResult {
  resumeId: number;
  similarity: number;
  fitScore?: number;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
  candidateName?: string;
}

export interface ComparisonFromAPI {
  resumeId: number;
  similarity: number;
  fitScore?: number;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
}

export type SortOption = "fit-desc" | "fit-asc" | "similarity-desc" | "similarity-asc" | "name-asc" | "name-desc";

export type ViewMode = "table" | "cards";

export type FilterOption = "all" | "excellent" | "good" | "fair" | "poor";

export interface Analytics {
  total: number;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  averageScore: number;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
