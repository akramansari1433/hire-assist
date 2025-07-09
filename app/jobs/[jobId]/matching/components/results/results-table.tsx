import { Badge } from "@/components/ui/badge";
import { MatchResult } from "../../types";
import { getScoreLabel, getScoreBadgeColor } from "../../utils";

interface ResultsTableProps {
  matchResults: MatchResult[];
}

export function ResultsTable({ matchResults }: ResultsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium">Rank</th>
            <th className="text-left p-3 font-medium">Candidate</th>
            <th className="text-left p-3 font-medium">Fit Score</th>
            <th className="text-left p-3 font-medium">Similarity</th>
            <th className="text-left p-3 font-medium">Grade</th>
            <th className="text-left p-3 font-medium">Matching Skills</th>
            <th className="text-left p-3 font-medium">Missing Skills</th>
          </tr>
        </thead>
        <tbody>
          {matchResults.map((result, index) => {
            const fitScore = result.fitScore !== undefined ? result.fitScore : result.similarity;
            return (
              <tr key={result.resumeId} className="border-b hover:bg-slate-50">
                <td className="p-3">
                  <Badge variant="outline" className="font-mono">
                    #{index + 1}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="font-medium">{result.candidateName}</div>
                  <div className="text-sm text-slate-500 max-w-xs truncate">{result.summary}</div>
                </td>
                <td className="p-3">
                  <Badge className={getScoreBadgeColor(fitScore)}>{(fitScore * 100).toFixed(1)}%</Badge>
                </td>
                <td className="p-3">
                  <Badge variant="outline">{(result.similarity * 100).toFixed(1)}%</Badge>
                </td>
                <td className="p-3">
                  <span
                    className={`font-medium ${
                      fitScore >= 0.8
                        ? "text-green-600"
                        : fitScore >= 0.6
                        ? "text-yellow-600"
                        : fitScore >= 0.4
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {getScoreLabel(fitScore)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {result.matching_skills.slice(0, 3).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {result.matching_skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{result.matching_skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {result.missing_skills.slice(0, 3).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {result.missing_skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{result.missing_skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
