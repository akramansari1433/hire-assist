"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import {
  BriefcaseIcon,
  UserIcon,
  CalendarIcon,
  UploadIcon,
  ArrowLeftIcon,
  PlayIcon,
  UsersIcon,
  CheckCircleIcon,
  PlusIcon,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

interface Resume {
  id: number;
  candidate: string;
  when: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newResume, setNewResume] = useState({ candidateName: "", fullText: "" });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchResumes();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      // Since we don't have a specific job endpoint, we'll get all jobs and filter
      const response = await fetch("/api/jobs");
      const data = await response.json();
      const foundJob = data.find((j: Job) => j.id === parseInt(jobId));
      setJob(foundJob || null);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/resumes`);
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
  };

  const handleUploadResume = async () => {
    if (!newResume.candidateName || !newResume.fullText) return;

    setUploading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: newResume.candidateName,
          fullText: newResume.fullText,
        }),
      });

      if (response.ok) {
        setNewResume({ candidateName: "", fullText: "" });
        setIsUploadDialogOpen(false); // Close the dialog after successful upload
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
        fetchResumes();
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-pulse">Loading job details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
            <Link href="/jobs">
              <Button>Back to Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/jobs">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-500 rounded-xl">
                <BriefcaseIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{job.title}</h1>
                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 mt-1">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Created {formatDate(job.createdAt)}
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Upload Resume
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Resume for {job.title}</DialogTitle>
                  <DialogDescription>Add a new candidate resume for this job position.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="candidateName">Candidate Name</Label>
                    <Input
                      id="candidateName"
                      placeholder="e.g. John Smith"
                      value={newResume.candidateName}
                      onChange={(e) => setNewResume({ ...newResume, candidateName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="resumeText">Resume Content</Label>
                    <Textarea
                      id="resumeText"
                      placeholder="Paste the complete resume text here..."
                      value={newResume.fullText}
                      onChange={(e) => setNewResume({ ...newResume, fullText: e.target.value })}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleUploadResume}
                    disabled={uploading || !newResume.candidateName || !newResume.fullText}
                    className="w-full"
                  >
                    {uploading ? "Processing..." : "Upload & Process Resume"}
                  </Button>

                  {uploadSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <p className="text-green-700 dark:text-green-400">Resume uploaded successfully!</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Link href={`/jobs/${jobId}/match`}>
              <Button variant="outline">
                <PlayIcon className="h-4 w-4 mr-2" />
                Start Matching
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="description">Job Description</TabsTrigger>
            <TabsTrigger value="resumes">Resumes ({resumes.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
                <CardDescription>Complete job posting details and requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                    {job.jdText}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumes" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Candidate Resumes</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {resumes.length} resumes uploaded for this position
                </p>
              </div>
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Resume
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload New Resume</DialogTitle>
                    <DialogDescription>Add another candidate resume for this job position.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="newCandidateName">Candidate Name</Label>
                      <Input
                        id="newCandidateName"
                        placeholder="e.g. Jane Doe"
                        value={newResume.candidateName}
                        onChange={(e) => setNewResume({ ...newResume, candidateName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="newResumeText">Resume Content</Label>
                      <Textarea
                        id="newResumeText"
                        placeholder="Paste the complete resume text here..."
                        value={newResume.fullText}
                        onChange={(e) => setNewResume({ ...newResume, fullText: e.target.value })}
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleUploadResume}
                      disabled={uploading || !newResume.candidateName || !newResume.fullText}
                      className="w-full"
                    >
                      {uploading ? "Processing..." : "Upload Resume"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {resumes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <UserIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No resumes uploaded yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Upload candidate resumes to start the matching process
                    </p>
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Upload First Resume
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {resumes.map((resume) => (
                  <Card key={resume.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <UserIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{resume.candidate}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                              <CalendarIcon className="h-4 w-4" />
                              Uploaded {formatDate(resume.when)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Resume #{resume.id}</Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Timeline of actions for this job posting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Job created</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{formatDate(job.createdAt)}</p>
                    </div>
                  </div>
                  {resumes.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{resumes.length} resume(s) uploaded</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Ready for matching</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
