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
  GraduationCap,
  Layers,
  Compass,
  Target,
  Users
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent text-slate-100 selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      {/* 1. HERO SECTION WITH PROPER SPACING & VISIBILITY */}
      <section
        id="hero"
        className="relative pt-6 sm:pt-10 md:pt-14 pb-14 sm:pb-20 overflow-hidden"
      >
        {/* Subtle grid pattern for modern AI tech aesthetic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Hero Central Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Centered Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-950/40 backdrop-blur-md shadow-sm mb-5 hover:border-cyan-400/40 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span className="text-xs sm:text-sm font-semibold text-cyan-300 tracking-wide">
              AI-Powered Learning Platform
            </span>
          </div>

          {/* Large, Bold Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto">
            Stop guessing why students struggle.{' '}
            <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-cyan-200 bg-clip-text text-transparent inline-block">
              Isolate learning gaps with mathematical precision.
            </span>
          </h1>

          {/* Supporting Paragraph */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            ThinkFlow uses Bayesian Knowledge Tracing (BKT), deterministic step-by-step mistake detection, and AI-powered learning to uncover hidden conceptual misconceptions and personalize learning paths.
          </p>

          {/* Two CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {/* Primary CTA: Launch Student Portal */}
            <Link
              href="/student"
              className="group w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-bold text-sm sm:text-base transition-all duration-300 shadow-[0_0_25px_rgba(34,211,238,0.35)] hover:shadow-[0_0_35px_rgba(34,211,238,0.55)] hover:scale-[1.02] flex items-center justify-center space-x-3"
            >
              <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span>Launch Student Portal</span>
            </Link>

            {/* Secondary CTA: Teacher Analytics */}
            <Link
              href="/teacher"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800/80 backdrop-blur-md border border-slate-700/70 hover:border-cyan-500/40 text-slate-200 font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2.5"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Teacher Analytics</span>
            </Link>
          </div>
        </div>

        {/* Bottom Feature Strip with 4 items: Adaptive Learning, Knowledge Graph, Real-Time Feedback, Teacher Insights */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl p-4 sm:p-5 shadow-2xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/70">
              {/* 1. Adaptive Learning */}
              <div className="flex items-center space-x-3 pt-3 lg:pt-0 sm:px-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-sm">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight">Adaptive Learning</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-normal mt-0.5">Personalised to your needs</p>
                </div>
              </div>

              {/* 2. Knowledge Graph */}
              <div className="flex items-center space-x-3 pt-3 lg:pt-0 sm:px-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0 text-teal-400 shadow-sm">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight">Knowledge Graph</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-normal mt-0.5">See the bigger picture</p>
                </div>
              </div>

              {/* 3. Real-Time Feedback */}
              <div className="flex items-center space-x-3 pt-3 lg:pt-0 sm:px-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-sm">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight">Real-Time Feedback</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-normal mt-0.5">Learn from every step</p>
                </div>
              </div>

              {/* 4. Teacher Insights */}
              <div className="flex items-center space-x-3 pt-3 lg:pt-0 sm:px-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight">Teacher Insights</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-normal mt-0.5">Better support, better outcomes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE MODULES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-slate-800/80">
        <div className="text-center mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Integrated Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Three Interconnected Core Modules
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2.5 max-w-2xl mx-auto">
            Engineered for genuine learning diagnosis rather than static question drill
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Module 1: Student Learning Portal */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 sm:p-7 hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Module 01</span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">Student Learning Portal</h3>
              <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
                Adaptive diagnostic assessments with instantaneous misconception classification, response-time signal tracking, and AI-powered pedagogical explanations.
              </p>
            </div>
            <Link
              href="/student"
              className="mt-6 sm:mt-8 text-sm font-bold text-cyan-400 flex items-center space-x-2 hover:text-cyan-300 transition-colors"
            >
              <span>Try Student Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Module 2: Knowledge-Graph Explorer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 sm:p-7 hover:border-teal-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-105 transition-transform">
                <Network className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Module 02</span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">Knowledge-Graph Explorer</h3>
              <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
                Interactive React Flow curriculum graph modeling prerequisite and successor math dependencies with real-time Bayesian student mastery states and learning gap alerts.
              </p>
            </div>
            <Link
              href="/student"
              className="mt-6 sm:mt-8 text-sm font-bold text-teal-400 flex items-center space-x-2 hover:text-teal-300 transition-colors"
            >
              <span>Explore Graph</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Module 3: Teacher Analytics Dashboard */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-6 sm:p-7 hover:border-purple-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Module 03</span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">Teacher Analytics Dashboard</h3>
              <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
                Comprehensive educator command center featuring concept mastery heatmaps, at-risk student rosters, shared misconception frequencies, and actionable intervention plans.
              </p>
            </div>
            <Link
              href="/teacher"
              className="mt-6 sm:mt-8 text-sm font-bold text-purple-400 flex items-center space-x-2 hover:text-purple-300 transition-colors"
            >
              <span>View Classroom Analytics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-slate-800/80">
        <div className="text-center mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Workflow & Engine</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Thinkflow Identifies & Heals Gaps
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2.5 max-w-2xl mx-auto">
            A three-stage cognitive pipeline uniting rigorous psychometrics with modern AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 mb-4">
              1
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white">Diagnostic Assessment</h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Students answer targeted questions with distractor options engineered to reveal specific mental missteps and capture confidence ratings.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md">
            <div className="w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400 mb-4">
              2
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white">Bayesian Gap Tracing</h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Bayesian Knowledge Tracing (BKT) updates skill mastery probabilities dynamically while mapping back through prerequisite graph bottlenecks.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 mb-4">
              3
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white">Targeted Recovery Path</h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Thinkflow generates personalized step-by-step remediation, spaced revision reminders, and calculates real-time Learning Recovery Scores.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ADVANCED CAPABILITIES ROW */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-16 border-t border-slate-800/80">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Step-by-Step Mistake Detection</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Inspects every transformation step in equations to pinpoint the exact faulty mathematical operation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Learning Recovery Score (LRS)</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Normalized pre/post reassessment scoring with transparent progress tracking and retention evaluation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Schema-Validated Question AI</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Generates verified diagnostic distractors with teacher review workflows and rigorous mathematical validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
