"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import JobCard, { JobCardSkeleton } from "./components/job-card";
import CreateJobDialog from "./components/create-job-dialog";
import DeleteJobDialog from "./components/delete-job-dialog";
import { BriefcaseIcon, SearchIcon } from "lucide-react";

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
  const [deleting, setDeleting] = useState<number | null>(null);
  const [newJob, setNewJob] = useState({ title: "", jdText: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

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
        setIsDialogOpen(false);
        fetchJobs();
      }
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (job: Job) => {
    setJobToDelete(job);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    setDeleting(jobToDelete.id);
    try {
      const response = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `Job deleted: ${result.deletedJob.title}, ${result.deletedResumes} resumes, ${result.deletedComparisons} comparisons`
        );
        fetchJobs(); // Refresh the list
      } else {
        const error = await response.json();
        console.error("Delete failed:", error);
        alert(`Failed to delete job: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job. Please try again.");
    } finally {
      setDeleting(null);
      setDeleteConfirmOpen(false);
      setJobToDelete(null);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jdText.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          <CreateJobDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            newJob={newJob}
            setNewJob={setNewJob}
            creating={creating}
            onCreate={handleCreateJob}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteJobDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          jobToDelete={jobToDelete}
          deleting={deleting !== null}
          onConfirm={confirmDeleteJob}
        />

        {/* Search bar */}
        <div className="flex items-center justify-end mb-6">
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

        {/* Job list */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
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
              <JobCard key={job.id} job={job} onDelete={handleDeleteJob} deleting={deleting === job.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
