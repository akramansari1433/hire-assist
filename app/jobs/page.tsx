"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, BriefcaseIcon, CalendarIcon, UsersIcon, SearchIcon, ArrowRightIcon } from "lucide-react";

interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", jdText: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.jdText) return;

    setCreating(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });

      if (response.ok) {
        setNewJob({ title: "", jdText: "" });
        setIsDialogOpen(false); // Close the dialog after successful creation
        fetchJobs();
      }
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setCreating(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jdText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Job Management</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Create and manage job postings with AI-powered analysis
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Job Posting</DialogTitle>
                <DialogDescription>
                  Add a new job with detailed description. Our AI will automatically process and embed the content.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Senior Software Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter detailed job description, requirements, and qualifications..."
                    value={newJob.jdText}
                    onChange={(e) => setNewJob({ ...newJob, jdText: e.target.value })}
                    rows={8}
                  />
                </div>
                <Button
                  onClick={handleCreateJob}
                  disabled={creating || !newJob.title || !newJob.jdText}
                  className="w-full"
                >
                  {creating ? "Creating..." : "Create Job Posting"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-fit grid-cols-3">
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse">Loading jobs...</div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BriefcaseIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {searchTerm ? "Try adjusting your search terms." : "Create your first job posting to get started."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <BriefcaseIcon className="h-4 w-4 text-white" />
                            </div>
                            <CardTitle className="text-xl">{job.title}</CardTitle>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {formatDate(job.createdAt)}
                            </div>
                          </div>
                          <CardDescription className="line-clamp-2">{job.jdText}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Link href={`/jobs/${job.id}?tab=resumes`}>
                            <Button variant="outline" size="sm">
                              <UsersIcon className="h-4 w-4 mr-2" />
                              View Resumes
                            </Button>
                          </Link>
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="outline" size="sm">
                              <BriefcaseIcon className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                        <Link href={`/jobs/${job.id}?tab=matching`}>
                          <Button size="sm">
                            Start Matching
                            <ArrowRightIcon className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="grid gap-4">
              {filteredJobs
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((job) => (
                  <Card key={job.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <BriefcaseIcon className="h-5 w-5 text-blue-500" />
                          {job.title}
                        </CardTitle>
                        <Badge variant="outline">{formatDate(job.createdAt)}</Badge>
                      </div>
                      <CardDescription className="line-clamp-1">{job.jdText}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BriefcaseIcon className="h-5 w-5 text-green-500" />
                        {job.title}
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <CardDescription className="line-clamp-1">{job.jdText}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
