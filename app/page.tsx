import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BriefcaseIcon, FileTextIcon, SearchIcon, HistoryIcon, UsersIcon, TrendingUpIcon } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      title: "Job Management",
      description: "Create and manage job postings with AI-powered job description analysis",
      icon: BriefcaseIcon,
      href: "/jobs",
      color: "bg-blue-500",
      stats: "Smart Embedding",
    },
    {
      title: "Resume Processing",
      description: "Upload and process candidate resumes with intelligent chunking",
      icon: FileTextIcon,
      href: "/resumes",
      color: "bg-green-500",
      stats: "AI Chunking",
    },
    {
      title: "Smart Matching",
      description: "Match candidates to jobs using advanced AI similarity scoring",
      icon: SearchIcon,
      href: "/matching",
      color: "bg-purple-500",
      stats: "Vector Search",
    },
    {
      title: "Match History",
      description: "View detailed history of all matching results and decisions",
      icon: HistoryIcon,
      href: "/history",
      color: "bg-orange-500",
      stats: "Full Audit Trail",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
              <UsersIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Hire Assist</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            AI-powered recruitment platform that intelligently matches candidates to job opportunities using advanced
            semantic analysis and vector embeddings
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <TrendingUpIcon className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Vector Search
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Smart Matching
            </Badge>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:scale-105"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-3 rounded-xl ${feature.color} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.stats}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.href}>
                    <Button className="w-full group-hover:bg-slate-900 transition-colors duration-300">
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-8">Powered by Advanced AI</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">Vector</div>
              <div className="text-slate-600 dark:text-slate-400">Embeddings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">GPT-4</div>
              <div className="text-slate-600 dark:text-slate-400">Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">Pinecone</div>
              <div className="text-slate-600 dark:text-slate-400">Search</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
