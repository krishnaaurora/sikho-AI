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
  Download, Filter, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeftOpen, Shield, ShieldCheck, FileSpreadsheet,
  ExternalLink, Sparkles, BookOpen, Code2, Briefcase, FileText, Target,
  MessageSquare, UserCheck, Eye, EyeOff, RefreshCw, X, DollarSign, Layers,
  UserX, UserPlus, Award, Zap, Mail, Send, Check, Code, FileCode, Trash2
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments' | 'apps' | 'email' | 'settings'>('overview');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Users State, Summary Tiles & Profile Slide-over
  const [usersData, setUsersData] = useState<any>({
    summaryTiles: {
      totalRegisteredUsers: 0,
      activeLearners: 0,
      deactivatedLearners: 0,
      newUsersLast7Days: 0,
      onboardingCompletedCount: 0,
      avgLearningHours: '0',
    },
    users: [],
  });
  const [userSearch, setUserSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Payments State & All Feature Filters
  const [paymentsData, setPaymentsData] = useState<any>({
    ledger: [],
    totals: {
      verifiedTotal: 0,
      pendingCount: 0,
      failedCount: 0,
      coursePurchasesTotal: 0,
      payPerChapterTotal: 0,
      githubReviewTotal: 0,
      sikhoGithubFeeTotal: 0,
      prismGithubFeeTotal: 0,
      aiServicesTotal: 0,
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

  // Email Template State & Controls
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBodyHtml, setEmailBodyHtml] = useState('');
  const [emailBodyText, setEmailBodyText] = useState('');
  const [emailUpdatedBy, setEmailUpdatedBy] = useState('system');
  const [emailUpdatedAt, setEmailUpdatedAt] = useState('');
  const [savingEmailTemplate, setSavingEmailTemplate] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [emailViewMode, setEmailViewMode] = useState<'editor' | 'preview' | 'plaintext'>('editor');

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
      const usersRes = await adminApi.getUsers({ search: userSearch });
      if (usersRes.success) {
        setUsersData(usersRes.data);
      }

      // 3. Payments
      const paymentsRes = await adminApi.getPayments({
        status: paymentStatusTab,
        feature: paymentFeatureFilter,
        search: paymentSearch,
      });
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

      // 6. Welcome Email Template
      const emailRes = await adminApi.getWelcomeEmailTemplate();
      if (emailRes.success && emailRes.data) {
        setEmailSubject(emailRes.data.subject || '');
        setEmailBodyHtml(emailRes.data.bodyHtml || '');
        setEmailBodyText(emailRes.data.bodyText || '');
        setEmailUpdatedBy(emailRes.data.updatedBy || 'system');
        setEmailUpdatedAt(emailRes.data.updatedAt || '');
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
  }, [analyticsDateRange, paymentStatusTab, paymentFeatureFilter]);

  // Save Welcome Email Template Handler
  const handleSaveEmailTemplate = async () => {
    setSavingEmailTemplate(true);
    try {
      const res = await adminApi.updateWelcomeEmailTemplate({
        subject: emailSubject,
        bodyHtml: emailBodyHtml,
        bodyText: emailBodyText,
      });
      if (res.success) {
        enqueueSnackbar('Welcome Email template updated and saved successfully!', { variant: 'success' });
        if (res.data) {
          setEmailUpdatedBy(res.data.updatedBy || 'admin');
          setEmailUpdatedAt(res.data.updatedAt || new Date().toISOString());
        }
        await adminApi.createActivityLog({
          action: 'UPDATE_EMAIL_TEMPLATE',
          target: 'welcome_email',
          details: 'Updated welcome email subject line and content template',
        });
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to save email template', { variant: 'error' });
    } finally {
      setSavingEmailTemplate(false);
    }
  };

  // Send Test Welcome Email Handler
  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const targetEmail = testEmailRecipient || user?.email || 'admin@gmail.com';
      const res = await adminApi.sendTestWelcomeEmail({
        recipientEmail: targetEmail,
        recipientName: 'Test Learner',
      });
      if (res.success) {
        enqueueSnackbar(res.message || `Test email dispatched to ${targetEmail}`, { variant: 'success' });
        setTestEmailModalOpen(false);
      } else {
        enqueueSnackbar(res.message || 'Failed to dispatch test email', { variant: 'warning' });
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to dispatch test email', { variant: 'error' });
    } finally {
      setSendingTestEmail(false);
    }
  };


  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    enqueueSnackbar('Dashboard refreshed with latest real-time MongoDB data', { variant: 'success' });
  };

  // Delete user account directly from database
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      const res = await adminApi.deleteUser(userToDelete._id);
      if (res.success) {
        enqueueSnackbar(`User account ${userToDelete.fullName || userToDelete.email} has been deleted successfully`, { variant: 'success' });
        setUserToDelete(null);
        setDeleteModalOpen(false);
        if (selectedUser?._id === userToDelete._id) {
          setSelectedUser(null);
          setSelectedUserDetails(null);
        }
        await loadDashboardData();
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Failed to delete user account', { variant: 'error' });
    } finally {
      setDeletingUser(false);
    }
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
  const filteredUsers = (usersData.users || []).filter((u: any) => {
    return (
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u._id?.toLowerCase().includes(userSearch.toLowerCase())
    );
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
        : p.featureUsed?.toLowerCase().includes(paymentFeatureFilter.toLowerCase()) ||
          p.appName?.toLowerCase().includes(paymentFeatureFilter.toLowerCase()) ||
          p.type?.toLowerCase().includes(paymentFeatureFilter.toLowerCase());
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

      {/* SIDEBAR (Dark Navy Collapsible Sidebar) */}
      <aside className={`hidden lg:flex lg:flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0f172a] border-r border-slate-800 flex-shrink-0 z-30 shadow-xl transition-all duration-300 ease-in-out`}>
        
        {/* Brand Header & Toggle Button */}
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-800/80 min-h-[65px]`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-base text-white tracking-tight leading-none truncate">Sikho AI</h1>
                <span className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase truncate block mt-0.5">Admin Portal</span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
            title={sidebarCollapsed ? "Expand Side Nav" : "Collapse Side Nav"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'payments', label: 'Payments & Ledger', icon: CreditCard },
            { id: 'apps', label: 'Application Usage', icon: BarChart3 },
            { id: 'email', label: 'Email Templates', icon: Mail },
            { id: 'settings', label: 'Settings & Security', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-3'} rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!sidebarCollapsed && isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/80 shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Admin Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} mb-3`}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30 shrink-0">
              A
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">Admin Account</p>
                <p className="text-[10px] text-slate-400 truncate">{maskText(user?.email || 'admin@gmail.com', true)}</p>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={logout}
            title={sidebarCollapsed ? "Sign Out" : undefined}
            className={`w-full ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start'} text-xs border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 py-2 h-auto`}
          >
            <LogOut className={`w-3.5 h-3.5 ${sidebarCollapsed ? '' : 'mr-2'} shrink-0`} />
            {!sidebarCollapsed && 'Sign Out'}
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (WHITE THEME) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100/70">

        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white shadow-xs px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>

            {/* Desktop Side Nav Toggle Button in Header */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200 transition-all"
              title={sidebarCollapsed ? "Expand Side Navigation" : "Collapse Side Navigation"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <h2 className="text-base font-bold text-slate-900 capitalize tracking-tight flex items-center gap-2">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management & Learner Profiles'}
              {activeTab === 'payments' && 'Payments & Ledger (All Features)'}
              {activeTab === 'apps' && 'Application Usage Analytics'}
              {activeTab === 'email' && 'Welcome Email Template & Auto-Dispatch'}
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

              {/* 6 Summary Cards */}
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
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" /> User Growth Trend
                      </h3>
                      <p className="text-xs text-slate-500">Cumulative registered learners over the last 7 days</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {overviewData.summary?.totalRegisteredUsers || 0} Total Learners
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewData.charts?.userGrowth || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={(val: any) => [`${val} Learners`, 'Registered Users']}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalUsers"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#userGrad)"
                          dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                          activeDot={{ r: 7, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                        >
                          <LabelList dataKey="totalUsers" position="top" style={{ fontSize: '11px', fontWeight: 'bold', fill: '#4f46e5' }} />
                        </Area>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Payment & Revenue Trends */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" /> Revenue Trends (USDC)
                      </h3>
                      <p className="text-xs text-slate-500">Daily USDC revenue breakdown over the last 7 days</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ${(overviewData.charts?.paymentTrends || []).reduce((acc: number, cur: any) => acc + (cur.revenue || 0), 0).toFixed(2)} USDC (7D)
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewData.charts?.paymentTrends || []} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="$" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={(val: any, _name: any, item: any) => [
                            `$${Number(val || 0).toFixed(2)} USDC (${item.payload.count || 0} payments)`,
                            'Daily Revenue'
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#revGrad)"
                          dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                          activeDot={{ r: 7, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                        >
                          <LabelList dataKey="revenue" position="top" formatter={(val: any) => `$${val}`} style={{ fontSize: '11px', fontWeight: 'extrabold', fill: '#059669' }} />
                        </Area>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Always Visible Daily Revenue Breakdown Grid (All 7 Days Guaranteed Fit) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-7 gap-1 sm:gap-1.5">
                    {(overviewData.charts?.paymentTrends || []).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl px-1 py-1.5 text-center flex flex-col items-center justify-center transition-all hover:bg-emerald-100/60 hover:border-emerald-300"
                        title={`${item.date}: $${item.revenue} USDC (${item.count || 0} transactions)`}
                      >
                        <p className="text-[10px] text-slate-500 font-bold truncate w-full">{item.date}</p>
                        <p className="text-xs font-black text-emerald-800 tracking-tight leading-tight mt-0.5">${item.revenue}</p>
                        <span className="text-[8px] font-semibold text-emerald-600/80 uppercase">USDC</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Application Usage Distribution Donut Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-600" /> Application Usage Distribution Across Sikho AI
                    </h3>
                    <p className="text-xs text-slate-500">Proportion of telemetry events across the 7 Sikho AI applications</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {(overviewData.charts?.appUsageDistribution || []).reduce((acc: number, cur: any) => acc + (cur.count || 0), 0)} Total Events
                  </span>
                </div>

                {(() => {
                  const totalEvents = (overviewData.charts?.appUsageDistribution || []).reduce((acc: number, cur: any) => acc + (cur.count || 0), 0);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="h-64 w-full flex items-center justify-center">
                        {totalEvents > 0 ? (
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
                              <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                formatter={(val: any, name: any) => [`${val} events (${((val / totalEvents) * 100).toFixed(1)}%)`, name]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 w-full h-full">
                            <div className="w-14 h-14 rounded-2xl bg-amber-100/70 border border-amber-200 flex items-center justify-center mb-3 text-amber-700 shadow-xs">
                              <BarChart3 className="w-7 h-7" />
                            </div>
                            <p className="text-xs font-bold text-slate-800">No Application Telemetry Recorded</p>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                              Interactive pie chart will populate automatically as learners engage with Sikho AI modules.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {(overviewData.charts?.appUsageDistribution || []).map((app: any, idx: number) => {
                          const IconComp = APP_ICONS[app.name] || Layers;
                          return (
                            <div key={idx} className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <IconComp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="font-semibold text-slate-800">{app.name}</span>
                              </div>
                              <span className="font-mono text-slate-600 font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-[11px]">
                                {app.count} events
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* 2. USERS MANAGEMENT TAB (ENHANCED TILES & CONTROLS) */}
          {activeTab === 'users' && (
            <div className="space-y-6">

              {/* USER MANAGEMENT TILES (REAL-TIME MONGODB METRICS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Learners</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-xl font-extrabold text-slate-900">{usersData.summaryTiles?.totalRegisteredUsers || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Registered in MongoDB</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Learners</span>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xl font-extrabold text-emerald-600">{usersData.summaryTiles?.activeLearners || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Account Active</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New (Last 7D)</span>
                    <UserPlus className="w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-xl font-extrabold text-sky-600">{usersData.summaryTiles?.newUsersLast7Days || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Joined this week</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Onboarding Done</span>
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xl font-extrabold text-amber-600">{usersData.summaryTiles?.onboardingCompletedCount || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Profile completed</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Learning Hrs</span>
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xl font-extrabold text-purple-600">{usersData.summaryTiles?.avgLearningHours || 0} hrs</p>
                  <p className="text-[10px] text-slate-400 mt-1">Per learner average</p>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user ID, name, email..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
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
                        <th className="py-3.5 px-4 font-semibold">Education / Role</th>
                        <th className="py-3.5 px-4 font-semibold">Reg Date</th>
                        <th className="py-3.5 px-4 font-semibold">Features Used</th>
                        <th className="py-3.5 px-4 font-semibold">Total Paid</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u: any) => (
                        <tr key={u._id} className="hover:bg-slate-50/80 transition-all">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{u._id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{u.fullName}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{maskText(u.email, true)}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800">{u.educationLevel || 'General'}</p>
                            <p className="text-[10px] text-slate-400">{u.targetRole || 'Learner'}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4 font-semibold text-indigo-600">{u.featuresUsed} features</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">${u.totalPaymentsMade} USDC</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectUser(u)}
                                className="text-[11px] h-7 border-slate-200 hover:border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                              >
                                View Profile <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setUserToDelete(u);
                                  setDeleteModalOpen(true);
                                }}
                                className="text-[11px] h-7 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> Delete Account
                              </Button>
                            </div>
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

          {/* 3. PAYMENTS & LEDGER TAB (ALL FEATURES & FILTERS) */}
          {activeTab === 'payments' && (
            <div className="space-y-8">

              {/* Payment Summary Cards by Feature Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verified Revenue</span>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1.5">${(paymentsData.totals?.verifiedTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[10px] text-slate-400 mt-1">Confirmed on-chain</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course Purchases</span>
                  <p className="text-xl font-extrabold text-indigo-600 mt-1.5">${(paymentsData.totals?.coursePurchasesTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[10px] text-slate-400 mt-1">Full Course Sales</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chapter Unlocks</span>
                  <p className="text-xl font-extrabold text-amber-600 mt-1.5">${(paymentsData.totals?.payPerChapterTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[10px] text-slate-400 mt-1">Pay-Per-Chapter</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GitHub Sikho Fee</span>
                  <p className="text-xl font-extrabold text-sky-600 mt-1.5">${(paymentsData.totals?.sikhoGithubFeeTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[10px] text-slate-400 mt-1">$0.05 / file platform fee</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GitHub Prism Fee</span>
                  <p className="text-xl font-extrabold text-purple-600 mt-1.5">${(paymentsData.totals?.prismGithubFeeTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[10px] text-slate-400 mt-1">$0.20 / file review fee</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Tools Micro-Payments</span>
                  <p className="text-xl font-extrabold text-blue-600 mt-1.5">${(paymentsData.totals?.aiServicesTotal || 0).toFixed(2)} USDC</p>
                  <p className="text-[10px] text-slate-400 mt-1">AI Applications</p>
                </div>
              </div>

              {/* Sikho-Specific Payment Split Highlight Box */}
              <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-600" /> GitHub Review Split Fee Log ($0.05 Sikho vs $0.20 Prism)
                </h3>
                <p className="text-xs text-slate-500 mb-4">Per-file code review fee separation and on-chain verification receipts</p>

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

              {/* Transactions Ledger Controls & All Feature Filters */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                
                {/* Status Tabs */}
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

                {/* Feature Filter Dropdown */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-xs text-slate-500 font-medium">Feature Filter:</span>
                  <select
                    value={paymentFeatureFilter}
                    onChange={(e) => setPaymentFeatureFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Sikho Features & Apps</option>
                    <option value="course">Course Purchases</option>
                    <option value="chapter">Learn Anything (Pay-Per-Chapter)</option>
                    <option value="github_review">GitHub Code Review</option>
                    <option value="resume">Resume Intelligence</option>
                    <option value="roadmap">Career Roadmap</option>
                    <option value="interview">Interview Mission</option>
                    <option value="job">Job Intelligence</option>
                    <option value="consultant">Career Consultant</option>
                  </select>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search user, tx hash..."
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
                          <td className="py-3.5 px-4 text-slate-700 font-semibold">{p.featureUsed}</td>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Sikho AI Applications Usage Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tracking real-time user engagement, DAU/WAU/MAU, and monetization across all 7 platform applications</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Timeframe:</span>
                  {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAnalyticsDateRange(r)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        analyticsDateRange === r
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7 Applications Grid with High-Contrast Clear Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {(appAnalyticsData.applications || []).map((app: any, idx: number) => {
                  const Icon = APP_ICONS[app.appName] || Sparkles;
                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        {/* Header: Icon & App Index */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-full border border-indigo-100">
                            App #{idx + 1}
                          </span>
                        </div>

                        {/* Title & Total Events Headline */}
                        <h4 className="font-extrabold text-base text-slate-900">{app.appName}</h4>
                        
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">Total Usage Events</span>
                          <span className="text-base font-black text-indigo-600">{app.totalUsageEvents}</span>
                        </div>
                        
                        {/* Breakdown Metrics */}
                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">Unique Active Users</span>
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{app.uniqueActiveUsers}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium">DAU / WAU / MAU</span>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              {app.dailyUsage} / {app.weeklyUsage} / {app.monthlyUsage}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-slate-500 font-medium">Revenue Generated</span>
                            <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                              ${Number(app.revenueGenerated || 0).toFixed(2)} USDC
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ranked Applications Bar Chart & Ranking Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" /> Ranked Application Usage Statistics
                    </h3>
                    <p className="text-xs text-slate-500">Telemetry comparison ranked by total events within ({analyticsDateRange})</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {(appAnalyticsData.rankedChart || []).reduce((acc: number, cur: any) => acc + (cur.usageCount || 0), 0)} Events Total
                  </span>
                </div>

                {(() => {
                  const totalRankedEvents = (appAnalyticsData.rankedChart || []).reduce((acc: number, cur: any) => acc + (cur.usageCount || 0), 0);
                  
                  if (totalRankedEvents === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 my-2">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                          <BarChart3 className="w-7 h-7" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No Telemetry Events Recorded for {analyticsDateRange.toUpperCase()}</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          Application usage counters and ranking chart will update in real-time as registered learners use the AI tools.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={appAnalyticsData.rankedChart || []} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis dataKey="appName" type="category" stroke="#334155" fontSize={11} width={140} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            formatter={(val: any) => [`${val} usage events`, 'Telemetry Usage']}
                          />
                          <Bar dataKey="usageCount" fill="#4f46e5" radius={[0, 6, 6, 0]}>
                            <LabelList dataKey="usageCount" position="right" style={{ fontSize: '11px', fontWeight: 'bold', fill: '#4f46e5' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
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

          {/* 6. EMAIL TEMPLATES MANAGEMENT TAB */}
          {activeTab === 'email' && (
            <div className="space-y-6">

              {/* Banner & Information */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Mail className="w-4 h-4 text-indigo-400" /> Automated Communication System
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight">Welcome Email Template Editor</h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                      Customize the welcome email sent automatically to every newly registered user. Use dynamic variables to personalize the email.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTestEmailModalOpen(true)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Test Email
                    </button>
                    <button
                      onClick={handleSaveEmailTemplate}
                      disabled={savingEmailTemplate}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> {savingEmailTemplate ? 'Saving...' : 'Save & Update'}
                    </button>
                  </div>
                </div>

                {/* Variable Helper Chips */}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-indigo-200 font-medium mr-2">Available Dynamic Placeholders:</span>
                  <button
                    onClick={() => setEmailSubject((prev) => prev + ' {{name}}')}
                    className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-white font-mono text-[11px] flex items-center gap-1 border border-white/20 transition-all"
                    title="Click to insert {{name}}"
                  >
                    <span>&#123;&#123;name&#125;&#125;</span> <span className="text-[10px] text-indigo-300">(User's Full Name)</span>
                  </button>
                  <button
                    onClick={() => setEmailSubject((prev) => prev + ' {{email}}')}
                    className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-white font-mono text-[11px] flex items-center gap-1 border border-white/20 transition-all"
                    title="Click to insert {{email}}"
                  >
                    <span>&#123;&#123;email&#125;&#125;</span> <span className="text-[10px] text-indigo-300">(Registered Email ID)</span>
                  </button>
                  {emailUpdatedAt && (
                    <span className="ml-auto text-[11px] text-indigo-300 italic">
                      Last Updated: {new Date(emailUpdatedAt).toLocaleString()} by {emailUpdatedBy}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Line Editor */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" /> Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Welcome to Sikho AI 🚀"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Main Content View Tabs (HTML Code vs Live Preview vs Plain Text) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEmailViewMode('editor')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        emailViewMode === 'editor'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" /> HTML Body Editor
                    </button>
                    <button
                      onClick={() => setEmailViewMode('preview')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        emailViewMode === 'preview'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Real-Time Live Preview
                    </button>
                    <button
                      onClick={() => setEmailViewMode('plaintext')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        emailViewMode === 'plaintext'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" /> Plain Text Fallback
                    </button>
                  </div>

                  <span className="text-xs text-slate-500">
                    Auto-sends to user's registered inbox upon sign-up.
                  </span>
                </div>

                {/* Mode 1: HTML Body Code Editor */}
                {emailViewMode === 'editor' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">HTML Code Editor (Responsive HTML Markup)</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Insert Helper:</span>
                        <button
                          onClick={() => setEmailBodyHtml((prev) => prev + ' {{name}}')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 font-mono rounded border border-slate-200"
                        >
                          + &#123;&#123;name&#125;&#125;
                        </button>
                        <button
                          onClick={() => setEmailBodyHtml((prev) => prev + ' {{email}}')}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 font-mono rounded border border-slate-200"
                        >
                          + &#123;&#123;email&#125;&#125;
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={emailBodyHtml}
                      onChange={(e) => setEmailBodyHtml(e.target.value)}
                      rows={18}
                      className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-inner"
                    />
                  </div>
                )}

                {/* Mode 2: Real-Time Live Rendered HTML Sandbox */}
                {emailViewMode === 'preview' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Live Render Preview (Simulating user: <strong>Alex Demo &lt;alex@gmail.com&gt;</strong>)</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> HTML Render OK
                      </span>
                    </div>

                    <div className="bg-slate-200 p-6 rounded-2xl border border-slate-300 overflow-y-auto max-h-[550px] shadow-inner">
                      <div
                        className="bg-white p-6 rounded-xl shadow-md max-w-xl mx-auto border border-slate-200"
                        dangerouslySetInnerHTML={{
                          __html: emailBodyHtml
                            .replace(/\{\{\s*name\s*\}\}/gi, 'Alex Demo')
                            .replace(/\{\{\s*email\s*\}\}/gi, 'alex@gmail.com'),
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Mode 3: Plain Text Version */}
                {emailViewMode === 'plaintext' && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-700">Plain Text Version (Fallback for non-HTML mail clients)</span>
                    <textarea
                      value={emailBodyText}
                      onChange={(e) => setEmailBodyText(e.target.value)}
                      rows={16}
                      className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs rounded-xl focus:outline-none focus:border-indigo-500 leading-relaxed"
                    />
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => setTestEmailModalOpen(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-300"
                  >
                    <Send className="w-4 h-4 text-emerald-600" /> Dispatch Preview Test Email
                  </button>

                  <button
                    onClick={handleSaveEmailTemplate}
                    disabled={savingEmailTemplate}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> {savingEmailTemplate ? 'Saving Changes...' : 'Save Welcome Email Template'}
                  </button>
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
                  <div className="py-16 text-center text-slate-500 text-xs">Loading complete learner profile from database...</div>
                ) : (
                  <>
                    {/* User Status Header Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${selectedUser.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {selectedUser.isActive ? '• Account Active' : '• Deactivated'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full font-bold ${selectedUserDetails?.profile?.onboardingCompleted ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                        {selectedUserDetails?.profile?.onboardingCompleted ? '✓ Onboarding Completed' : '⚠ Onboarding Incomplete'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
                        Joined: {new Date(selectedUserDetails?.profile?.createdAt || selectedUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Section 1: Registration Profile - Education & Academic Info */}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                      <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" /> Educational & Academic Background
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Highest Education</span>
                          <span className="font-bold text-slate-900">{selectedUserDetails?.profile?.educationLevel || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">College / University</span>
                          <span className="font-bold text-slate-900">{selectedUserDetails?.profile?.collegeUniversity || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Degree / Major</span>
                          <span className="font-semibold text-slate-800">{selectedUserDetails?.profile?.degree || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Graduation / Semester</span>
                          <span className="font-semibold text-slate-800">
                            {selectedUserDetails?.profile?.graduationYear || 'N/A'} ({selectedUserDetails?.profile?.currentYearSemester || 'N/A'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Registration Profile - Career Intent & Goals */}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
                        <Target className="w-4 h-4 text-indigo-600" /> Career Goals & Target Role
                      </h4>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Target Role</span>
                          <span className="font-extrabold text-indigo-600">{selectedUserDetails?.profile?.targetRole || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Experience Level</span>
                          <span className="font-bold text-slate-900">{selectedUserDetails?.profile?.experienceLevel || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Specialization</span>
                          <span className="font-semibold text-slate-800">{selectedUserDetails?.profile?.specialization || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Career Journey State</span>
                          <span className="font-semibold text-slate-800">{selectedUserDetails?.profile?.careerJourneyState || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Preferred Industry</span>
                          <span className="font-semibold text-slate-800">{selectedUserDetails?.profile?.preferredIndustry || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Target Timeline & Pay</span>
                          <span className="font-semibold text-slate-800">
                            {selectedUserDetails?.profile?.targetTimeline || 'N/A'} ({selectedUserDetails?.profile?.expectedSalary || 'N/A'})
                          </span>
                        </div>
                      </div>

                      {/* Target Companies & Locations Badges */}
                      {(selectedUserDetails?.profile?.targetCompanies || []).length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Target Companies</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedUserDetails.profile.targetCompanies.map((c: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-[10px]">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedUserDetails?.profile?.preferredLocations || []).length > 0 && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Preferred Locations</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedUserDetails.profile.preferredLocations.map((loc: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px]">
                                {loc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Skills, Interests & Intent Tags */}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" /> Skills, Focus & Intent
                      </h4>

                      {/* Current Skills */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Current Technical Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {(selectedUserDetails?.profile?.currentSkills || []).length > 0 ? (
                            selectedUserDetails.profile.currentSkills.map((s: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px]">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No skills listed</span>
                          )}
                        </div>
                      </div>

                      {/* Interests */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Domain Focus & Interests</span>
                        <div className="flex flex-wrap gap-1">
                          {(selectedUserDetails?.profile?.interests || []).length > 0 ? (
                            selectedUserDetails.profile.interests.map((int: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-[10px]">
                                {int}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No interests listed</span>
                          )}
                        </div>
                      </div>

                      {/* What Are You Here To Do */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Primary Registration Goals</span>
                        <div className="flex flex-wrap gap-1">
                          {(selectedUserDetails?.profile?.whatAreYouHereToDo || []).length > 0 ? (
                            selectedUserDetails.profile.whatAreYouHereToDo.map((goal: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-[10px]">
                                {goal}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">Standard Learner</span>
                          )}
                        </div>
                      </div>

                      {/* Language, Country & Links */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Language & Country</span>
                          <span className="font-semibold text-slate-800">
                            {selectedUserDetails?.profile?.preferredLanguage || 'English'} ({selectedUserDetails?.profile?.country || 'N/A'})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">GitHub Profile</span>
                          {selectedUserDetails?.profile?.githubUrl && selectedUserDetails.profile.githubUrl !== 'N/A' ? (
                            <a
                              href={selectedUserDetails.profile.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              {selectedUserDetails.profile.githubUrl} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Learning Habits & Wallet Info */}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2">
                        <Clock className="w-4 h-4 text-emerald-600" /> Learning Habits & Algorand Wallet
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Daily Commitment</span>
                          <span className="font-bold text-slate-900">{selectedUserDetails?.profile?.learningTimePerDay || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Preferred Time</span>
                          <span className="font-bold text-slate-900">{selectedUserDetails?.profile?.preferredLearningTime || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Learning Hours & Streak</span>
                          <span className="font-bold text-purple-600">
                            {selectedUserDetails?.profile?.totalLearningHours || 0} hrs ({selectedUserDetails?.profile?.learningStreak || 0} day streak)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase block">Algorand Wallet</span>
                          <span className="font-mono text-slate-700">{maskText(selectedUserDetails?.profile?.walletAddress)}</span>
                        </div>
                      </div>
                    </div>

                    {/* User Overview Stats Grid */}
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
                          {selectedUserDetails?.stats?.mostUsedFeature || 'None'}
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

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUserToDelete(selectedUser);
                    setDeleteModalOpen(true);
                  }}
                  className="w-full py-2 text-xs rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 font-bold flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Account
                </Button>
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

      {/* DELETE USER CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteModalOpen && userToDelete && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-sm text-rose-600 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-600" /> Delete User Account
                </h3>
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <p className="font-medium">
                  Are you sure you want to delete the account for <strong className="text-slate-900">{userToDelete.fullName}</strong> (<span className="font-mono text-slate-700">{userToDelete.email}</span>)?
                </p>
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-[11px] leading-relaxed">
                  <strong>Warning:</strong> Deleting this user account will remove their access, deactivate their profile, and mark the account as deleted while keeping historical financial ledger records intact.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 text-xs">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className="py-2 text-xs border-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteUser}
                  disabled={deletingUser}
                  className="py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  {deletingUser ? 'Deleting...' : 'Confirm & Delete Account'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEST EMAIL DISPATCH MODAL */}
      <AnimatePresence>
        {testEmailModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-600" /> Send Test Welcome Email
                </h3>
                <button
                  onClick={() => setTestEmailModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Dispatch a live preview of the welcome email to test delivery and inspect formatting in your real inbox.
              </p>

              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700">Recipient Email Address:</label>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder={user?.email || 'admin@gmail.com'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 text-xs">
                <Button
                  variant="outline"
                  onClick={() => setTestEmailModalOpen(false)}
                  className="py-2 text-xs border-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendTestEmail}
                  disabled={sendingTestEmail}
                  className="py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {sendingTestEmail ? 'Dispatching...' : 'Send Test Email Now'}
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

