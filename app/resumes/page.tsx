"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  UploadIcon,
  FileTextIcon,
  UserIcon,
  BriefcaseIcon,
  SearchIcon,
  CalendarIcon,
  CheckCircleIcon,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  jdText: string;
  createdAt: string;
}

export default function ResumesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newResume, setNewResume] = useState({ candidateName: "", fullText: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
    }
  };

  const handleUploadResume = async () => {
    if (!selectedJob || !newResume.candidateName || !newResume.fullText) return;

    setUploading(true);
    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob.id,
          candidateName: newResume.candidateName,
          fullText: newResume.fullText,
        }),
      });

      if (response.ok) {
        setNewResume({ candidateName: "", fullText: "" });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
    } finally {
      setUploading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => job.title.toLowerCase().includes(searchTerm.toLowerCase()));

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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Resume Processing</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Upload and process candidate resumes with intelligent AI chunking
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Upload Candidate Resume</DialogTitle>
                <DialogDescription>
                  Upload a resume for AI processing. Select a job posting and provide candidate details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Job Selection */}
                <div className="grid gap-2">
                  <Label>Select Job Position</Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search for a job position..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-b-0 ${
                          selectedJob?.id === job.id ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200" : ""
                        }`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Created {formatDate(job.createdAt)}
                            </p>
                          </div>
                          {selectedJob?.id === job.id && <CheckCircleIcon className="h-5 w-5 text-blue-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Candidate Details */}
                <div className="grid gap-2">
                  <Label htmlFor="candidateName">Candidate Name</Label>
                  <Input
                    id="candidateName"
                    placeholder="e.g. John Smith"
                    value={newResume.candidateName}
                    onChange={(e) => setNewResume({ ...newResume, candidateName: e.target.value })}
                  />
                </div>

                {/* Resume Content */}
                <div className="grid gap-2">
                  <Label htmlFor="resumeText">Resume Content</Label>
                  <Textarea
                    id="resumeText"
                    placeholder="Paste the complete resume text here..."
                    value={newResume.fullText}
                    onChange={(e) => setNewResume({ ...newResume, fullText: e.target.value })}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Tip: Copy and paste the entire resume content for best AI analysis results
                  </p>
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleUploadResume}
                  disabled={uploading || !selectedJob || !newResume.candidateName || !newResume.fullText}
                  className="w-full"
                >
                  {uploading ? "Processing Resume..." : "Upload & Process Resume"}
                </Button>

                {uploadSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <p className="text-green-700 dark:text-green-400">Resume uploaded and processed successfully!</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Select Job</TabsTrigger>
            <TabsTrigger value="recent">Recent Uploads</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Process Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="h-6 w-6 text-blue-500" />
                  AI-Powered Resume Processing
                </CardTitle>
                <CardDescription>
                  Our advanced AI system processes resumes through multiple stages for optimal matching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold mb-2">Smart Chunking</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Resume content is intelligently segmented into meaningful chunks
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold mb-2">Vector Embedding</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Each chunk is converted to high-dimensional vector representations
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold mb-2">Index Storage</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Vectors are stored in Pinecone for lightning-fast similarity search
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Active Jobs</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">AI</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Processing</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">Vector</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Search</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4 mt-6">
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search jobs to upload resumes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <BriefcaseIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                            <CalendarIcon className="h-4 w-4" />
                            {formatDate(job.createdAt)}
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => setSelectedJob(job)} className="bg-green-600 hover:bg-green-700">
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Upload Resume
                      </Button>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">{job.jdText}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Recent uploads will appear here</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Upload your first resume to see the processing history
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
