import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Lock, Unlock, Loader2, AlertCircle,
  ChevronDown, ChevronRight, ArrowRight, Send,
  Sparkles, Code2, Compass, FlaskConical, PenLine,
  Clock, RotateCcw, Plus, Zap
} from 'lucide-react';
import { learnerApi } from '../utils/api';
import { useWallet } from '@txnlab/use-wallet-react';
import { createX402Fetch } from '../utils/x402';
import { API_ENDPOINTS } from '../config/api';
import ConnectWallet from '../components/ConnectWallet';

interface Lesson {
  _id: string;
  title: string;
  content?: string;
  isFree: boolean;
  duration?: number;
}

interface Chapter {
  _id: string;
  title: string;
  order: number;
  price: number;
  isUnlocked: boolean;
  totalLessons: number;
  lessons?: Lesson[];
}

interface Course {
  _id: string;
  title: string;
  createdAt: string;
  chapters: Chapter[];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const quickPrompts = [
  'Explain neural networks',
  'Create a study plan for DSA',
  'Summarize this concept',
  'Help me prepare for interviews',
];

const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeAddress, signTransactions } = useWallet();
  const navigate = useNavigate();

  const [courseTopic, setCourseTopic] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [unlockingChapter, setUnlockingChapter] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Intent router modal states
  const [showRouterModal, setShowRouterModal] = useState(false);
  const [routerTopic, setRouterTopic] = useState('');

  const toggleChapter = (chapterId: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    const s = new Set(expandedChapters);
    s.has(chapterId) ? s.delete(chapterId) : s.add(chapterId);
    setExpandedChapters(s);
  };

  const toggleLesson = (lessonId: string) => {
    const s = new Set(expandedLessons);
    s.has(lessonId) ? s.delete(lessonId) : s.add(lessonId);
    setExpandedLessons(s);
  };

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const res = await learnerApi.getCourses();
      if (res.success) {
        setCourses(res.data);
        if (selectedCourse) {
          const updated = res.data.find((c: Course) => c._id === selectedCourse._id);
          if (updated) setSelectedCourse(updated);
        }
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTopic.trim()) return;
    setRouterTopic(courseTopic);
    setShowRouterModal(true);
  };

  const handleQuickPromptClick = (promptText: string) => {
    setCourseTopic(promptText);
    setRouterTopic(promptText);
    setShowRouterModal(true);
  };

  const executeLearnNow = (style: string) => {
    setShowRouterModal(false);
    navigate(`/explain?q=${encodeURIComponent(routerTopic)}&style=${style}`);
  };

  const executeCreateCourse = async () => {
    setShowRouterModal(false);
    setIsCreating(true);
    try {
      const res = await learnerApi.createCourse(routerTopic);
      if (res.success) {
        setCourseTopic('');
        await fetchCourses();
      }
    } catch (err) {
      console.error('Failed to create course:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUnlockChapter = async (_courseId: string, chapterId: string) => {
    setUnlockError(null);
    if (!activeAddress || !signTransactions) {
      setUnlockError('Please connect your Algorand wallet first.');
      return;
    }
    setUnlockingChapter(chapterId);
    try {
      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
      const token = localStorage.getItem('accessToken');
      const res = await x402Fetch(API_ENDPOINTS.LEARNER_UNLOCK_CHAPTER_X402(chapterId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Unlock failed with status ${res.status}`);
      }
      await fetchCourses();
    } catch (err: any) {
      setUnlockError(err?.message || 'Payment failed. Please try again.');
    } finally {
      setUnlockingChapter(null);
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Learner';

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ paddingTop: '80px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-hero-illustration {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .animate-float-hero {
          animation: float-hero-illustration 7s ease-in-out infinite;
        }
      `}} />

      <div className="max-w-6xl mx-auto px-5 py-8">

        {/* ── GREETING & HERO BLOCK ── */}
        {!selectedCourse && (
          <>
            {/* Top levitating banner */}
            <div className="relative bg-white border border-slate-200/80 rounded-3xl p-8 mb-8 shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 space-y-4 max-w-xl">
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">{getGreeting()}</p>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                    {firstName} 👋
                  </h1>
                </div>
                <p className="text-slate-500 font-medium text-base">
                  What will you learn or create today?
                </p>

                {/* Search Bar */}
                <form onSubmit={handleAskSubmit} className="flex gap-2 items-center pt-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={courseTopic}
                      onChange={e => setCourseTopic(e.target.value)}
                      placeholder="Ask anything... (e.g. Explain WebSockets, Create a study plan, Debug my code)"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-slate-800 font-semibold placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                      disabled={isCreating}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreating || !courseTopic.trim()}
                    className="flex items-center gap-1.5 px-6 py-3.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-200"
                  >
                    {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Generate</span>
                  </button>
                </form>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickPrompts.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleQuickPromptClick(p)}
                      className="text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-500 font-bold px-3 py-1.5 rounded-full transition-colors border border-slate-200/60"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Levitation Image Container */}
              <div className="relative w-56 h-56 flex-shrink-0 flex items-center justify-center animate-float-hero">
                <div className="absolute inset-0 bg-indigo-50 rounded-full scale-95 opacity-80 blur-xl" />
                <img
                  src="/boy_illustration_transparent.png"
                  alt="Student Levitation Illustration"
                  className="relative z-10 w-full h-full object-contain select-none"
                />
              </div>
            </div>
            {/* Resume Intelligence Callout Banner for incomplete profile users */}
            {(!user?.resumeText || !user?.onboardingCompleted || !user?.currentSkills || user.currentSkills.length === 0) && (
              <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/60 border border-indigo-150 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-750 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">FEATURED</span>
                    <span className="text-xs text-indigo-650 font-bold flex items-center gap-1">
                      <Sparkles size={13} /> Highly Recommended
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Unlock Resume Intelligence 🚀</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-2xl">
                    Compare your profile against target roles and live market demands, identify experience gaps, get tailored project recommendations, and optimize your resume.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/resume-intelligence')}
                  className="bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black py-3 px-6 rounded-2xl shadow-md flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Launch Resume Intelligence</span>
                  <ArrowRight size={13} />
                </Button>
              </div>
            )}

            {/* ── 6-TILE ACTION GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              
              {/* Tile 1: Learn */}
              <div
                onClick={() => { setRouterTopic('WebSockets'); setShowRouterModal(true); }}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100/80">
                      <BookOpen size={20} />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <ArrowRight size={12} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Learn</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">AI explanations, deep dives & flashcards</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-1.5">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Explain</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Understand</span>
                </div>
              </div>

              {/* Tile 2: Build */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-violet-300 transition-all group relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100/80">
                      <Code2 size={20} />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                      <ArrowRight size={12} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Build</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Code editor, run & debug projects</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-1.5">
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Code</span>
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Debug</span>
                </div>
              </div>

              {/* Tile 3: Career */}
              <div 
                onClick={() => navigate('/resume-intelligence')}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/80">
                      <Compass size={20} />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                      <ArrowRight size={12} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Career</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Resume analysis & roadmap planner</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-1.5">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Plan</span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Prepare</span>
                </div>
              </div>

              {/* Tile 4: Research */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-rose-300 transition-all group relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100/80">
                      <FlaskConical size={20} />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                      <ArrowRight size={12} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Research</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Paper analysis & literature review</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-1.5">
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Analyze</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Discover</span>
                </div>
              </div>

              {/* Tile 5: Study (Renamed from Create) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/80">
                      <PenLine size={20} />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <ArrowRight size={12} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Study</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Notes, mind maps & summaries</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Notes</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Mindmaps</span>
                </div>
              </div>

              {/* Tile 6: Practice */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-sky-300 transition-all group relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center border border-sky-100/80">
                      <Sparkles size={20} />
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                      <ArrowRight size={12} />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Practice</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Mock tests & coding assessments</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-1.5">
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">Quiz</span>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">Test</span>
                </div>
              </div>

            </div>

            {/* ── MY COURSES ── */}
            {isLoading ? (
              <div className="flex items-center gap-3 text-slate-400 text-sm py-6">
                <Loader2 size={16} className="animate-spin" />
                Loading your courses...
              </div>
            ) : courses.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">My Courses</h2>
                  <button
                    onClick={() => { setRouterTopic(''); setShowRouterModal(true); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 rounded-xl px-3 py-1.5 bg-white hover:bg-slate-50"
                  >
                    <Plus size={13} /> New Course
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <div
                      key={course._id}
                      onClick={() => setSelectedCourse(course)}
                      className="bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer hover:border-slate-400 hover:shadow-sm transition-all group"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                        <BookOpen size={16} className="text-slate-500" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2 leading-snug">{course.title}</h3>
                      <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-400">{course.chapters.length} chapters</span>
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                          Open <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={20} className="text-slate-400" />
                </div>
                <p className="text-slate-700 font-semibold text-sm mb-1">No courses yet</p>
                <p className="text-slate-400 text-xs mb-5">Type something in Ask anything to get started.</p>
              </div>
            )}
          </>
        )}

        {/* ── COURSE DETAIL VIEW ── */}
        {selectedCourse && (
          <div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
              <RotateCcw size={13} /> Back to Dashboard
            </button>

            {/* Course header */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
              <div className="bg-slate-900 px-7 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen size={22} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedCourse.title}</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {new Date(selectedCourse.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {selectedCourse.chapters.length} chapters
                    </p>
                  </div>
                </div>
              </div>

              {/* Error banner */}
              {unlockError && (
                <div className="flex items-start gap-3 bg-red-50 border-b border-red-100 px-7 py-4">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-red-700">Payment failed</p>
                    <p className="text-red-600 mt-0.5">{unlockError}</p>
                  </div>
                  <button onClick={() => setUnlockError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">✕</button>
                </div>
              )}

              {/* Chapters */}
              <div className="p-6 space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Chapters</h3>
                {selectedCourse.chapters.map(chapter => (
                  <div key={chapter._id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
                    <div
                      className={`flex items-center justify-between px-5 py-4 ${chapter.isUnlocked ? 'cursor-pointer hover:bg-slate-100' : ''} transition-colors`}
                      onClick={() => toggleChapter(chapter._id, chapter.isUnlocked)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${chapter.isUnlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                          {chapter.isUnlocked ? <Unlock size={15} /> : <Lock size={15} />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                            {chapter.title}
                            {chapter.isUnlocked && (expandedChapters.has(chapter._id)
                              ? <ChevronDown size={14} className="text-slate-400" />
                              : <ChevronRight size={14} className="text-slate-400" />
                            )}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{chapter.totalLessons} lessons</p>
                        </div>
                      </div>

                      <div>
                        {chapter.isUnlocked ? (
                          <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Unlocked</span>
                        ) : (
                          <Button
                            size="sm"
                            disabled={unlockingChapter === chapter._id}
                            onClick={e => { e.stopPropagation(); handleUnlockChapter(selectedCourse._id, chapter._id); }}
                            className="rounded-xl text-xs"
                          >
                            {unlockingChapter === chapter._id
                              ? <span className="flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" /> Paying…</span>
                              : `Unlock · $${chapter.price.toFixed(2)}`
                            }
                          </Button>
                        )}
                      </div>
                    </div>

                    {expandedChapters.has(chapter._id) && chapter.lessons && (
                      <div className="border-t border-slate-200 bg-white">
                        {chapter.lessons.map(lesson => (
                          <div key={lesson._id} className="border-b border-slate-100 last:border-0">
                            <div
                              className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                              onClick={() => toggleLesson(lesson._id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                  {expandedLessons.has(lesson._id)
                                    ? <ChevronDown size={11} className="text-slate-500" />
                                    : <ChevronRight size={11} className="text-slate-500" />
                                  }
                                </div>
                                <span className="text-sm font-medium text-slate-700">{lesson.title}</span>
                                {lesson.isFree && !chapter.isUnlocked && (
                                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">Free</span>
                                )}
                              </div>
                            </div>
                            {expandedLessons.has(lesson._id) && (
                              <div className="px-8 pb-5 pt-2 bg-white">
                                <div className="prose prose-sm max-w-none text-slate-700">
                                  {lesson.content
                                    ? <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/><br/>') }} />
                                    : <p className="italic text-slate-400">Content not available.</p>
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── INTENT ROUTER MODAL ── */}
      {showRouterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRouterModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 z-10 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setShowRouterModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-lg leading-none">✕</button>
            
            <p className="text-xs font-extrabold text-indigo-650 uppercase tracking-widest mb-1">Concept Detected</p>
            <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">"{routerTopic}"</h2>
            <p className="text-sm text-slate-400 font-semibold mb-6">How would you like to explore this topic?</p>
            
            <div className="space-y-4">
              {/* Option 1: Learn Now */}
              <button
                type="button"
                onClick={() => executeLearnNow('academic')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100/50">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Learn it now</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Get a focused structured explanation immediately</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Option 2: Guided Course */}
              <button
                type="button"
                onClick={executeCreateCourse}
                disabled={isCreating}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100/50">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Take a guided course</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Generate a full course with micro-paid chapters</p>
                  </div>
                </div>
                {isCreating ? (
                  <Loader2 size={14} className="animate-spin text-slate-400" />
                ) : (
                  <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>

              {/* Option 3: Interview crash prep */}
              <button
                type="button"
                onClick={() => executeLearnNow('interview')}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/50">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Prepare for interviews</h4>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Quick crash answers + simulated follow-ups</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConnectWallet openModal={walletModalOpen} closeModal={() => setWalletModalOpen(false)} />
    </div>
  );
};

export default LearnerDashboard;
