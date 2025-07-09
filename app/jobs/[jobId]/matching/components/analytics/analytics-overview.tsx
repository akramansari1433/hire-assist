import { Card, CardContent } from "@/components/ui/card";
import { TargetIcon, TrendingUpIcon, BarChart3Icon } from "lucide-react";
import { Analytics } from "../../types";

interface AnalyticsOverviewProps {
  analytics: Analytics;
  hasAnyResults: boolean;
}

export function AnalyticsOverview({ analytics, hasAnyResults }: AnalyticsOverviewProps) {
  if (!hasAnyResults) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{analytics.total}</p>
              <p className="text-xs text-slate-600">Total Analyzed</p>
            </div>
            <TargetIcon className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{analytics.excellent}</p>
              <p className="text-xs text-slate-600">Excellent (80%+)</p>
            </div>
            <TrendingUpIcon className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{analytics.good}</p>
              <p className="text-xs text-slate-600">Good (60-79%)</p>
            </div>
            <BarChart3Icon className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{analytics.fair}</p>
              <p className="text-xs text-slate-600">Fair (40-59%)</p>
            </div>
            <BarChart3Icon className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{(analytics.averageScore * 100).toFixed(1)}%</p>
              <p className="text-xs text-slate-600">Average Score</p>
            </div>
            <TargetIcon className="h-8 w-8 text-slate-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
