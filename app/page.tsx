import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, UploadIcon, ZapIcon, CheckCircleIcon, ArrowRightIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-2xl">
                <BriefcaseIcon className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">AI-Powered Resume Matching</h1>

            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Match candidates to jobs using AI vector embeddings and get detailed analysis with similarity and fit
              scores.
            </p>

            <Link href="/jobs">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold">
                Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Four simple steps to find the best candidates using AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <Card className="text-center border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full mx-auto mb-2 w-fit">
                  Step 1
                </div>
                <CardTitle className="text-lg">Create Job</CardTitle>
                <CardDescription>
                  Post job descriptions which are automatically converted to AI embeddings and stored in Pinecone
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 2 */}
            <Card className="text-center border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <UploadIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="bg-green-600 text-white text-sm font-semibold px-3 py-1 rounded-full mx-auto mb-2 w-fit">
                  Step 2
                </div>
                <CardTitle className="text-lg">Upload Resumes</CardTitle>
                <CardDescription>
                  Upload candidate resumes which are processed and stored as AI embeddings for semantic matching
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 3 */}
            <Card className="text-center border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <ZapIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="bg-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full mx-auto mb-2 w-fit">
                  Step 3
                </div>
                <CardTitle className="text-lg">Vector Matching</CardTitle>
                <CardDescription>
                  AI compares resume and job embeddings using vector similarity to find the best matches
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 4 */}
            <Card className="text-center border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="bg-orange-600 text-white text-sm font-semibold px-3 py-1 rounded-full mx-auto mb-2 w-fit">
                  Step 4
                </div>
                <CardTitle className="text-lg">AI Analysis</CardTitle>
                <CardDescription>
                  Get detailed analysis with matching skills, missing skills, summary, and dual scoring (similarity +
                  fit)
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Key Features</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Feature 1 */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dual Scoring System</h3>
              <p className="text-slate-600">
                Get both vector similarity scores (0-100%) and AI-generated fit scores (0.0-1.0) for comprehensive
                candidate evaluation
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Detailed Analysis</h3>
              <p className="text-slate-600">
                AI provides matching skills, missing skills, and detailed summaries for each candidate comparison
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Vector Embeddings</h3>
              <p className="text-slate-600">
                Uses Pinecone vector database for fast, semantic matching that goes beyond keyword matching
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Easy Management</h3>
              <p className="text-slate-600">
                Simple interface to manage jobs, upload resumes, and view detailed comparison results
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Matching?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Create your first job posting and start uploading resumes to see AI-powered matching in action.
          </p>

          <Link href="/jobs">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
              Start Matching
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
