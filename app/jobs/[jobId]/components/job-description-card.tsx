import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PencilIcon } from "lucide-react";
import { Job } from "../types";

interface JobDescriptionCardProps {
  job: Job;
  onUpdate: (title: string, jdText: string) => Promise<void>;
  isUpdating: boolean;
}

export function JobDescriptionCard({ job, onUpdate, isUpdating }: JobDescriptionCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({ title: "", jdText: "" });

  const handleEditClick = () => {
    setEditData({ title: job.title, jdText: job.jdText });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editData.title.trim() || !editData.jdText.trim()) return;

    await onUpdate(editData.title.trim(), editData.jdText.trim());
    setIsEditOpen(false);
    setEditData({ title: "", jdText: "" });
  };

  const handleCancel = () => {
    setIsEditOpen(false);
    setEditData({ title: "", jdText: "" });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Description</CardTitle>
              <CardDescription>Edit job details and JD</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleEditClick}>
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Job Title */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{job.title}</h3>
            </div>

            {/* Job Description */}
            <div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {job.jdText}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Job Details</DialogTitle>
            <DialogDescription>Update the job title and description</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
            <div className="grid gap-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g. Senior Software Engineer"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Enter the full job description here..."
                value={editData.jdText}
                onChange={(e) => setEditData({ ...editData, jdText: e.target.value })}
                rows={12}
                className="max-h-96 resize-none"
              />
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating || !editData.title.trim() || !editData.jdText.trim()}>
                {isUpdating ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
