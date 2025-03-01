import React from 'react';
import { Link } from 'react-router-dom';
import { ActivitySquare, ArrowRight, Upload, Activity, FileText, Stethoscope, LineChart, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-cyan-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex gap-2 items-center">
            <ActivitySquare className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              ReCare
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-2">
              <Link to="/login">
                <button className="px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md text-sm font-medium">
                  Login
                </button>
              </Link>
              <Link to="/signup">
                <button className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-md text-sm font-medium">
                  Sign Up
                </button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 px-4">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-sm text-blue-700 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span> Hospital Readmission Prevention
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-600 bg-clip-text text-transparent">
                    Predict and prevent hospital readmissions
                  </h1>
                  <p className="max-w-[600px] text-slate-700 md:text-xl">
                    Upload patient medical records and get AI-powered readmission risk assessments, insights, and personalized care recommendations.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link to="/signup">
                    <button className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200/50">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                      Learn More
                    </button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[450px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-blue-100 to-cyan-100 p-6 shadow-xl">
                  <div className="absolute inset-0 bg-grid-blue/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
                  <div className="relative flex h-full flex-col items-center justify-center gap-6 rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                      <Upload className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-bold text-blue-900">Upload Patient Records</h3>
                      <p className="text-slate-600">Securely upload medical records for AI analysis</p>
                    </div>
                    <div className="flex flex-col gap-2 min-[400px]:flex-row">
                      <Link to="/signup">
                        <button className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 px-4 py-2 text-sm font-semibold text-white">
                          Upload Files
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-flex h-10 items-center justify-center rounded-full bg-blue-100 px-4 text-sm font-medium text-blue-700">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-600 bg-clip-text text-transparent">
                  Readmission Prevention Made Simple
                </h2>
                <p className="max-w-[900px] text-slate-700 md:text-xl">
                  Our platform makes it easy to identify at-risk patients and take proactive measures
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3 md:gap-12">
              <div className="flex flex-col items-center space-y-4 rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 shadow-md">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Upload</h3>
                <p className="text-center text-slate-600">
                  Securely upload patient medical records, lab results, or discharge summaries
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 shadow-md">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Analyze</h3>
                <p className="text-center text-slate-600">
                  Our AI analyzes patient data to identify readmission risk factors and patterns
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-md">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Prevent</h3>
                <p className="text-center text-slate-600">
                  Get personalized care recommendations to reduce readmission risk
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <div className="space-y-4">
                  <div className="inline-flex h-10 items-center justify-center rounded-full bg-blue-100 px-4 text-sm font-medium text-blue-700">
                    Features
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-600 bg-clip-text text-transparent">
                    Comprehensive Readmission Risk Analysis
                  </h2>
                  <p className="max-w-[600px] text-slate-700 md:text-xl/relaxed">
                    Our platform provides detailed insights into patient readmission risks, helping you make informed care decisions.
                  </p>
                </div>
                <div className="mt-8 grid gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <FileText className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">Document Analysis</h3>
                      <p className="text-slate-600">
                        Extract and analyze information from medical records, discharge summaries, and lab results.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                      <LineChart className="h-5 w-5 text-cyan-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">Risk Stratification</h3>
                      <p className="text-slate-600">
                        Categorize patients by readmission risk level with clear visual indicators.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
                      <Users className="h-5 w-5 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">Care Recommendations</h3>
                      <p className="text-slate-600">Get tailored intervention suggestions based on patient-specific risk factors.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative h-[500px] w-full overflow-hidden rounded-2xl shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
                    alt="Medical analysis visualization"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}