'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  apiClient,
  TutorChatMessage,
  TutorChatRequest,
  TutorChatResponse,
  AIHealthStatus
} from '@/lib/api';
import { useApp } from '@/lib/context';
import {
  Sparkles,
  Send,
  RotateCcw,
  BookOpen,
  Code,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Bot,
  User,
  CornerDownLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const SUBJECT_OPTIONS = [
  { id: 'General Academic', label: 'All Subjects / Custom', icon: '🌐', defaultTopic: 'General Inquiry' },
  { id: 'Mathematics', label: 'Mathematics', icon: '📐', defaultTopic: 'Algebra & Linear Equations' },
  { id: 'Physics', label: 'Physics', icon: '⚡', defaultTopic: "Newton's Laws & Mechanics" },
  { id: 'Chemistry', label: 'Chemistry', icon: '🧪', defaultTopic: 'Stoichiometry & Chemical Bonds' },
  { id: 'Biology', label: 'Biology', icon: '🧬', defaultTopic: 'Cellular Respiration & Genetics' },
  { id: 'Computer Science', label: 'Computer Science', icon: '💻', defaultTopic: 'Algorithms & Data Structures' }
];

const EXAMPLE_PROMPTS = [
  { label: 'C++ Pointers', prompt: 'Explain pointers in C++ with examples.' },
  { label: "Newton's Laws", prompt: "Teach me Newton's laws step by step." },
  { label: 'Recursion', prompt: "Explain recursion like I'm a beginner." },
  { label: 'Struggling Topic', prompt: "Help me understand this topic I'm struggling with." }
];

const QUICK_ACTIONS = [
  { id: 'simplify', label: '💡 Simplify', tooltip: 'Explain with basic intuitive concepts' },
  { id: 'worked_example', label: '🔍 Worked Example', tooltip: 'Show a step-by-step solved calculation' },
  { id: 'analogy', label: '🌐 Analogy', tooltip: 'Explain using a real-world physical metaphor' },
  { id: 'practice_question', label: '📝 Practice Check', tooltip: 'Test your understanding with a problem' },
  { id: 'summary', label: '📌 Key Takeaways', tooltip: 'Bulleted summary of core rules' }
];

interface ProviderErrorState {
  code: 'out_of_credits' | 'invalid_key' | 'rate_limited' | 'error';
  heading: string;
  message: string;
}

export function AITutorView() {
  const { activeStudentId, t } = useApp();
  const [subject, setSubject] = useState<string>('General Academic');
  const [topic, setTopic] = useState<string>('General Inquiry');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [messages, setMessages] = useState<TutorChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [healthStatus, setHealthStatus] = useState<AIHealthStatus | null>(null);
  const [providerError, setProviderError] = useState<ProviderErrorState | null>(null);
  const [lastPendingRequest, setLastPendingRequest] = useState<TutorChatRequest | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI provider health on mount
  useEffect(() => {
    let mounted = true;
    apiClient.getAIHealth().then((h) => {
      if (mounted) {
        setHealthStatus(h);
        if (h.status === 'out_of_credits' || h.status === 'invalid_key' || h.status === 'missing_key') {
          setProviderError({
            code: h.status === 'invalid_key' ? 'invalid_key' : 'out_of_credits',
            heading: `${h.provider || 'AI'} API: ${h.status.replace(/_/g, ' ')}`,
            message: h.message || 'Please check your API configuration.'
          });
        }
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Initialize with initial friendly guidance
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Welcome to **ThinkFlow AI**! I am your personal AI learning coach powered by xAI Grok.\n\nAsk me any question in plain language — from computer science and physics to calculus and chemistry. I provide step-by-step reasoning, intuitive analogies, and worked solutions.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setFollowups([
        'Explain recursion like I am a beginner.',
        'Teach me Newton’s laws step by step.',
        'How do I factor quadratic equations?'
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textOverride?: string, actionModifier?: string) => {
    const query = (textOverride || inputText).trim();
    if (!query && !actionModifier) return;

    // Detect subject from query if generic
    let activeSubject = subject;
    let activeTopic = topic;
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('pointer') || lowerQuery.includes('recursion') || lowerQuery.includes('python') || lowerQuery.includes('c++') || lowerQuery.includes('code')) {
      activeSubject = 'Computer Science';
      activeTopic = query.slice(0, 30);
    } else if (lowerQuery.includes('newton') || lowerQuery.includes('force') || lowerQuery.includes('gravity') || lowerQuery.includes('velocity')) {
      activeSubject = 'Physics';
      activeTopic = 'Mechanics & Motion';
    } else if (lowerQuery.includes('factor') || lowerQuery.includes('fraction') || lowerQuery.includes('equation') || lowerQuery.includes('algebra')) {
      activeSubject = 'Mathematics';
      activeTopic = 'Algebra & Equations';
    }

    const userMsg: TutorChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: actionModifier
        ? `[Quick Action: ${actionModifier.toUpperCase()}] ${query || `Please provide a ${actionModifier.replace('_', ' ')}.`}`
        : query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    // Keep user's question intact in conversation history
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);
    setProviderError(null);

    const requestPayload: TutorChatRequest = {
      student_id: activeStudentId,
      subject: activeSubject,
      topic: activeTopic,
      level,
      messages: newHistory,
      action: actionModifier
    };
    setLastPendingRequest(requestPayload);

    try {
      const res = await apiClient.chatTutor(requestPayload);

      const assistantMsg: TutorChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...newHistory, assistantMsg]);
      setFollowups(res.suggested_followups || []);
      setProviderError(null);
      setLastPendingRequest(null);
    } catch (err: any) {
      const isOutOfCredits =
        err?.status === 403 ||
        err?.code === 'out_of_credits' ||
        (err?.message && (err.message.includes('credits') || err.message.includes('403') || err.message.includes('permission-denied')));

      if (isOutOfCredits) {
        setProviderError({
          code: 'out_of_credits',
          heading: 'Grok API access unavailable',
          message: 'Your xAI team needs active API credits or the required API access to generate responses.'
        });
      } else if (err?.status === 401 || err?.code === 'invalid_key') {
        setProviderError({
          code: 'invalid_key',
          heading: 'Invalid xAI API Key',
          message: 'Please check your API key credentials in the xAI Console.'
        });
      } else if (err?.status === 429 || err?.code === 'rate_limited') {
        setProviderError({
          code: 'rate_limited',
          heading: 'Rate Limit Reached',
          message: 'xAI Grok rate limit reached. Please wait a moment and try again.'
        });
      } else {
        setProviderError({
          code: 'error',
          heading: 'Grok API access unavailable',
          message: 'Your xAI team needs active API credits or the required API access to generate responses.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!lastPendingRequest || isLoading) return;
    setIsLoading(true);

    try {
      const res = await apiClient.chatTutor(lastPendingRequest);

      const assistantMsg: TutorChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...lastPendingRequest.messages, assistantMsg]);
      setFollowups(res.suggested_followups || []);
      setProviderError(null);
      setLastPendingRequest(null);
    } catch (err: any) {
      const isOutOfCredits =
        err?.status === 403 ||
        err?.code === 'out_of_credits' ||
        (err?.message && (err.message.includes('credits') || err.message.includes('403') || err.message.includes('permission-denied')));

      if (isOutOfCredits) {
        setProviderError({
          code: 'out_of_credits',
          heading: 'Grok API access unavailable',
          message: 'Your xAI team needs active API credits or the required API access to generate responses.'
        });
      } else {
        setProviderError({
          code: 'error',
          heading: 'Grok API access unavailable',
          message: 'Your xAI team needs active API credits or the required API access to generate responses.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter submits; Enter alone creates newline
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading && inputText.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleSelectExample = (promptText: string) => {
    setInputText(promptText);
    textareaRef.current?.focus();
  };

  const handleClearSession = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Fresh session started! What would you like to explore next?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setFollowups([
      'Explain recursion like I am a beginner.',
      'Teach me Newton’s laws step by step.',
      'How do I solve two-step linear equations?'
    ]);
    setInputText('');
    setProviderError(null);
    setLastPendingRequest(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO QUESTION INPUT CARD: "What would you like to learn?"  */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-6">
          {/* Header Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <span className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-sm shadow-sm">
                  <Bot className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  ThinkFlow AI Learning Assistant
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {healthStatus?.model || 'grok-2-latest'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {t('What would you like to learn?', 'आप क्या सीखना चाहते हैं?')}
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Ask any question about a concept, formula, problem step, or academic subject. ThinkFlow AI guides your thinking without handing you raw shortcuts.
              </p>
            </div>

            {/* Subject Domain & Instruction Level Controls */}
            <div className="flex flex-wrap items-center gap-2.5 bg-slate-950 p-2 rounded-2xl border border-slate-800 self-start md:self-auto">
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  const opt = SUBJECT_OPTIONS.find((o) => o.id === e.target.value);
                  if (opt) setTopic(opt.defaultTopic);
                }}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-700/80 text-xs">
                {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition font-medium ${
                      level === lvl
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Example Prompts Bar */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Suggested Example Prompts:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectExample(item.prompt)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950/80 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/40 text-xs text-slate-300 hover:text-teal-300 transition-all text-left flex items-center space-x-1.5 group shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-teal-400/60 group-hover:text-teal-400 flex-shrink-0" />
                  <span>{item.prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Large Multiline Textarea Input Area */}
          <div className="space-y-3">
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question about a topic, concept, problem, or subject..."
                rows={4}
                disabled={isLoading}
                className="w-full bg-transparent p-4 sm:p-5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
              />

              {/* Action Toolbar Inside Input Container */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3.5 border-t border-slate-900 bg-slate-950/60 rounded-b-2xl">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Press <strong className="text-slate-300">Ctrl + Enter</strong> to submit • <strong className="text-slate-300">Enter</strong> for newline
                  </span>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  {inputText.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInputText('')}
                      className="text-xs text-slate-400 hover:text-slate-200 transition"
                    >
                      Clear
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputText.trim()}
                    className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all flex items-center space-x-2 shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Thinking...</span>
                      </>
                    ) : (
                      <>
                        <span>Ask ThinkFlow</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Modifier Action Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Actions:
            </span>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={isLoading}
                title={action.tooltip}
                onClick={() => handleSendMessage(undefined, action.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition whitespace-nowrap disabled:opacity-40 shadow-sm"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. COMPACT, WELL-SPACED XAI PROVIDER WARNING CARD             */}
      {/* ------------------------------------------------------------- */}
      {providerError && (
        <aside
          role="alert"
          aria-live="polite"
          className="rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-3.5 sm:px-5 sm:py-4 shadow-lg backdrop-blur-sm transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Icon + Title + Explanation */}
            <div className="flex items-start sm:items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-sm font-semibold text-amber-200 tracking-tight">
                  {providerError.heading}
                </h4>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  {providerError.message}
                </p>
              </div>
            </div>

            {/* Action Buttons: Open xAI Console + Retry */}
            <div className="flex items-center gap-2 sm:self-center pl-11 sm:pl-0 flex-shrink-0">
              <a
                href="https://console.x.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-semibold transition hover:border-amber-400/50 shadow-sm"
              >
                <span>Open xAI Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isLoading}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-sm disabled:opacity-50 active:scale-95"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CONVERSATION THREAD (Generous Spacing & Visual Hierarchy)  */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Learning Conversation</span>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {messages.length} message{messages.length === 1 ? '' : 's'}
              </span>
            </h3>
          </div>

          <button
            type="button"
            onClick={handleClearSession}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center space-x-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Conversation</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="space-y-6 min-h-[240px]">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id || idx}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                {/* Bubble Container */}
                <div
                  className={`rounded-2xl p-5 sm:p-6 text-sm sm:text-base leading-relaxed max-w-[85%] space-y-2 shadow-lg ${
                    isUser
                      ? 'bg-teal-500 text-slate-950 font-medium rounded-br-none shadow-teal-500/10'
                      : 'bg-slate-950 border border-slate-800 text-slate-100 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold opacity-70 mb-1">
                    <span>{isUser ? 'You' : 'ThinkFlow AI'}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans space-y-3 leading-relaxed">
                    {m.content}
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking State Indicator */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 justify-start">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-none p-5 text-sm text-slate-300 flex items-center space-x-3 shadow-lg">
                <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
                <span className="font-medium">ThinkFlow AI is reasoning through your question...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Next Questions Follow-Up Bar */}
        {followups.length > 0 && !isLoading && (
          <div className="pt-6 border-t border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Explore Further (Click to Ask):</span>
            </span>
            <div className="flex flex-wrap gap-2.5">
              {followups.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(f)}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/40 text-xs sm:text-sm text-slate-300 hover:text-teal-300 transition-all text-left shadow-sm flex items-center space-x-1.5 group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-teal-400/60 group-hover:text-teal-400 flex-shrink-0" />
                  <span>{f}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
