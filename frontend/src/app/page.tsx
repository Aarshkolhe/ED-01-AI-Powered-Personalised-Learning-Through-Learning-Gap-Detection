import Link from 'next/link';
import {
  Sparkles,
  Brain,
  Network,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  GraduationCap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Subtle radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Adaptive Learning Recovery</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Stop guessing why students struggle.{' '}
            <span className="bg-gradient-to-r from-teal-300 via-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Isolate learning gaps with mathematical precision.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            LearnLens AI unites <strong>Bayesian Knowledge Tracing (BKT)</strong>, deterministic step-by-step mistake detection, and Google Gemini AI to uncover hidden conceptual misconceptions and synthesize automatic recovery learning paths.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/student"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-xl shadow-teal-500/25 flex items-center justify-center space-x-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Launch Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/teacher"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
            >
              <BarChart3 className="w-4 h-4 text-teal-400" />
              <span>Teacher Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Grid: Mandatory & Priority Deliverables */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Three Interconnected Core Modules</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Engineered for genuine learning diagnosis rather than static question drill
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Module 1 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/40 transition-colors shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">1. Student Learning Portal</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Adaptive diagnostic assessments with instantaneous misconception classification, response-time signal tracking, and Gemini-powered pedagogical explanations.
              </p>
            </div>
            <Link href="/student" className="mt-6 text-xs font-semibold text-teal-400 flex items-center space-x-1 hover:text-teal-300">
              <span>Try Student Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Module 2 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/40 transition-colors shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">2. Knowledge-Graph Explorer</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Interactive React Flow curriculum graph modeling prerequisite and successor math dependencies with real-time Bayesian student mastery states and learning gap alerts.
              </p>
            </div>
            <Link href="/student" className="mt-6 text-xs font-semibold text-emerald-400 flex items-center space-x-1 hover:text-emerald-300">
              <span>Explore Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Module 3 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-teal-500/40 transition-colors shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">3. Teacher Analytics Dashboard</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Comprehensive educator command center featuring concept mastery heatmaps, at-risk student rosters, shared misconception frequencies, and actionable intervention plans.
              </p>
            </div>
            <Link href="/teacher" className="mt-6 text-xs font-semibold text-rose-400 flex items-center space-x-1 hover:text-rose-300">
              <span>View Classroom Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced Capabilities Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-16">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-200">Step-by-Step Mistake Detection</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Inspects every transformation step in equations to pinpoint the exact faulty operation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-200">Learning Recovery Score (LRS)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Normalized pre/post reassessment scoring with transparent progress tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-200">Schema-Validated Question AI</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Generates verified diagnostic distractors with rigorous mathematical validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
