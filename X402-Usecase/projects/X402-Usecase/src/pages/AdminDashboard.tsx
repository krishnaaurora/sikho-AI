import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../utils/api';
import { useSnackbar } from 'notistack';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import {
  LayoutDashboard, Users, CreditCard, BarChart3, Settings, LogOut,
  TrendingUp, Activity, CheckCircle2, Clock, AlertCircle, Search,
  Download, Filter, ChevronRight, Shield, ShieldCheck, FileSpreadsheet,
  ExternalLink, Sparkles, BookOpen, Code2, Briefcase, FileText, Target,
  MessageSquare, UserCheck, Eye, EyeOff, RefreshCw, X, DollarSign, Layers
} from 'lucide-react';
import { Button } from '../components/ui/button';

// Vibrant Curated Palette for White Theme Charts & Badges
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#2563eb'];

const APP_ICONS: Record<string, any> = {
  'Learn Anything': BookOpen,
  'Resume Intelligence': FileText,
  'Career Roadmap': Target,
  'Interview Mission': MessageSquare,
  'GitHub Review': Code2,
  'Job Intelligence': Briefcase,
  'Career Consultant': Sparkles,
};

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments' | 'apps' | 'settings'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data Loading & Refresh States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Overview Data
  const [overviewData, setOverviewData] = useState<any>({
    summary: {
      totalRegisteredUsers: 0,
      dailyActiveUsers: 0,
      monthlyActiveUsers: 0,
      totalSuccessfulPayments: 0,
      totalRevenueUSDC: 0,
      mostUsedApp: 'Learn Anything',
      totalAiFeatureUsage: 0,
    },
    charts: {
      userGrowth: [],
      paymentTrends: [],
      appUsageDistribution: [],
    },
    keyAnswers: {
      q1: { question: '', answer: '' },
      q2: { question: '', answer: '' },
      q3: { question: '', answer: '' },
    },
  });

  // Users State & Profile Slide-over
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Payments State
  const [paymentsData, setPaymentsData] = useState<any>({
    ledger: [],
    totals: {
      verifiedTotal: 0,
      pendingTotal: 0,
      failedTotal: 0,
      sikhoGithubFeeTotal: 0,
      prismGithubFeeTotal: 0,
      payPerChapterTotal: 0,
    },
    githubSplitDetails: [],
  });
  const [paymentStatusTab, setPaymentStatusTab] = useState<'all' | 'successful' | 'pending' | 'failed'>('all');
  const [paymentFeatureFilter, setPaymentFeatureFilter] = useState('all');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Application Usage Analytics State
  const [appAnalyticsData, setAppAnalyticsData] = useState<any>({
    applications: [],
    rankedChart: [],
  });
  const [analyticsDateRange, setAnalyticsDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Settings & Activity Logs State
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [maskSensitiveData, setMaskSensitiveData] = useState(false);

  // Initial Fetch Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Overview
      const overviewRes = await adminApi.getOverview();
      if (overviewRes.success) {
        setOverviewData(overviewRes.data);
      }

      // 2. Users
      const usersRes = await adminApi.getUsers();
      if (usersRes.success) {
        setUsersList(usersRes.data.users || []);
      }

      // 3. Payments
      const paymentsRes = await adminApi.getPayments();
      if (paymentsRes.success) {
        setPaymentsData(paymentsRes.data);
      }

      // 4. App Analytics
      const appsRes = await adminApi.getAppAnalytics(analyticsDateRange);
      if (appsRes.success) {
        setAppAnalyticsData(appsRes.data);
      }

      // 5. Activity Logs
      const logsRes = await adminApi.getActivityLogs();
      if (logsRes.success) {
        setActivityLogs(logsRes.data || []);
      }
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar(err.message || 'Failed to fetch admin metrics', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [analyticsDateRange]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    enqueueSnackbar('Dashboard refreshed with latest real-time data', { variant: 'success' });
  };

  // Fetch individual user details when clicking a user row
  const handleSelectUser = async (u: any) => {
    setSelectedUser(u);
    setLoadingUserDetails(true);
    try {
      const res = await adminApi.getUserDetails(u._id);
      if (res.success) {
        setSelectedUserDetails(res.data);
      }
    } catch (err: any) {
      enqueueSnackbar('Failed to load user profile details', { variant: 'error' });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Filtered Users Table
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u._id?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus =
      userStatusFilter === 'all'
        ? true
        : userStatusFilter === 'active'
        ? u.isActive
        : !u.isActive;
    return matchesSearch && matchesStatus;
  });

  // Filtered Payments Table
  const filteredPayments = (paymentsData.ledger || []).filter((p: any) => {
    const matchesStatus =
      paymentStatusTab === 'all'
        ? true
        : paymentStatusTab === 'successful'
        ? p.status === 'successful' || p.status === 'completed'
        : p.status === paymentStatusTab;
    const matchesFeature =
      paymentFeatureFilter === 'all'
        ? true
        : p.featureUsed?.toLowerCase().includes(paymentFeatureFilter.toLowerCase());
    const matchesSearch =
      p.userName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.featureUsed?.toLowerCase().includes(paymentSearch.toLowerCase());
    return matchesStatus && matchesFeature && matchesSearch;
  });

  // CSV Export Handler
  const handleExportCsv = async (type: 'users' | 'payments' | 'app-usage') => {
    try {
      await adminApi.downloadCsv(type);
      enqueueSnackbar(`Successfully exported ${type} report to CSV`, { variant: 'success' });
      await adminApi.createActivityLog({
        action: 'EXPORT_CSV_REPORT',
        target: type,
        details: `Exported ${type} report to CSV`,
      });
    } catch (err: any) {
      enqueueSnackbar('Failed to export CSV report', { variant: 'error' });
    }
  };

  // Helper for masking email/wallet if Sensitive PDI toggle is active
  const maskText = (text: string, isEmail = false) => {
    if (!maskSensitiveData || !text || text === 'N/A') return text;
    if (isEmail) {
      const parts = text.split('@');
      if (parts.length === 2) {
        return `${parts[0].substring(0, 2)}***@${parts[1]}`;
      }
    }
    return `${text.substring(0, 4)}...${text.substring(text.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex transition-colors font-sans antialiased">

      {/* SIDEBAR (Dark Navy for Premium SaaS Contrast) */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0f172a] border-r border-slate-800 flex-shrink-0 z-30 shadow-xl">
        
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-none">Sikho AI</h1>
            <span className="text-[11px] font-semibold text-indigo-400 tracking-wider uppercase">Admin Dashboard</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'payments', label: 'Payments & Ledger', icon: CreditCard },
            { id: 'apps', label: 'Application Usage', icon: BarChart3 },
            { id: 'settings', label: 'Settings & Security', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/80" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Admin Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Admin Account</p>
              <p className="text-[10px] text-slate-400 truncate">{maskText(user?.email || 'admin@gmail.com', true)}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="w-full justify-start text-xs border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 py-2 h-auto"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (WHITE THEME) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100/70">

        {/* Top Header Bar (Clean White) */}
        <header className="h-16 border-b border-slate-200 bg-white shadow-xs px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-900 capitalize tracking-tight flex items-center gap-2">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management & Profiles'}
              {activeTab === 'payments' && 'Payments & Fee Split Ledger'}
              {activeTab === 'apps' && 'Application Usage Analytics'}
              {activeTab === 'settings' && 'Admin Settings & Access Controls'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium shadow-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            {/* Quick Export CSV Button */}
            <button
              onClick={() => handleExportCsv(activeTab === 'users' ? 'users' : activeTab === 'payments' ? 'payments' : 'app-usage')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </header>

        {/* Main Body View Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8">

              {/* EXECUTIVE CALLOUT BANNER - Immediate 3 Questions Answered */}
              <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-200 uppercase tracking-wider mb-4">
                  <ShieldCheck className="w-4 h-4 text-indigo-300" /> Executive Highlights & Core Questions Answered
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Q1 */}
                  <div className="bg-white/10 border border-white/15 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">1. User Volume</p>
                      <p className="text-sm font-bold text-white mt-1">{overviewData.keyAnswers?.q1?.question || 'How many users are using Sikho AI?'}</p>
                    </div>
                    <p className="text-xs text-white font-medium mt-3 bg-white/15 p-2.5 rounded-lg">
                      {overviewData.keyAnswers?.q1?.answer || `${overviewData.summary?.totalRegisteredUsers} total registered learners.`}
                    </p>
                  </div>

                  {/* Q2 */}
                  <div className="bg-white/10 border border-white/15 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">2. Payment & Feature Breakdown</p>
                      <p className="text-sm font-bold text-white mt-1">{overviewData.keyAnswers?.q2?.question || 'Who is paying and for which feature?'}</p>
                    </div>
                    <p className="text-xs text-emerald-200 font-medium mt-3 bg-white/15 p-2.5 rounded-lg">
                      {overviewData.keyAnswers?.q2?.answer || `$${overviewData.summary?.totalRevenueUSDC} USDC received.`}
                    </p>
                  </div>

                  {/* Q3 */}
                  <div className="bg-white/10 border border-white/15 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">3. Top Application Usage</p>
                      <p className="text-sm font-bold text-white mt-1">{overviewData.keyAnswers?.q3?.question || 'Which applications are used most?'}</p>
                    </div>
                    <p className="text-xs text-amber-200 font-medium mt-3 bg-white/15 p-2.5 rounded-lg">
                      {overviewData.keyAnswers?.q3?.answer || `"${overviewData.summary?.mostUsedApp}" is the top used application.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* 6 Summary Cards (Crisp White) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Total Registered Users', val: overviewData.summary?.totalRegisteredUsers, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                  { label: 'Daily / Monthly Active', val: `${overviewData.summary?.dailyActiveUsers} DAU / ${overviewData.summary?.monthlyActiveUsers} MAU`, icon: Activity, color: 'text-sky-600 bg-sky-50 border-sky-100' },
                  { label: 'Successful Payments', val: overviewData.summary?.totalSuccessfulPayments, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Total Revenue (USDC)', val: `$${(overviewData.summary?.totalRevenueUSDC || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-600 bg-green-50 border-green-100' },
                  { label: 'Most-Used Application', val: overviewData.summary?.mostUsedApp, icon: Sparkles, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                  { label: 'Total AI Feature Usage', val: overviewData.summary?.totalAiFeatureUsage, icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">{card.label}</span>
                        <span className={`p-2 rounded-xl border ${card.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div className="mt-3">
                        <span className="text-lg font-extrabold text-slate-900 tracking-tight">{card.val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Chart 1: User Growth */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" /> User Growth Trend
                      </h3>
                      <p className="text-xs text-slate-500">Cumulative registered learners over the last 7 days</p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewData.charts?.userGrowth || []}>
                        <defs>
                          <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', color: '#0f172a' }} />
                        <Area type="monotone" dataKey="totalUsers" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#userGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Payment & Revenue Trends */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" /> Revenue Trends (USDC)
                      </h3>
                      <p className="text-xs text-slate-500">Daily USDC revenue breakdown over the last 7 days</p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overviewData.charts?.paymentTrends || []} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', color: '#0f172a' }} />
                        <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]}>
                          <LabelList dataKey="revenue" position="top" formatter={(val: any) => `$${val}`} style={{ fontSize: '11px', fontWeight: 'bold', fill: '#059669' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Always Visible Daily Revenue Breakdown List Below Chart */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 overflow-x-auto">
                    {(overviewData.charts?.paymentTrends || []).map((item: any, idx: number) => (
                      <div key={idx} className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-2.5 py-1.5 text-center flex-1 min-w-[65px]">
                        <p className="text-[10px] text-slate-500 font-semibold">{item.date}</p>
                        <p className="text-xs font-extrabold text-emerald-700">${item.revenue} <span className="text-[9px] font-medium text-slate-400">USDC</span></p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Application Usage Distribution Donut Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" /> Application Usage Distribution Across Sikho AI
                </h3>
                <p className="text-xs text-slate-500 mb-6">Proportion of usage events across the 7 Sikho AI applications</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overviewData.charts?.appUsageDistribution || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="count"
                        >
                          {(overviewData.charts?.appUsageDistribution || []).map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2.5">
                    {(overviewData.charts?.appUsageDistribution || []).map((app: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="font-semibold text-slate-800">{app.name}</span>
                        </div>
                        <span className="font-mono text-slate-500 font-bold">{app.count} events</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. USERS MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">

              {/* Filters & Search */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user ID, name, email..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className="text-xs text-slate-500 font-medium">Status:</span>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 font-semibold">User ID</th>
                        <th className="py-3.5 px-4 font-semibold">Learner Name</th>
                        <th className="py-3.5 px-4 font-semibold">Email</th>
                        <th className="py-3.5 px-4 font-semibold">Reg Date</th>
                        <th className="py-3.5 px-4 font-semibold">Status & Last Active</th>
                        <th className="py-3.5 px-4 font-semibold">Features Used</th>
                        <th className="py-3.5 px-4 font-semibold">Total Paid</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50/80 transition-all">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{u._id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{u.fullName}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{maskText(u.email, true)}</td>
                          <td className="py-3.5 px-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {u.isActive ? 'Active' : 'Deactivated'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-indigo-600">{u.featuresUsed} features</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">${u.totalPaymentsMade} USDC</td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectUser(u)}
                              className="text-[11px] h-7 border-slate-200 hover:border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                            >
                              View Profile <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">No matching users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 3. PAYMENTS MANAGEMENT TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-8">

              {/* Payment Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Revenue</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-2">${(paymentsData.totals?.verifiedTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[11px] text-slate-400 mt-1">Confirmed on Algorand blockchain</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GitHub Review Sikho Fee</span>
                  <p className="text-2xl font-extrabold text-indigo-600 mt-2">${(paymentsData.totals?.sikhoGithubFeeTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[11px] text-slate-400 mt-1">$0.05 USDC fee per reviewed file</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prism Review Fee</span>
                  <p className="text-2xl font-extrabold text-purple-600 mt-2">${(paymentsData.totals?.prismGithubFeeTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[11px] text-slate-400 mt-1">$0.20 USDC fee per reviewed file</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pay-Per-Chapter Unlocks</span>
                  <p className="text-2xl font-extrabold text-amber-600 mt-2">${(paymentsData.totals?.payPerChapterTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[11px] text-slate-400 mt-1">Direct course chapter unlock purchases</p>
                </div>
              </div>

              {/* Sikho-Specific Payment Split Highlight Box */}
              <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-600" /> Sikho-Specific Payment Tracking (GitHub Review & Chapter Unlocks)
                </h3>
                <p className="text-xs text-slate-500 mb-4">Per-file code review fee separation ($0.05 Sikho vs $0.20 Prism) and chapter unlocks ledger</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">File Review ID</th>
                        <th className="py-2.5 px-3 font-semibold">File Path</th>
                        <th className="py-2.5 px-3 font-semibold">Sikho Fee ($0.05)</th>
                        <th className="py-2.5 px-3 font-semibold">Prism Fee ($0.20)</th>
                        <th className="py-2.5 px-3 font-semibold">Total Fee</th>
                        <th className="py-2.5 px-3 font-semibold">Algorand Tx Reference</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(paymentsData.githubSplitDetails || []).map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{item.fileReviewId}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.filePath}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-600">$0.05 USDC</td>
                          <td className="py-2.5 px-3 font-bold text-purple-600">$0.20 USDC</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600">$0.25 USDC</td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                            {item.sikhoTxId}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions Ledger Controls */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                  {(['all', 'successful', 'pending', 'failed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setPaymentStatusTab(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                        paymentStatusTab === st
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search by user, transaction hash, feature..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Main Transactions Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                        <th className="py-3.5 px-4 font-semibold">Learner Name</th>
                        <th className="py-3.5 px-4 font-semibold">Application / Feature</th>
                        <th className="py-3.5 px-4 font-semibold">Amount & Currency</th>
                        <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                        <th className="py-3.5 px-4 font-semibold">Status</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Algorand Tx Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPayments.map((p: any) => (
                        <tr key={p._id} className="hover:bg-slate-50/80 transition-all">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{p.transactionId}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{p.userName}</td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">{p.featureUsed}</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">${p.amount} {p.currency}</td>
                          <td className="py-3.5 px-4 text-slate-500">{new Date(p.paymentDate).toLocaleString()}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'successful' || p.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <a
                              href={`https://lora.algokit.io/mainnet/transaction/${p.algorandTxRef}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 hover:text-indigo-800 underline"
                            >
                              {p.algorandTxRef ? `${p.algorandTxRef.substring(0, 10)}...` : 'View Tx'} <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                      {filteredPayments.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">No transactions recorded for this filter.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 4. APPLICATION USAGE ANALYTICS TAB */}
          {activeTab === 'apps' && (
            <div className="space-y-8">

              {/* Date Filter & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sikho AI Applications Usage Breakdown</h3>
                  <p className="text-xs text-slate-500">Tracking user engagement across all 7 platform applications</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Time Horizon:</span>
                  {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAnalyticsDateRange(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        analyticsDateRange === r
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7 Applications Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(appAnalyticsData.applications || []).map((app: any, idx: number) => {
                  const Icon = APP_ICONS[app.appName] || Sparkles;
                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            App #{idx + 1}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{app.appName}</h4>
                        
                        <div className="mt-4 space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Total Usage Events</span>
                            <span className="font-bold text-slate-900">{app.totalUsageEvents}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Unique Active Users</span>
                            <span className="font-semibold text-indigo-600">{app.uniqueActiveUsers}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">DAU / WAU / MAU</span>
                            <span className="font-mono text-slate-700">{app.dailyUsage} / {app.weeklyUsage} / {app.monthlyUsage}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Revenue Generated</span>
                            <span className="font-bold text-emerald-600">${app.revenueGenerated.toFixed(2)} USDC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ranked Applications Bar Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" /> Ranked Application Usage Count
                </h3>
                <p className="text-xs text-slate-500 mb-6">Applications ranked by total telemetry usage events within the selected timeframe ({analyticsDateRange})</p>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appAnalyticsData.rankedChart || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" fontSize={11} />
                      <YAxis dataKey="appName" type="category" stroke="#475569" fontSize={11} width={140} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="usageCount" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* 5. SETTINGS & ACCESS CONTROL TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-8">

              {/* Admin Profile & Role Overview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Admin Authentication & Access Control</h3>
                    <p className="text-xs text-slate-500">Configured security policy for platform administration</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <span className="text-slate-500">Authenticated Admin Username</span>
                    <p className="font-bold text-slate-900 mt-1">admin@gmail.com</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Role Authority</span>
                    <p className="font-bold text-indigo-600 mt-1">Platform Super Admin (ADMIN)</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Personal Data Protection (PDI)</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setMaskSensitiveData(!maskSensitiveData)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          maskSensitiveData ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {maskSensitiveData ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {maskSensitiveData ? 'Sensitive PDI Masked' : 'Unmasked View'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Reports Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Platform Reports
                </h3>
                <p className="text-xs text-slate-500 mb-6">Generate and download official CSV data reports</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Users & Learners Report</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Export registered users list with status and registration details.</p>
                    </div>
                    <Button
                      onClick={() => handleExportCsv('users')}
                      className="mt-4 text-xs py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-2" /> Download Users CSV
                    </Button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Payments & Financial Ledger</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Export complete USDC payment transactions with hashes.</p>
                    </div>
                    <Button
                      onClick={() => handleExportCsv('payments')}
                      className="mt-4 text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-2" /> Download Payments CSV
                    </Button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Application Usage Report</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Export telemetry usage logs across all 7 Sikho AI apps.</p>
                    </div>
                    <Button
                      onClick={() => handleExportCsv('app-usage')}
                      className="mt-4 text-xs py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-2" /> Download Usage CSV
                    </Button>
                  </div>
                </div>
              </div>

              {/* Admin Activity Audit Logs Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" /> Admin Audit Logs
                </h3>
                <p className="text-xs text-slate-500 mb-6">Recent security and administration events</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                        <th className="py-2.5 px-3 font-semibold">Admin Account</th>
                        <th className="py-2.5 px-3 font-semibold">Action</th>
                        <th className="py-2.5 px-3 font-semibold">Target</th>
                        <th className="py-2.5 px-3 font-semibold">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activityLogs.map((log: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-semibold text-indigo-600">{maskText(log.adminEmail, true)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{log.action}</td>
                          <td className="py-2.5 px-3 text-slate-700">{log.target || 'System'}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                        </tr>
                      ))}
                      {activityLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">No activity logs recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* INDIVIDUAL USER PROFILE SLIDE-OVER MODAL (Clean White Theme) */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between text-slate-800"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {selectedUser.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{selectedUser.fullName}</h3>
                      <p className="text-xs text-slate-500">{maskText(selectedUser.email, true)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setSelectedUserDetails(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loadingUserDetails ? (
                  <div className="py-16 text-center text-slate-500 text-xs">Loading learner profile metrics...</div>
                ) : (
                  <>
                    {/* User Overview Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Total Paid (USDC)</span>
                        <p className="text-lg font-bold text-emerald-600 mt-1">
                          ${selectedUserDetails?.stats?.totalAmountPaidUSDC || 0} USDC
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Most-Used Feature</span>
                        <p className="text-sm font-bold text-amber-600 mt-1 truncate">
                          {selectedUserDetails?.stats?.mostUsedFeature || 'Learn Anything'}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Chapters Completed</span>
                        <p className="text-lg font-bold text-indigo-600 mt-1">
                          {selectedUserDetails?.stats?.completedChapters || 0} Chapters
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">GitHub Reviews</span>
                        <p className="text-lg font-bold text-purple-600 mt-1">
                          {selectedUserDetails?.stats?.githubReviews || 0} Reviews
                        </p>
                      </div>
                    </div>

                    {/* Applications Frequency Breakdown */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-900 mb-3">Application Usage Frequency</h4>
                      <div className="space-y-2 text-xs">
                        {Object.entries(selectedUserDetails?.appBreakdown || {}).map(([app, count]: any) => (
                          <div key={app} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-none">
                            <span className="text-slate-700 font-medium">{app}</span>
                            <span className="font-mono text-indigo-600 font-bold">{count} sessions</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity Timeline */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-900 mb-3">Recent Activity Timeline</h4>
                      <div className="space-y-3 text-xs max-h-48 overflow-y-auto pr-1">
                        {(selectedUserDetails?.activityTimeline || []).map((act: any, i: number) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{act.action}</p>
                              <p className="text-[10px] text-slate-500">{new Date(act.timestamp).toLocaleString()}</p>
                            </div>
                            {act.isPaid && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                +${act.amount}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <Button
                  onClick={() => setSelectedUser(null)}
                  className="w-full py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                >
                  Close Profile
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
