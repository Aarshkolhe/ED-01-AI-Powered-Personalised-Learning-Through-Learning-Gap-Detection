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
    <div className="min-h-screen bg-[#241B15] text-[#EAE0D2] selection:bg-[#25DCC6] selection:text-[#2D2D2D]">
      {/* 1. HERO SECTION MATCHING REFERENCE IMAGE CLOSELY */}
      <section
        id="hero"
        className="relative min-h-[95vh] flex flex-col justify-between overflow-hidden"
      >
        {/* Layer 1: High-Res Topographic Contour Map Background (Warm Mocha, Sand, Caramel) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-1000 scale-[1.01]"
          style={{ backgroundImage: `url('/hero-reference-bg.jpg')` }}
        />

        {/* Layer 2: Delicate warm ambient lighting and soft misty diffusion in center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,30,24,0.18)_0%,rgba(35,26,20,0.35)_60%,rgba(30,22,17,0.55)_100%)] pointer-events-none" />

        {/* Layer 3: Soft top and bottom edge transitions */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#241B15]/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#241B15] via-[#241B15]/60 to-transparent pointer-events-none" />

        {/* Hero Central Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 sm:pt-28 md:pt-32 flex flex-col items-center">
          {/* Centered Badge: ✦ AI-Powered Learning Platform */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#2D231C]/65 backdrop-blur-md shadow-lg shadow-black/20 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#25DCC6] fill-[#25DCC6]" />
            <span className="text-xs sm:text-sm font-medium text-[#25DCC6] tracking-wide">
              AI-Powered Learning Platform
            </span>
          </div>

          {/* Large, Bold Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight text-white leading-[1.12] sm:leading-[1.14]">
            Stop guessing why students struggle.{' '}
            <span className="text-[#25DCC6] inline-block font-extrabold">
              Isolate learning gaps with mathematical precision.
            </span>
          </h1>

          {/* Supporting Paragraph */}
          <p className="mt-6 text-sm sm:text-base md:text-lg text-[#EAE0D2]/85 max-w-2xl mx-auto leading-relaxed font-normal">
            Thinkflow uses Bayesian Knowledge Tracing (BKT), deterministic step-by-step mistake detection, and Google Gemini AI to uncover hidden conceptual misconceptions and personalize learning paths.
          </p>

          {/* Two CTA Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto">
            {/* Primary CTA: Launch Student Portal with Dark Circle Arrow and Turquoise Glow */}
            <Link
              href="/student"
              className="group w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#25DCC6] hover:bg-[#20caa5] text-[#2D2D2D] font-bold text-sm sm:text-base transition-all duration-300 shadow-[0_0_30px_rgba(37,220,198,0.55)] hover:shadow-[0_0_45px_rgba(37,220,198,0.75)] hover:scale-[1.02] flex items-center justify-center space-x-3"
            >
              <div className="w-6 h-6 rounded-full bg-[#2D2D2D] flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-3.5 h-3.5 text-[#25DCC6] group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span>Launch Student Portal</span>
            </Link>

            {/* Secondary CTA: Teacher Analytics */}
            <Link
              href="/teacher"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#2D231C]/65 hover:bg-[#2D231C]/85 backdrop-blur-md border border-white/15 hover:border-white/30 text-[#EAE0D2] font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2.5"
            >
              <BarChart3 className="w-4 h-4 text-[#25DCC6]" />
              <span>Teacher Analytics</span>
            </Link>
          </div>
        </div>

        {/* Bottom Feature Strip with 4 items: Adaptive Learning, Knowledge Graph, Real-Time Feedback, Teacher Insights */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-16 sm:pt-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* 1. Adaptive Learning */}
            <div className="flex items-center space-x-3.5">
              <Brain className="w-6 h-6 text-[#25DCC6] flex-shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight">Adaptive Learning</h4>
                <p className="text-xs text-[#D7C9AE]/70 font-normal mt-0.5">Personalised to your needs</p>
              </div>
            </div>

            {/* 2. Knowledge Graph */}
            <div className="flex items-center space-x-3.5">
              <Network className="w-6 h-6 text-[#25DCC6] flex-shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight">Knowledge Graph</h4>
                <p className="text-xs text-[#D7C9AE]/70 font-normal mt-0.5">See the bigger picture</p>
              </div>
            </div>

            {/* 3. Real-Time Feedback */}
            <div className="flex items-center space-x-3.5">
              <Target className="w-6 h-6 text-[#25DCC6] flex-shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight">Real-Time Feedback</h4>
                <p className="text-xs text-[#D7C9AE]/70 font-normal mt-0.5">Learn from every step</p>
              </div>
            </div>

            {/* 4. Teacher Insights */}
            <div className="flex items-center space-x-3.5">
              <Users className="w-6 h-6 text-[#25DCC6] flex-shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight">Teacher Insights</h4>
                <p className="text-xs text-[#D7C9AE]/70 font-normal mt-0.5">Better support, better outcomes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE MODULES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D7C9AE]/15">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#25DCC6]/10 border border-[#25DCC6]/30 text-[#25DCC6] text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Integrated Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Three Interconnected Core Modules
          </h2>
          <p className="text-sm sm:text-base text-[#D7C9AE]/80 mt-3 max-w-2xl mx-auto">
            Engineered for genuine learning diagnosis rather than static question drill
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Module 1: Student Learning Portal */}
          <div className="rounded-2xl border border-white/10 bg-[#2D231C]/70 backdrop-blur-md p-7 hover:border-[#25DCC6]/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#25DCC6]/15 border border-[#25DCC6]/30 flex items-center justify-center text-[#25DCC6] mb-5 group-hover:scale-105 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A68763]">Module 01</span>
              <h3 className="text-xl font-bold text-white mt-1">Student Learning Portal</h3>
              <p className="text-sm text-[#EAE0D2]/75 mt-3 leading-relaxed">
                Adaptive diagnostic assessments with instantaneous misconception classification, response-time signal tracking, and Gemini-powered pedagogical explanations.
              </p>
            </div>
            <Link
              href="/student"
              className="mt-8 text-sm font-bold text-[#25DCC6] flex items-center space-x-2 hover:text-[#4ee8d7] transition-colors"
            >
              <span>Try Student Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Module 2: Knowledge-Graph Explorer */}
          <div className="rounded-2xl border border-white/10 bg-[#2D231C]/70 backdrop-blur-md p-7 hover:border-[#25DCC6]/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#25DCC6]/15 border border-[#25DCC6]/30 flex items-center justify-center text-[#25DCC6] mb-5 group-hover:scale-105 transition-transform">
                <Network className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A68763]">Module 02</span>
              <h3 className="text-xl font-bold text-white mt-1">Knowledge-Graph Explorer</h3>
              <p className="text-sm text-[#EAE0D2]/75 mt-3 leading-relaxed">
                Interactive React Flow curriculum graph modeling prerequisite and successor math dependencies with real-time Bayesian student mastery states and learning gap alerts.
              </p>
            </div>
            <Link
              href="/student"
              className="mt-8 text-sm font-bold text-[#25DCC6] flex items-center space-x-2 hover:text-[#4ee8d7] transition-colors"
            >
              <span>Explore Graph</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Module 3: Teacher Analytics Dashboard */}
          <div className="rounded-2xl border border-white/10 bg-[#2D231C]/70 backdrop-blur-md p-7 hover:border-[#25DCC6]/50 transition-all duration-300 shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#25DCC6]/15 border border-[#25DCC6]/30 flex items-center justify-center text-[#25DCC6] mb-5 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A68763]">Module 03</span>
              <h3 className="text-xl font-bold text-white mt-1">Teacher Analytics Dashboard</h3>
              <p className="text-sm text-[#EAE0D2]/75 mt-3 leading-relaxed">
                Comprehensive educator command center featuring concept mastery heatmaps, at-risk student rosters, shared misconception frequencies, and actionable intervention plans.
              </p>
            </div>
            <Link
              href="/teacher"
              className="mt-8 text-sm font-bold text-[#25DCC6] flex items-center space-x-2 hover:text-[#4ee8d7] transition-colors"
            >
              <span>View Classroom Analytics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#D7C9AE]/15">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#25DCC6]/10 border border-[#25DCC6]/30 text-[#25DCC6] text-xs font-semibold mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Workflow & Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Thinkflow Identifies & Heals Gaps
          </h2>
          <p className="text-sm sm:text-base text-[#D7C9AE]/80 mt-3 max-w-2xl mx-auto">
            A three-stage cognitive pipeline uniting rigorous psychometrics with modern AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-[#2D231C]/60 backdrop-blur-md">
            <div className="w-9 h-9 rounded-lg bg-[#A68763]/20 border border-[#A68763]/40 flex items-center justify-center font-bold text-white mb-4">
              1
            </div>
            <h4 className="text-lg font-bold text-white">Diagnostic Assessment</h4>
            <p className="text-xs sm:text-sm text-[#EAE0D2]/75 mt-2 leading-relaxed">
              Students answer targeted questions with distractor options engineered to reveal specific mental missteps and capture confidence ratings.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-[#2D231C]/60 backdrop-blur-md">
            <div className="w-9 h-9 rounded-lg bg-[#25DCC6]/20 border border-[#25DCC6]/40 flex items-center justify-center font-bold text-[#25DCC6] mb-4">
              2
            </div>
            <h4 className="text-lg font-bold text-white">Bayesian Gap Tracing</h4>
            <p className="text-xs sm:text-sm text-[#EAE0D2]/75 mt-2 leading-relaxed">
              Bayesian Knowledge Tracing (BKT) updates skill mastery probabilities dynamically while mapping back through prerequisite graph bottlenecks.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-[#2D231C]/60 backdrop-blur-md">
            <div className="w-9 h-9 rounded-lg bg-[#D7C9AE]/20 border border-[#D7C9AE]/40 flex items-center justify-center font-bold text-white mb-4">
              3
            </div>
            <h4 className="text-lg font-bold text-white">Targeted Recovery Path</h4>
            <p className="text-xs sm:text-sm text-[#EAE0D2]/75 mt-2 leading-relaxed">
              Thinkflow generates personalized step-by-step remediation, spaced revision reminders, and calculates real-time Learning Recovery Scores.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ADVANCED CAPABILITIES ROW */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-20 border-t border-[#D7C9AE]/15">
        <div className="bg-[#2D231C]/75 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-xl bg-[#25DCC6]/15 border border-[#25DCC6]/30 text-[#25DCC6] flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Step-by-Step Mistake Detection</h4>
                <p className="text-xs text-[#D7C9AE]/80 mt-1 leading-relaxed">
                  Inspects every transformation step in equations to pinpoint the exact faulty mathematical operation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-xl bg-[#25DCC6]/15 border border-[#25DCC6]/30 text-[#25DCC6] flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Learning Recovery Score (LRS)</h4>
                <p className="text-xs text-[#D7C9AE]/80 mt-1 leading-relaxed">
                  Normalized pre/post reassessment scoring with transparent progress tracking and retention evaluation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="p-2 rounded-xl bg-[#25DCC6]/15 border border-[#25DCC6]/30 text-[#25DCC6] flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Schema-Validated Question AI</h4>
                <p className="text-xs text-[#D7C9AE]/80 mt-1 leading-relaxed">
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
