import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { BookOpen, Lock, Unlock, Plus, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { learnerApi } from '../utils/api';
import { useWallet } from '@txnlab/use-wallet-react';
import { createX402Fetch } from '../utils/x402';
import { API_ENDPOINTS } from '../config/api';
import ConnectWallet from '../components/ConnectWallet';

import { ChevronDown, ChevronRight } from 'lucide-react';

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

const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeAddress, signTransactions } = useWallet();
  const [courseTopic, setCourseTopic] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [unlockingChapter, setUnlockingChapter] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const toggleChapter = (chapterId: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await learnerApi.getCourses();
      if (response.success) {
        setCourses(response.data);
        if (response.data.length > 0) {
          setShowForm(false);
        } else {
          setShowForm(true);
        }
        if (selectedCourse) {
          const updatedCourse = response.data.find((c: Course) => c._id === selectedCourse._id);
          if (updatedCourse) setSelectedCourse(updatedCourse);
        }
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTopic.trim()) return;

    setIsCreating(true);

    try {
      const response = await learnerApi.createCourse(courseTopic);
      if (response.success) {
        await fetchCourses();
        setCourseTopic('');
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handle chapter unlock using the X402 payment protocol.
   * Creates an X402-aware fetch using the connected wallet, calls the server,
   * and on success (200), refreshes courses to reveal the unlocked content.
   */
  const handleUnlockChapter = async (_courseId: string, chapterId: string) => {
    setUnlockError(null);

    // Require a connected wallet
    if (!activeAddress || !signTransactions) {
      setUnlockError('Please connect your Algorand wallet first to make payments.');
      return;
    }

    setUnlockingChapter(chapterId);

    try {
      // Build an X402-enabled fetch using the connected wallet signer
      const x402Fetch = await createX402Fetch({
        address: activeAddress,
        signTransactions,
      });

      // Get the JWT access token for authentication
      const accessToken = localStorage.getItem('accessToken');

      // Call the X402-protected unlock endpoint.
      // The X402 client will:
      //   1. Make the initial GET request → receives 402
      //   2. Automatically prompt wallet to sign the payment transaction
      //   3. Retry the GET with X-PAYMENT header → receives 200
      const response = await x402Fetch(API_ENDPOINTS.LEARNER_UNLOCK_CHAPTER_X402(chapterId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || `Unlock failed with status ${response.status}`);
      }

      // Refresh courses to reflect the newly unlocked chapter
      await fetchCourses();
    } catch (error: any) {
      console.error('X402 payment failed:', error);
      setUnlockError(error?.message || 'Payment failed. Please try again.');
    } finally {
      setUnlockingChapter(null);
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back, {user?.fullName}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Create and manage your custom courses
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="mt-4 md:mt-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Course
          </Button>
        </div>

        {/* Course Creation Form (Inline for new users with no courses) */}
        {showForm && courses.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              What do you want to learn?
            </h2>
            <form onSubmit={handleCreateCourse} className="max-w-2xl">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Course Topic
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-normal block mt-1">
                    Describe any specific field of study you'd like to dynamically create.
                  </span>
                </label>
                <input
                  type="text"
                  value={courseTopic}
                  onChange={(e) => setCourseTopic(e.target.value)}
                  placeholder="e.g., Web Development with React, Machine Learning, Digital Marketing..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating}
                />
              </div>
              <Button
                type="submit"
                disabled={isCreating || !courseTopic.trim()}
                className="w-full md:w-auto"
              >
                {isCreating ? 'Creating Course...' : 'Create Course'}
              </Button>
            </form>
          </div>
        )}

        {/* Course Creation Form (Modal Dialog for existing users) */}
        {showForm && courses.length > 0 && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setShowForm(false)}
            />
            
            {/* Modal Box */}
            <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                What do you want to learn?
              </h2>
              <form onSubmit={handleCreateCourse} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Course Topic
                  </label>
                  <input
                    type="text"
                    value={courseTopic}
                    onChange={(e) => setCourseTopic(e.target.value)}
                    placeholder="e.g., Web Development with React, Machine Learning, Digital Marketing..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-750 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                    We will dynamically generate structured chapters and lessons using AI.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || !courseTopic.trim()}
                  >
                    {isCreating ? 'Creating Course...' : 'Create Course'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Error Banner */}
        {unlockError && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Payment Failed</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{unlockError}</p>
            </div>
            <button
              onClick={() => setUnlockError(null)}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {courses.length > 0 && !selectedCourse && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              My Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Created on {new Date(course.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {course.chapters.length} chapters
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      View Details <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Course Detail */}
        {selectedCourse && (
          <div className="space-y-6">
            <Button variant="outline" onClick={() => setSelectedCourse(null)} className="mb-2">
              &larr; Back to Courses
            </Button>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedCourse.title}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Created on {new Date(selectedCourse.createdAt).toLocaleDateString()} • {selectedCourse.chapters.length} chapters
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Course Chapters
                </h4>
                <div className="space-y-4">
                  {selectedCourse.chapters.map((chapter) => (
                    <div
                      key={chapter._id}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 transition-colors bg-white dark:bg-slate-800 shadow-sm"
                    >
                      <div 
                        className={`flex items-center justify-between p-5 ${chapter.isUnlocked ? 'cursor-pointer' : ''}`}
                        onClick={() => toggleChapter(chapter._id, chapter.isUnlocked)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${chapter.isUnlocked ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            {chapter.isUnlocked ? (
                              <Unlock className="w-6 h-6" />
                            ) : (
                              <Lock className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                              {chapter.title}
                              {chapter.isUnlocked && (
                                expandedChapters.has(chapter._id) ? 
                                  <ChevronDown className="w-5 h-5 text-slate-400" /> : 
                                  <ChevronRight className="w-5 h-5 text-slate-400" />
                              )}
                            </h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {chapter.totalLessons} lessons
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          {chapter.isUnlocked ? (
                            <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-semibold text-sm">
                              Unlocked
                            </span>
                          ) : (
                            <Button
                              size="lg"
                              disabled={unlockingChapter === chapter._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlockChapter(selectedCourse._id, chapter._id);
                              }}
                            >
                              {unlockingChapter === chapter._id ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Paying...
                                </span>
                              ) : (
                                `Unlock for $${chapter.price.toFixed(2)}`
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {expandedChapters.has(chapter._id) && chapter.lessons && (
                        <div className="border-t border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
                          <div className="space-y-3">
                            {chapter.lessons.map(lesson => (
                              <div key={lesson._id} className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                                <div 
                                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                  onClick={() => toggleLesson(lesson._id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full">
                                      {expandedLessons.has(lesson._id) ? 
                                        <ChevronDown className="w-4 h-4 text-slate-500" /> : 
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                      }
                                    </div>
                                    <span className="font-semibold text-slate-900 dark:text-white">{lesson.title}</span>
                                    {lesson.isFree && !chapter.isUnlocked && (
                                      <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-wider">Free</span>
                                    )}
                                  </div>
                                </div>
                                {expandedLessons.has(lesson._id) && (
                                  <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <div className="prose dark:prose-invert max-w-none">
                                      {lesson.content ? (
                                        <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/><br/>') }} />
                                      ) : (
                                        <p className="text-slate-500 italic">Content not available.</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {courses.length === 0 && !showForm && !isLoading && !selectedCourse && (
          <div className="text-center py-16">
            <BookOpen className="w-24 h-24 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No courses yet
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Start by creating your first custom course!
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Course
            </Button>
          </div>
        )}
      </div>

      {/* Wallet Connect Modal */}
      <ConnectWallet
        openModal={walletModalOpen}
        closeModal={() => setWalletModalOpen(false)}
      />
    </div>
  );
};

export default LearnerDashboard;
