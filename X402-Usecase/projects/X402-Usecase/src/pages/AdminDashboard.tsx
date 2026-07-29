import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, analyticsApi } from '../utils/api';
import { useSnackbar } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, BookOpen, CreditCard, TrendingUp, Cpu, Award, Zap, Activity, Clock,
  CheckCircle, HelpCircle, FileText, Plus, Search, ArrowUpRight, ShieldAlert,
  UserCheck, Layers, Sparkles, Filter, ChevronRight, X, List, DollarSign
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Color palette for charts
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Core Data State
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    aiRequestsToday: 0,
    x402Transactions: 0,
  });

  const [analytics, setAnalytics] = useState<any>({
    trends: {
      revenue7D: [],
      revenue30D: [],
      revenue12M: [],
      revenueByCourse: [],
      revenueByLesson: [],
    },
    users: {
      totalUsers: 0,
      newUsersLast7D: 0,
      returningUsers: 0,
      dailyActiveUsers: [],
    },
    courses: {
      popularCourses: [],
      popularLessons: [],
    },
    ai: {
      totalAiChats: 0,
      aiRequestsToday: 0,
      avgResponseTime: 1.5,
      mostAskedTopics: [],
    },
    recentActivity: {
      latestRegistrations: [],
      latestPurchases: [],
      latestCourseCompletions: [],
      latestAIConversations: [],
    },
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI Tabs & Filters
  const [activeRevenueTab, setActiveRevenueTab] = useState<'7D' | '30D' | '12M'>('7D');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [activeSection, setActiveSection] = useState<'transactions' | 'users' | 'income'>('transactions');

  // Quick Action Modal States
  const [activeModal, setActiveModal] = useState<
    'addCourse' | 'addLesson' | 'createQuiz' | 'uploadResources' | 'viewUsers' | 'viewTransactions' | null
  >(null);

  // Quick Action Forms
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    level: 'beginner',
    price: 10,
    categoryName: 'Blockchain',
  });

  const [lessonForm, setLessonForm] = useState({
    courseId: '',
    title: '',
    content: '',
    duration: 15,
  });

  const [quizForm, setQuizForm] = useState({
    lessonId: '',
    title: '',
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
      },
    ],
  });

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Fetch Dashboard Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminApi.getStats();
      if (statsRes.success) setStats(statsRes.data);

      const analyticsRes = await analyticsApi.getOverview();
      if (analyticsRes.success) setAnalytics(analyticsRes.data);

      const transRes = await adminApi.getTransactions();
      if (transRes.success) setTransactions(transRes.data);

      const usersRes = await adminApi.getUsers();
      if (usersRes.success) setUserList(usersRes.data);
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar('Failed to fetch admin metrics', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('refresh-admin-logs', handleRefresh);
    return () => {
      window.removeEventListener('refresh-admin-logs', handleRefresh);
    };
  }, []);

  // Handlers
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.addCourse(courseForm);
      if (res.success) {
        enqueueSnackbar('Course added successfully!', { variant: 'success' });
        setActiveModal(null);
        setCourseForm({ title: '', description: '', level: 'beginner', price: 10, categoryName: 'Blockchain' });
        fetchData();
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to add course', { variant: 'error' });
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.addLesson(lessonForm);
      if (res.success) {
        enqueueSnackbar('Lesson added successfully!', { variant: 'success' });
        setActiveModal(null);
        setLessonForm({ courseId: '', title: '', content: '', duration: 15 });
        fetchData();
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to add lesson', { variant: 'error' });
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.createQuiz(quizForm);
      if (res.success) {
        enqueueSnackbar('Quiz created successfully!', { variant: 'success' });
        setActiveModal(null);
        setQuizForm({
          lessonId: '',
          title: '',
          questions: [{ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 }],
        });
        fetchData();
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to create quiz', { variant: 'error' });
    }
  };

  const handleUploadResources = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      enqueueSnackbar('Please select a file to upload', { variant: 'warning' });
      return;
    }
    enqueueSnackbar(`Successfully uploaded ${fileToUpload.name}!`, { variant: 'success' });
    setActiveModal(null);
    setFileToUpload(null);
  };

  const learnersOnly = userList.filter((u) => u.role !== 'admin');
  const completedTransactions = transactions.filter((t) => t.paymentStatus === 'completed' || t.purchaseStatus === 'completed');
  const calculatedIncome = completedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  const filteredTransactions = transactions.filter((t) => {
    const term = transactionSearch.toLowerCase();
    const userMatch = t.userId?.fullName?.toLowerCase().includes(term) || t.userId?.email?.toLowerCase().includes(term);
    const courseMatch = t.courseId?.title?.toLowerCase().includes(term);
    const hashMatch = t.transactionHash?.toLowerCase().includes(term);
    return userMatch || courseMatch || hashMatch;
  });

  return (
    <div className="pt-24 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Learners', val: learnersOnly.length, icon: Users, color: 'text-indigo-500 bg-indigo-500/10' },
            { label: 'Total Income', val: `$${calculatedIncome}`, icon: DollarSign, color: 'text-green-500 bg-green-500/10' },
            { label: 'Total Courses', val: stats.totalCourses, icon: BookOpen, color: 'text-amber-500 bg-amber-500/10' },
            { label: 'Completed Purchases', val: completedTransactions.length, icon: CreditCard, color: 'text-rose-500 bg-rose-500/10' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <span className={`p-2 rounded-xl ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {item.val}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 gap-2 overflow-x-auto pb-1">
          {[
            { id: 'transactions', label: 'Transactions', icon: List },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'income', label: 'Income', icon: DollarSign },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-2.5 px-4 py-3 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
                activeSection === sec.id
                  ? 'border-indigo-500 text-indigo-650 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <sec.icon className="w-4 h-4" />
              {sec.label}
            </button>
          ))}
        </div>

        {/* Main Content Panels */}
        <div className="grid grid-cols-1 gap-8">

          {/* TRANSACTIONS PANEL */}
          {activeSection === 'transactions' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Purchases & Ledger Transactions</h2>
                  <p className="text-xs text-slate-500 mt-1">Real-time details of who paid for which course and how much they paid</p>
                </div>
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    placeholder="Search by user, course, hash..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-4">Learner</th>
                      <th className="py-3 px-4">Paid Course</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{tx.userId?.fullName || 'External User'}</div>
                          <div className="text-[10px] text-slate-450">{tx.userId?.email || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium">{tx.courseId?.title || 'Unlock Chapter'}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-550 dark:text-indigo-400">
                          ${tx.amount} <span className="text-[10px] font-medium text-slate-400">{tx.currency}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.paymentStatus === 'completed' || tx.purchaseStatus === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : tx.paymentStatus === 'pending' || tx.purchaseStatus === 'pending'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {tx.paymentStatus || tx.purchaseStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">No matching transactions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS PANEL */}
          {activeSection === 'users' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Registered Learners</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-4">Learner Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {learnersOnly.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{u.fullName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-550 dark:text-slate-300 font-medium">{u.email}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                    {learnersOnly.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">No learners found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INCOME PANEL */}
          {activeSection === 'income' && (
            <div className="space-y-8">
              {/* Total Income Summary Card */}
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-650 dark:from-indigo-600 dark:to-indigo-800 text-white rounded-3xl p-8 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider opacity-80">Total Accumulated Income</h3>
                  <p className="text-4xl font-extrabold mt-2">${calculatedIncome} USDC</p>
                  <p className="text-xs mt-1.5 opacity-70">Sum of all successfully completed transactioned amounts</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Income purchases list */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 p-6 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Successful Purchases</h2>
                  <p className="text-xs text-slate-500 mt-1">Detailed list of all earnings from completed purchases</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                      <tr>
                        <th className="py-3 px-4">Learner</th>
                        <th className="py-3 px-4">Purchased Course</th>
                        <th className="py-3 px-4">Income Earned</th>
                        <th className="py-3 px-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {completedTransactions.map((tx) => (
                        <tr key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{tx.userId?.fullName || 'External User'}</div>
                            <div className="text-[10px] text-slate-450">{tx.userId?.email || 'N/A'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-medium">{tx.courseId?.title || 'Unlock Chapter'}</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                            +${tx.amount} <span className="text-[10px] font-medium text-slate-400">{tx.currency}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {completedTransactions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">No successful purchases yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* QUICK ACTION MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeModal === 'addCourse' && 'Add New Course Catalog'}
                  {activeModal === 'addLesson' && 'Add Chapter/Lesson'}
                  {activeModal === 'createQuiz' && 'Design Interactive Quiz'}
                  {activeModal === 'uploadResources' && 'Upload Resource Assets'}
                  {activeModal === 'viewUsers' && 'All Registered Users'}
                  {activeModal === 'viewTransactions' && 'Financial Ledger'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-1">
                {/* 1. Add Course */}
                {activeModal === 'addCourse' && (
                  <form onSubmit={handleAddCourse} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-550 mb-1.5">Course Title</label>
                      <input
                        type="text"
                        required
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-550 mb-1.5">Description</label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-550 mb-1.5">Level</label>
                        <select
                          value={courseForm.level}
                          onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-550 mb-1.5">Price (USDC)</label>
                        <input
                          type="number"
                          required
                          value={courseForm.price}
                          onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full py-2.5 mt-4 rounded-xl">Save & Deploy Course</Button>
                  </form>
                )}

                {/* 2. Add Lesson */}
                {activeModal === 'addLesson' && (
                  <form onSubmit={handleAddLesson} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-550 mb-1.5">Select Course</label>
                      <select
                        required
                        value={lessonForm.courseId}
                        onChange={(e) => setLessonForm({ ...lessonForm, courseId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- Select Course --</option>
                        {analytics.courses?.popularCourses?.map((c: any, i: number) => (
                          <option key={i} value={courseForm.title === c.title ? 'custom-id' : 'mock-course-id'}>{c.title}</option>
                        ))}
                        {/* Fallback to make sure there's at least a valid option */}
                        <option value="fallback-course-id">Introduction to Algorand Smart Contracts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-550 mb-1.5">Lesson Title</label>
                      <input
                        type="text"
                        required
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-550 mb-1.5">Content Markdown</label>
                      <textarea
                        required
                        value={lessonForm.content}
                        onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                      />
                    </div>
                    <Button type="submit" className="w-full py-2.5 mt-4 rounded-xl">Append Lesson</Button>
                  </form>
                )}

                {/* 3. Create Quiz */}
                {activeModal === 'createQuiz' && (
                  <form onSubmit={handleCreateQuiz} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-550 mb-1.5">Lesson Context</label>
                      <select
                        required
                        value={quizForm.lessonId}
                        onChange={(e) => setQuizForm({ ...quizForm, lessonId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- Select Lesson --</option>
                        <option value="fallback-lesson-id">What is Algorand?</option>
                        <option value="fallback-lesson-id-2">Writing PyTeal Contracts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-550 mb-1.5">Quiz Title</label>
                      <input
                        type="text"
                        required
                        value={quizForm.title}
                        onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-550 mb-1.5">Question Text</label>
                      <input
                        type="text"
                        required
                        value={quizForm.questions[0].questionText}
                        onChange={(e) => {
                          const q = [...quizForm.questions];
                          q[0].questionText = e.target.value;
                          setQuizForm({ ...quizForm, questions: q });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <Button type="submit" className="w-full py-2.5 mt-4 rounded-xl">Save & Deploy Quiz</Button>
                  </form>
                )}

                {/* 4. Upload Resources */}
                {activeModal === 'uploadResources' && (
                  <form onSubmit={handleUploadResources} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-slate-400" />
                      <p className="text-xs text-slate-500 text-center">Drag files here, or click to browse</p>
                      <input
                        type="file"
                        onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-xs text-slate-500"
                      />
                    </div>
                    <Button type="submit" className="w-full py-2.5 rounded-xl">Upload Selected File</Button>
                  </form>
                )}

                {/* 5. View Users list */}
                {activeModal === 'viewUsers' && (
                  <div className="space-y-3">
                    {userList.map((u) => (
                      <div key={u._id} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-none text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.fullName}</p>
                          <p className="text-slate-500">{u.email}</p>
                        </div>
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] self-center">{u.role}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. View Transactions list */}
                {activeModal === 'viewTransactions' && (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx._id} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-none text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{tx.userId?.fullName || 'Learner'}</p>
                          <p className="text-slate-400 text-[10px]">{tx.transactionHash || 'Pending...'}</p>
                        </div>
                        <span className="font-bold text-emerald-500 self-center">${tx.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
