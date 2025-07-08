import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BriefcaseIcon,
  UsersIcon,
  ZapIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen flex items-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-3xl shadow-lg">
                <UsersIcon className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Find the Perfect
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Candidate
              </span>
              <br />
              in Minutes
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-powered recruitment platform that matches candidates to jobs with 95% accuracy. Stop spending weeks on
              hiring - let AI do the heavy lifting.
            </p>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <span className="text-slate-600">Trusted by 500+ companies</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
              <Link href="/jobs">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Hiring Now
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold border-2 border-slate-300 hover:border-slate-400"
              >
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">95%</div>
                <div className="text-slate-600">Match Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">10x</div>
                <div className="text-slate-600">Faster Hiring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">500+</div>
                <div className="text-slate-600">Happy Companies</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">Why Choose Hire Assist</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Hire Smarter, Not Harder</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Transform your hiring process with AI that understands both jobs and candidates better than ever before.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Benefit 1 */}
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ZapIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Lightning Fast</CardTitle>
                <CardDescription className="text-lg text-slate-600">
                  Match candidates in seconds, not days. Our AI processes resumes 100x faster than manual review.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Benefit 2 */}
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUpIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">95% Accuracy</CardTitle>
                <CardDescription className="text-lg text-slate-600">
                  Advanced AI ensures you find candidates who actually fit, reducing bad hires by 90%.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Benefit 3 */}
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Bias-Free</CardTitle>
                <CardDescription className="text-lg text-slate-600">
                  AI focuses purely on skills and qualifications, ensuring fair and unbiased candidate evaluation.
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
            <Badge className="mb-4 bg-purple-100 text-purple-800 border-purple-200">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Everything You Need to Hire Better</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            {/* Feature 1 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Smart Job Posting</h3>
              </div>
              <p className="text-lg text-slate-600 mb-6">
                Create job descriptions that attract the right candidates. Our AI analyzes your requirements and
                optimizes for better matches.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>AI-optimized job descriptions</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Automatic skills extraction</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Industry benchmarking</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                <BriefcaseIcon className="h-24 w-24 text-blue-500" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg order-last md:order-none">
              <div className="h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
                <UsersIcon className="h-24 w-24 text-green-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Intelligent Matching</h3>
              </div>
              <p className="text-lg text-slate-600 mb-6">
                Our AI analyzes resumes and matches candidates based on skills, experience, and cultural fit - not just
                keywords.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Semantic understanding of skills</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Experience level matching</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Cultural fit analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Loved by HR Teams Worldwide</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  &quot;Hire Assist reduced our hiring time from 6 weeks to 1 week. The AI matching is incredibly
                  accurate!&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">SJ</span>
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Johnson</div>
                    <div className="text-sm text-slate-500">HR Director, TechCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  &quot;The quality of candidates has improved dramatically. We&apos;re finding people who actually fit
                  our culture.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">MC</span>
                  </div>
                  <div>
                    <div className="font-semibold">Michael Chen</div>
                    <div className="text-sm text-slate-500">Talent Manager, StartupXYZ</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  &quot;Game changer! Our team can now focus on interviews instead of screening hundreds of
                  resumes.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">EP</span>
                  </div>
                  <div>
                    <div className="font-semibold">Emily Parker</div>
                    <div className="text-sm text-slate-500">Recruiter, GlobalCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of companies already using Hire Assist to find better candidates faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8">
            <Link href="/jobs">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-blue-600"
            >
              Schedule Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Setup in 5 minutes</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
