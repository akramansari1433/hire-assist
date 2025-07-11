import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getScoreBadgeColor = (score: number) => {
  if (score >= 0.8) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (score >= 0.4) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-red-100 text-red-800 border-red-200";
};

export const getScoreLabel = (score: number): string => {
  if (score >= 0.8) return "Excellent";
  if (score >= 0.6) return "Good";
  if (score >= 0.4) return "Fair";
  return "Poor";
};
