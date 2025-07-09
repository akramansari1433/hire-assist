import { Job, Analytics, MatchResult } from "./types";

export function exportToCSV({
  job,
  matchResults,
  getScoreLabel,
}: {
  job: Job | null;
  matchResults: MatchResult[];
  getScoreLabel: (score: number) => string;
}) {
  const headers = [
    "Rank",
    "Candidate",
    "Fit Score (%)",
    "Similarity (%)",
    "Grade",
    "Matching Skills",
    "Missing Skills",
    "Summary",
  ];
  const csvData = matchResults.map((result, index) => {
    const fitScore = result.fitScore !== undefined ? result.fitScore : result.similarity;
    return [
      index + 1,
      `"${result.candidateName}"`,
      (fitScore * 100).toFixed(1),
      (result.similarity * 100).toFixed(1),
      getScoreLabel(fitScore),
      `"${result.matching_skills.join(", ")}"`,
      `"${result.missing_skills.join(", ")}"`,
      `"${result.summary.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${job?.title || "job"}-analysis-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generatePDFReport({
  job,
  analytics,
  matchResults,
  getScoreLabel,
}: {
  job: Job | null;
  analytics: Analytics;
  matchResults: MatchResult[];
  getScoreLabel: (score: number) => string;
}) {
  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analysis Report - ${job?.title || "Job"}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        h2 { color: #475569; margin-top: 30px; }
        .summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .analytics { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .metric-label { font-size: 12px; color: #64748b; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .grade-excellent { color: #16a34a; font-weight: bold; }
        .grade-good { color: #ca8a04; font-weight: bold; }
        .grade-fair { color: #ea580c; font-weight: bold; }
        .grade-poor { color: #dc2626; font-weight: bold; }
        .skills { font-size: 12px; }
        .generated { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Candidate Analysis Report</h1>
      <div class="summary">
        <h2>Job: ${job?.title || "Unknown"}</h2>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p><strong>Total Candidates Analyzed:</strong> ${analytics.total}</p>
        <p><strong>Average Score:</strong> ${(analytics.averageScore * 100).toFixed(1)}%</p>
      </div>

      <h2>Performance Summary</h2>
      <div class="analytics">
        <div class="metric">
          <div class="metric-value" style="color: #16a34a;">${analytics.excellent}</div>
          <div class="metric-label">Excellent (80%+)</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #ca8a04;">${analytics.good}</div>
          <div class="metric-label">Good (60-79%)</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #ea580c;">${analytics.fair}</div>
          <div class="metric-label">Fair (40-59%)</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: #dc2626;">${analytics.poor}</div>
          <div class="metric-label">Poor (<40%)</div>
        </div>
      </div>

      <h2>Detailed Results</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Candidate</th>
            <th>Fit Score</th>
            <th>Grade</th>
            <th>Key Matching Skills</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          ${matchResults
            .map((result, index) => {
              const fitScore = result.fitScore !== undefined ? result.fitScore : result.similarity;
              const grade = getScoreLabel(fitScore);
              const gradeClass =
                fitScore >= 0.8
                  ? "grade-excellent"
                  : fitScore >= 0.6
                  ? "grade-good"
                  : fitScore >= 0.4
                  ? "grade-fair"
                  : "grade-poor";
              return `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${result.candidateName}</strong></td>
                <td>${(fitScore * 100).toFixed(1)}%</td>
                <td class="${gradeClass}">${grade}</td>
                <td class="skills">${result.matching_skills.slice(0, 5).join(", ")}</td>
                <td class="skills">${result.summary}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>

      <div class="generated">
        Report generated by Hire Assist • ${new Date().toISOString()}
      </div>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
