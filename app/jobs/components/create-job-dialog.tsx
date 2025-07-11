import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import React from "react";

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newJob: { title: string; jdText: string };
  setNewJob: (job: { title: string; jdText: string }) => void;
  creating: boolean;
  onCreate: () => void;
}

export default function CreateJobDialog({
  open,
  onOpenChange,
  newJob,
  setNewJob,
  creating,
  onCreate,
}: CreateJobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create New Job Posting</DialogTitle>
          <DialogDescription>
            Add a new job with detailed description. Our AI will automatically process and embed the content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
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
              rows={6}
              className="max-h-40 resize-none"
            />
          </div>
        </div>
        <div className="border-t pt-4">
          <Button onClick={onCreate} disabled={creating || !newJob.title || !newJob.jdText} className="w-full">
            {creating ? "Creating..." : "Create Job Posting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
