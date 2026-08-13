import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
  BookOpen, Lock, Unlock, Loader2, AlertCircle,
  ChevronDown, ChevronRight, ArrowRight, Send,
  Sparkles, Code2, Compass, FlaskConical, PenLine,
  Clock, RotateCcw, Plus
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

const quickActions = [
  {
    id: 'learn',
    label: 'Learn',
    sub: 'AI explanations, deep dives & flashcards',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    dot: 'bg-blue-500',
  },
  {
    id: 'build',
    label: 'Build',
    sub: 'Code editor, run & debug projects',
    icon: Code2,
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    dot: 'bg-violet-500',
  },
  {
    id: 'career',
    label: 'Career',
    sub: 'Resume analysis & roadmap planner',
    icon: Compass,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    dot: 'bg-amber-500',
  },
  {
    id: 'research',
    label: 'Research',
    sub: 'Paper analysis & literature review',
    icon: FlaskConical,
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    dot: 'bg-rose-500',
  },
  {
    id: 'create',
    label: 'Create',
    sub: 'Notes, mind maps & summaries',
    icon: PenLine,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    dot: 'bg-emerald-500',
  },
  {
    id: 'practice',
    label: 'Practice',
    sub: 'Mock tests & coding assessments',
    icon: Sparkles,
    color: 'bg-sky-50 text-sky-600 border-sky-100',
    dot: 'bg-sky-500',
  },
];

const quickPrompts = [
  'Explain neural networks simply',
  'Create a study plan for DSA',
  'Summarize this concept',
  'Help me prepare for interviews',
];

const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeAddress, signTransactions } = useWallet();

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
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);

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

  useEffect(() => { fetchCourses(); }, []);

  const handleCreateCourse = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!courseTopic.trim()) return;
    setIsCreating(true);
    try {
      const res = await learnerApi.createCourse(courseTopic);
      if (res.success) {
        await fetchCourses();
        setCourseTopic('');
        setShowNewCourseModal(false);
      }
    } catch (err) {
      console.error('Failed to create course:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePromptClick = (p: string) => {
    setCourseTopic(p);
    setShowNewCourseModal(true);
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
    <div className="min-h-screen bg-[#f7f7f8]" style={{ paddingTop: '64px' }}>
      <div className="max-w-6xl mx-auto px-5 py-10">

        {/* ── GREETING ── */}
        {!selectedCourse && (
          <>
            <div className="mb-8">
              <p className="text-sm font-medium text-slate-400 mb-1 tracking-wide uppercase">{getGreeting()}</p>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                {firstName} <span className="wave-emoji">👋</span>
              </h1>
              <p className="text-slate-500 mt-2 text-base">What do you want to work on today?</p>
            </div>

            {/* ── ASK ANYTHING BAR ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Ask anything</p>
                <form onSubmit={handleCreateCourse} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={courseTopic}
                    onChange={e => setCourseTopic(e.target.value)}
                    placeholder="Type a topic, concept, or question..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors"
                    disabled={isCreating}
                  />
                  <button
                    type="submit"
                    disabled={isCreating || !courseTopic.trim()}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    {isCreating ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {isCreating ? 'Creating...' : 'Generate'}
                  </button>
                </form>
              </div>
              <div className="px-6 pb-5 flex flex-wrap gap-2">
                {quickPrompts.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePromptClick(p)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-3 py-1.5 rounded-full transition-colors border border-slate-200"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* ── QUICK ACTION TILES ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {quickActions.map(a => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.id}
                    className={`bg-white border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all group ${a.color}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color} border`}>
                        <Icon size={18} />
                      </div>
                      <ArrowRight size={14} className="opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all mt-1" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm mb-0.5">{a.label}</p>
                    <p className="text-xs text-slate-400 leading-snug">{a.sub}</p>
                  </div>
                );
              })}
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
                  <h2 className="text-base font-semibold text-slate-800">My Courses</h2>
                  <button
                    onClick={() => setShowNewCourseModal(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 rounded-xl px-3 py-1.5 bg-white hover:bg-slate-50"
                  >
                    <Plus size={13} /> New
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={20} className="text-slate-400" />
                </div>
                <p className="text-slate-700 font-semibold text-sm mb-1">No courses yet</p>
                <p className="text-slate-400 text-xs mb-5">Type something above to generate your first course.</p>
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

      {/* ── NEW COURSE MODAL ── */}
      {showNewCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewCourseModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-7 z-10">
            <button onClick={() => setShowNewCourseModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none">✕</button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">New course</h2>
            <p className="text-sm text-slate-400 mb-5">Describe a topic and we'll generate a full structured course.</p>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <input
                type="text"
                value={courseTopic}
                onChange={e => setCourseTopic(e.target.value)}
                placeholder="e.g. Machine Learning, React, System Design…"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 outline-none focus:border-slate-400 transition-colors"
                disabled={isCreating}
                autoFocus
              />
              <p className="text-xs text-slate-400">AI will generate chapters and lessons automatically.</p>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowNewCourseModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={isCreating || !courseTopic.trim()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  {isCreating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConnectWallet openModal={walletModalOpen} closeModal={() => setWalletModalOpen(false)} />
    </div>
  );
};

export default LearnerDashboard;
