import { Badge } from "@/components/ui/badge";
import { MatchResult } from "../../types";
import { getScoreBadgeColor, getScoreLabel } from "@/lib/utils";

interface ResultsCardsProps {
  matchResults: MatchResult[];
  expandedMatching: { [key: number]: boolean };
  expandedMissing: { [key: number]: boolean };
  onToggleMatchingSkills: (resumeId: number) => void;
  onToggleMissingSkills: (resumeId: number) => void;
}

export function ResultsCards({
  matchResults,
  expandedMatching,
  expandedMissing,
  onToggleMatchingSkills,
  onToggleMissingSkills,
}: ResultsCardsProps) {
  return (
    <div className="space-y-4">
      {matchResults.map((result, index) => {
        const matchingExpanded = expandedMatching[result.resumeId];
        const missingExpanded = expandedMissing[result.resumeId];
        const fitScore = result.fitScore !== undefined ? result.fitScore : result.similarity;

        return (
          <div key={result.resumeId} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">
                  #{index + 1}
                </Badge>
                <h4 className="font-medium">{result.candidateName}</h4>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  Sim: {(result.similarity * 100).toFixed(1)}%
                </Badge>
                <Badge className={getScoreBadgeColor(fitScore)}>Fit: {(fitScore * 100).toFixed(1)}%</Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    fitScore >= 0.8
                      ? "border-green-200 text-green-700"
                      : fitScore >= 0.6
                      ? "border-yellow-200 text-yellow-700"
                      : fitScore >= 0.4
                      ? "border-orange-200 text-orange-700"
                      : "border-red-200 text-red-700"
                  }`}
                >
                  {getScoreLabel(fitScore)}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{result.summary || "Analysis completed"}</p>

            {/* Matching Skills */}
            {result.matching_skills && result.matching_skills.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                  ✅ Matching Skills ({result.matching_skills.length})
                </h5>
                <div className="flex flex-wrap gap-1">
                  {(matchingExpanded ? result.matching_skills : result.matching_skills.slice(0, 6)).map(
                    (skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        {skill}
                      </Badge>
                    )
                  )}
                  {result.matching_skills.length > 6 && (
                    <button
                      onClick={() => onToggleMatchingSkills(result.resumeId)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 transition-colors"
                    >
                      {matchingExpanded ? "Show less" : `+${result.matching_skills.length - 6} more`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {result.missing_skills && result.missing_skills.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                  ⚠️ Missing Skills ({result.missing_skills.length})
                </h5>
                <div className="flex flex-wrap gap-1">
                  {(missingExpanded ? result.missing_skills : result.missing_skills.slice(0, 6)).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {result.missing_skills.length > 6 && (
                    <button
                      onClick={() => onToggleMissingSkills(result.resumeId)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 border border-orange-200 rounded-md hover:bg-orange-200 transition-colors"
                    >
                      {missingExpanded ? "Show less" : `+${result.missing_skills.length - 6} more`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
