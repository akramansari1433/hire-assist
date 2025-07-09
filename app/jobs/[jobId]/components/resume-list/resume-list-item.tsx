import { UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ResumeWithStatus } from "../../types";
import { formatDate, getScoreBadgeColor } from "@/lib/utils";

interface ResumeListItemProps {
  resume: ResumeWithStatus;
  onToggleSelection: (resumeId: number) => void;
  selected: boolean;
}

export function ResumeListItem({ resume, onToggleSelection, selected }: ResumeListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelection(resume.id)} />
        <UserIcon className="h-5 w-5 text-slate-400" />
        <div>
          <p className="font-medium text-slate-900">{resume.candidate}</p>
          <p className="text-sm text-slate-500">Uploaded {formatDate(resume.when)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Match Status & Quick Scores */}
        {resume.isMatched && resume.matchResult ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Sim: {(resume.matchResult.similarity * 100).toFixed(1)}%
            </Badge>
            <Badge
              className={getScoreBadgeColor(
                resume.matchResult.fitScore !== undefined ? resume.matchResult.fitScore : resume.matchResult.similarity
              )}
            >
              Fit:{" "}
              {(
                (resume.matchResult.fitScore !== undefined
                  ? resume.matchResult.fitScore
                  : resume.matchResult.similarity) * 100
              ).toFixed(1)}
              %
            </Badge>
          </div>
        ) : (
          <Badge variant="outline" className="border-orange-200 text-orange-700">
            ⏳ Pending Analysis
          </Badge>
        )}
      </div>
    </div>
  );
}
