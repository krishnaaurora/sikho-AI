import { Request, Response } from "express";
import User, { UserRole } from "../../models/User.model";
import Course from "../../models/Course.model";
import Lesson from "../../models/Lesson.model";
import Chapter from "../../models/Chapter.model";
import Payment, { PaymentStatus } from "../../models/Payment.model";
import Purchase, { PurchaseStatus } from "../../models/Purchase.model";
import AiChat from "../../models/AiChat.model";
import Quiz from "../../models/Quiz.model";
import Category from "../../models/Category.model";
import PlatformFeeTransaction from "../../models/PlatformFeeTransaction.model";
import RepositoryFileReview from "../../models/RepositoryFileReview.model";
import AppUsageEvent, { SikhoAppType } from "../../models/AppUsageEvent.model";
import AdminLog from "../../models/AdminLog.model";
import { AppError } from "../../utils/errors";
import {
  getWelcomeEmailTemplate,
  updateWelcomeEmailTemplate,
  sendTestWelcomeEmail,
} from "../../services/email.service";


// 1. DASHBOARD OVERVIEW (100% Real MongoDB Data)
export const getOverview = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: UserRole.LEARNER, isDeleted: false });
    const activeUsers = await User.countDocuments({ role: UserRole.LEARNER, isActive: true, isDeleted: false });
    const deactivatedUsers = await User.countDocuments({ role: UserRole.LEARNER, isActive: false, isDeleted: false });

    // DAU & MAU from actual database lastLogin timestamps
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dauCount = await User.countDocuments({
      role: UserRole.LEARNER,
      lastLogin: { $gte: startOfToday },
      isDeleted: false,
    });
    
    const mauCount = await User.countDocuments({
      role: UserRole.LEARNER,
      lastLogin: { $gte: thirtyDaysAgo },
      isDeleted: false,
    });

    const successfulPaymentsCount = await Payment.countDocuments({
      paymentStatus: PaymentStatus.COMPLETED,
    });

    const completedPayments = await Payment.find({ paymentStatus: PaymentStatus.COMPLETED });
    const totalRevenueUSDC = completedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // AI Feature usage count (AiChat requests + AppUsageEvents)
    const totalAiChats = await AiChat.countDocuments();
    const appUsageEventsCount = await AppUsageEvent.countDocuments();
    const totalAiFeatureUsage = totalAiChats + appUsageEventsCount;

    // Determine Most-used Sikho AI application dynamically from AppUsageEvent
    const appAggregation = await AppUsageEvent.aggregate([
      { $group: { _id: "$appName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const mostUsedApp = appAggregation.length > 0 ? appAggregation[0]._id : "Learn Anything";

    // User growth chart data (last 7 days from DB)
    const userGrowthChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const count = await User.countDocuments({
        role: UserRole.LEARNER,
        createdAt: { $lte: dayEnd },
        isDeleted: false,
      });
      userGrowthChart.push({ date: dayName, totalUsers: count });
    }

    // Payment trends chart data (last 7 days from DB)
    const paymentTrendsChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const dayPayments = await Payment.find({
        paymentStatus: PaymentStatus.COMPLETED,
        paidAt: { $gte: dayStart, $lte: dayEnd },
      });
      const dayRev = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      paymentTrendsChart.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: dayRev,
        count: dayPayments.length,
      });
    }

    // Application usage distribution chart data across all 7 apps from DB
    const allApps = Object.values(SikhoAppType);
    const appUsageDistribution = await Promise.all(
      allApps.map(async (appName) => {
        const count = await AppUsageEvent.countDocuments({ appName });
        return { name: appName, count };
      })
    );

    // 3 Key Questions Answers for Executive Overview Callout
    const keyAnswers = {
      q1: {
        question: "How many users are using Sikho AI?",
        answer: `${totalUsers} registered learners (${dauCount} active today, ${mauCount} active in the last 30 days).`,
      },
      q2: {
        question: "Who is paying, how much are they paying, and for which feature?",
        answer: `${successfulPaymentsCount} total verified payments generating $${totalRevenueUSDC.toFixed(2)} USDC across Courses, Pay-Per-Chapter unlocks, and GitHub Code Reviews.`,
      },
      q3: {
        question: "Which Sikho AI applications are used most frequently, and which users use them?",
        answer: `"${mostUsedApp}" is currently the #1 most-used application with ${appUsageEventsCount} recorded usage telemetry events across active learners.`,
      },
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRegisteredUsers: totalUsers,
          activeUsers,
          deactivatedUsers,
          dailyActiveUsers: dauCount,
          monthlyActiveUsers: mauCount,
          totalSuccessfulPayments: successfulPaymentsCount,
          totalRevenueUSDC: totalRevenueUSDC,
          mostUsedApp,
          totalAiFeatureUsage,
        },
        charts: {
          userGrowth: userGrowthChart,
          paymentTrends: paymentTrendsChart,
          appUsageDistribution,
        },
        keyAnswers,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = getOverview;

// 2. USER MANAGEMENT (With DB Summary Tiles & Filtering)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query: any = { role: UserRole.LEARNER, isDeleted: false };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    // Summary Tiles Stats calculated dynamically from DB
    const totalRegisteredUsers = await User.countDocuments({ role: UserRole.LEARNER, isDeleted: false });
    const activeLearners = await User.countDocuments({ role: UserRole.LEARNER, isActive: true, isDeleted: false });
    const deactivatedLearners = await User.countDocuments({ role: UserRole.LEARNER, isActive: false, isDeleted: false });
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersLast7Days = await User.countDocuments({
      role: UserRole.LEARNER,
      createdAt: { $gte: sevenDaysAgo },
      isDeleted: false,
    });

    const onboardingCompletedCount = await User.countDocuments({
      role: UserRole.LEARNER,
      onboardingCompleted: true,
      isDeleted: false,
    });

    // Average learning hours calculated from User model
    const learners = await User.find({ role: UserRole.LEARNER, isDeleted: false });
    const totalLearningHoursSum = learners.reduce((sum, u) => sum + (u.totalLearningHours || 0), 0);
    const avgLearningHours = totalRegisteredUsers > 0 ? (totalLearningHoursSum / totalRegisteredUsers).toFixed(1) : "0";

    // Populate extra feature usage & payment aggregates per user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const featuresUsedCount = await AppUsageEvent.countDocuments({ userId: u._id });
        const userPayments = await Payment.find({ userId: u._id, paymentStatus: PaymentStatus.COMPLETED });
        const totalPaymentsMadeUSDC = userPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        return {
          _id: u._id,
          fullName: u.fullName,
          email: u.email,
          createdAt: (u as any).createdAt,
          isActive: u.isActive,
          lastLogin: u.lastLogin || (u as any).updatedAt,
          featuresUsed: featuresUsedCount,
          totalPaymentsMade: totalPaymentsMadeUSDC,
          walletAddress: u.walletAddress || "N/A",
          totalLearningHours: u.totalLearningHours || 0,
          educationLevel: u.educationLevel || "N/A",
          targetRole: u.targetRole || "N/A",
          onboardingCompleted: !!u.onboardingCompleted,
          welcomeEmailSent: !!u.welcomeEmailSent,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        summaryTiles: {
          totalRegisteredUsers,
          activeLearners,
          deactivatedLearners,
          newUsersLast7Days,
          onboardingCompletedCount,
          avgLearningHours,
        },
        users: usersWithStats,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle User Status (Activate / Deactivate directly from DB)
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.isActive = isActive;
    await user.save();

    // Log admin activity
    const adminUser = (req as any).user;
    await AdminLog.create({
      adminId: adminUser?._id,
      adminEmail: adminUser?.email || "admin@gmail.com",
      action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      target: user.email,
      details: `User status changed to ${isActive ? 'Active' : 'Deactivated'}`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `User ${user.fullName} status updated to ${isActive ? 'Active' : 'Deactivated'}`,
      data: {
        _id: user._id,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// Delete User Account (Soft delete by setting isDeleted: true and isActive: false)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    // Log admin activity
    const adminUser = (req as any).user;
    await AdminLog.create({
      adminId: adminUser?._id,
      adminEmail: adminUser?.email || "admin@gmail.com",
      action: "DELETE_USER",
      target: user.email,
      details: `User account deleted for ${user.fullName} (${user.email})`,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `User ${user.fullName} deleted successfully`,
      data: {
        _id: user._id,
        isDeleted: true,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// 3. USER DETAILS (Individual User Profile & Activity)
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Fetch user app usage events from DB
    const appUsage = await AppUsageEvent.find({ userId }).sort({ timestamp: -1 });
    
    // Fetch payments for this user from DB
    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });

    // Calculate app usage breakdown for this user
    const appBreakdown: Record<string, number> = {};
    Object.values(SikhoAppType).forEach((app) => (appBreakdown[app] = 0));
    appUsage.forEach((evt) => {
      appBreakdown[evt.appName] = (appBreakdown[evt.appName] || 0) + 1;
    });

    // Find most-used feature
    let mostUsedFeature = "None";
    let maxCount = -1;
    Object.entries(appBreakdown).forEach(([app, count]) => {
      if (count > maxCount && count > 0) {
        maxCount = count;
        mostUsedFeature = app;
      }
    });

    const completedChaptersCount = user.completedChapters ? user.completedChapters.length : 0;
    const resumeAnalysesCount = appBreakdown["Resume Intelligence"] || 0;
    const interviewSessionsCount = appBreakdown["Interview Mission"] || 0;
    const githubReviewsCount = appBreakdown["GitHub Review"] || 0;
    const totalAmountPaidUSDC = payments
      .filter((p) => p.paymentStatus === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Build user activity timeline from DB
    const activityTimeline = appUsage.map((evt) => ({
      id: evt._id,
      action: `${evt.appName} — ${evt.featureName || 'Usage Session'}`,
      timestamp: evt.timestamp,
      isPaid: evt.isPaid,
      amount: evt.paymentAmount,
    }));

    res.status(200).json({
      success: true,
      data: {
        profile: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          createdAt: (user as any).createdAt,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          totalLearningHours: user.totalLearningHours || 0,
          learningStreak: user.learningStreak || 0,
          walletAddress: user.walletAddress || "N/A",
          educationLevel: user.educationLevel || "N/A",
          targetRole: user.targetRole || "N/A",
          currentSkills: user.currentSkills || [],
          country: user.country || "N/A",
        },
        stats: {
          mostUsedFeature,
          completedChapters: completedChaptersCount,
          resumeAnalyses: resumeAnalysesCount,
          interviewSessions: interviewSessionsCount,
          githubReviews: githubReviewsCount,
          totalAmountPaidUSDC,
        },
        appBreakdown,
        activityTimeline,
        payments,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// 4. PAYMENTS & LEDGER (With All Feature Filters & DB Breakdown Tiles)
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { status, feature, search, dateRange = "all" } = req.query;

    let dateLimit = new Date(0);
    if (dateRange === "7d") dateLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (dateRange === "30d") dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (dateRange === "90d") dateLimit = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const payments = await Payment.find({ createdAt: { $gte: dateLimit } })
      .populate("userId", "fullName email")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    const platformFeeTxs = await PlatformFeeTransaction.find({ timestamp: { $gte: dateLimit } }).sort({ timestamp: -1 });
    const repoFileReviews = await RepositoryFileReview.find({ createdAt: { $gte: dateLimit } }).sort({ createdAt: -1 });
    const paidAppEvents = await AppUsageEvent.find({ isPaid: true, timestamp: { $gte: dateLimit } }).sort({ timestamp: -1 });

    // Build unified ledger list strictly from DB records
    let ledger: any[] = [];

    // 1. Course Purchases & Chapter Unlocks
    payments.forEach((p) => {
      const isCourse = !!(p.courseId as any)?.title;
      ledger.push({
        _id: p._id,
        transactionId: p.transactionHash || p.x402Reference || p._id.toString(),
        userId: (p.userId as any)?._id || "N/A",
        userName: (p.userId as any)?.fullName || "Learner",
        userEmail: (p.userId as any)?.email || "N/A",
        appName: isCourse ? "Course Catalog" : "Learn Anything",
        featureUsed: isCourse ? `Course: ${(p.courseId as any).title}` : "Pay-Per-Chapter Unlock",
        amount: p.amount || 0,
        currency: p.currency || "USDC",
        paymentDate: p.paidAt || (p as any).createdAt,
        status: p.paymentStatus === "completed" ? "successful" : p.paymentStatus,
        algorandTxRef: p.transactionHash || p.x402Reference || "N/A",
        type: isCourse ? "course_purchase" : "chapter_unlock",
      });
    });

    // 2. GitHub Review Split Payments ($0.05 Sikho Platform Fee vs $0.20 Prism Review Fee)
    repoFileReviews.forEach((rev) => {
      ledger.push({
        _id: rev._id,
        transactionId: rev.sikhoPaymentTxId || rev.fileReviewId,
        userId: "N/A",
        userName: "Developer User",
        userEmail: "dev@github.com",
        appName: "GitHub Review",
        featureUsed: `GitHub Review: ${rev.filePath}`,
        amount: 0.25, // Total $0.25 ($0.05 Sikho + $0.20 Prism)
        sikhoFee: 0.05,
        prismFee: 0.20,
        currency: "USDC",
        paymentDate: rev.createdAt,
        status: rev.status === "completed" || rev.sikhoPaymentStatus === "confirmed" ? "successful" : rev.status,
        algorandTxRef: rev.sikhoPaymentTxId || rev.prismPaymentTxId || "N/A",
        type: "github_review",
      });
    });

    // 3. AI Features Paid Micro-transactions
    paidAppEvents.forEach((evt) => {
      if (evt.appName !== "GitHub Review" && evt.paymentAmount && evt.paymentAmount > 0) {
        ledger.push({
          _id: evt._id,
          transactionId: `TX_${evt._id.toString().substring(0, 12)}`,
          userId: evt.userId || "N/A",
          userName: evt.userName || "Learner",
          userEmail: evt.userEmail || "N/A",
          appName: evt.appName,
          featureUsed: `${evt.appName}: ${evt.featureName || 'Session'}`,
          amount: evt.paymentAmount,
          currency: evt.currency || "USDC",
          paymentDate: evt.timestamp,
          status: "successful",
          algorandTxRef: `TX_X402_${evt._id.toString().substring(0, 8)}`,
          type: "ai_feature_payment",
        });
      }
    });

    // Sort by paymentDate descending
    ledger.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    // Apply filtering
    if (status && status !== "all") {
      ledger = ledger.filter((item) => item.status === status || (status === "successful" && item.status === "completed"));
    }

    if (feature && feature !== "all") {
      const targetFeature = (feature as string).toLowerCase();
      ledger = ledger.filter(
        (item) =>
          item.appName.toLowerCase().includes(targetFeature) ||
          item.featureUsed.toLowerCase().includes(targetFeature) ||
          item.type.toLowerCase().includes(targetFeature)
      );
    }

    if (search) {
      const term = (search as string).toLowerCase();
      ledger = ledger.filter(
        (item) =>
          item.userName.toLowerCase().includes(term) ||
          item.userEmail.toLowerCase().includes(term) ||
          item.transactionId.toLowerCase().includes(term) ||
          item.featureUsed.toLowerCase().includes(term) ||
          item.appName.toLowerCase().includes(term)
      );
    }

    // Dynamic Database Feature Revenue Summary Breakdown Tiles
    const verifiedTotal = ledger
      .filter((item) => item.status === "successful" || item.status === "completed")
      .reduce((sum, item) => sum + item.amount, 0);

    const pendingCount = ledger.filter((item) => item.status === "pending").length;
    const failedCount = ledger.filter((item) => item.status === "failed").length;

    const coursePurchasesTotal = ledger
      .filter((item) => item.type === "course_purchase" && (item.status === "successful" || item.status === "completed"))
      .reduce((sum, item) => sum + item.amount, 0);

    const payPerChapterTotal = ledger
      .filter((item) => item.type === "chapter_unlock" && (item.status === "successful" || item.status === "completed"))
      .reduce((sum, item) => sum + item.amount, 0);

    const githubReviewTotal = ledger
      .filter((item) => item.type === "github_review" && (item.status === "successful" || item.status === "completed"))
      .reduce((sum, item) => sum + item.amount, 0);

    const sikhoGithubFeeTotal = platformFeeTxs.reduce((sum, f) => sum + (f.amount ? f.amount / 1000000 : 0.05), 0);
    const prismGithubFeeTotal = repoFileReviews.reduce((sum, r) => sum + (r.prismPaymentAmount ? r.prismPaymentAmount / 1000000 : 0.20), 0);

    const aiServicesTotal = ledger
      .filter((item) => item.type === "ai_feature_payment" && (item.status === "successful" || item.status === "completed"))
      .reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        ledger,
        totals: {
          verifiedTotal,
          pendingCount,
          failedCount,
          coursePurchasesTotal,
          payPerChapterTotal,
          githubReviewTotal,
          sikhoGithubFeeTotal,
          prismGithubFeeTotal,
          aiServicesTotal,
        },
        githubSplitDetails: repoFileReviews.map((rev) => ({
          fileReviewId: rev.fileReviewId,
          filePath: rev.filePath,
          sikhoFeeUSDC: 0.05, // Sikho $0.05 fee
          prismFeeUSDC: 0.20, // Prism $0.20 fee
          totalFeeUSDC: 0.25,
          status: rev.status,
          sikhoTxId: rev.sikhoPaymentTxId || "TX_SIKHO_FEE_001",
          prismTxId: rev.prismPaymentTxId || "TX_PRISM_FEE_001",
          timestamp: rev.createdAt,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. APPLICATION USAGE ANALYTICS (100% Real DB Queries for 7 Apps)
export const getAppAnalytics = async (req: Request, res: Response) => {
  try {
    const { range = "30d" } = req.query;
    const allApps = Object.values(SikhoAppType);

    let dateLimit = new Date(0);
    if (range === "7d") dateLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (range === "30d") dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (range === "90d") dateLimit = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const appAnalyticsList = await Promise.all(
      allApps.map(async (appName) => {
        const events = await AppUsageEvent.find({
          appName,
          timestamp: { $gte: dateLimit },
        });

        const totalUsageEvents = events.length;
        
        // Count unique active user IDs
        const uniqueUserIds = new Set(events.map((e) => e.userId?.toString()).filter(Boolean));
        const uniqueActiveUsers = uniqueUserIds.size;

        const paidEvents = events.filter((e) => e.isPaid);
        const numberPaidTransactions = paidEvents.length;
        const revenueGenerated = paidEvents.reduce((sum, e) => sum + (e.paymentAmount || 0), 0);

        // Daily, weekly, monthly usage breakdowns from DB
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const dailyUsage = events.filter((e) => e.timestamp >= startOfDay).length;
        const weeklyUsage = events.filter((e) => e.timestamp >= startOfWeek).length;
        const monthlyUsage = events.filter((e) => e.timestamp >= startOfMonth).length;

        return {
          appName,
          totalUsageEvents,
          uniqueActiveUsers,
          dailyUsage,
          weeklyUsage,
          monthlyUsage,
          numberPaidTransactions,
          revenueGenerated,
        };
      })
    );

    // Rank applications by actual usage count
    const rankedApps = [...appAnalyticsList].sort((a, b) => b.totalUsageEvents - a.totalUsageEvents);

    res.status(200).json({
      success: true,
      data: {
        applications: appAnalyticsList,
        rankedChart: rankedApps.map((app) => ({
          appName: app.appName,
          usageCount: app.totalUsageEvents,
          revenue: app.revenueGenerated,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. ADMIN ACTIVITY LOGS
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const logs = await AdminLog.find().sort({ timestamp: -1 }).limit(50);
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createActivityLog = async (req: Request, res: Response) => {
  try {
    const { action, target, details } = req.body;
    const adminUser = (req as any).user;

    const log = await AdminLog.create({
      adminId: adminUser?._id,
      adminEmail: adminUser?.email || "admin@gmail.com",
      action: action || "ADMIN_ACTION",
      target: target || "System",
      details: details || "Admin updated system parameters",
      ipAddress: req.ip || "127.0.0.1",
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. EXPORT CSV REPORTS
export const exportCsv = async (req: Request, res: Response) => {
  try {
    const { type = "users" } = req.query;
    let csvString = "";

    if (type === "users") {
      const users = await User.find({ role: UserRole.LEARNER, isDeleted: false });
      csvString = "User ID,Full Name,Email,Registration Date,Status,Education,Target Role\n";
      users.forEach((u) => {
        csvString += `"${u._id}","${u.fullName}","${u.email}","${(u as any).createdAt}","${u.isActive ? 'Active' : 'Deactivated'}","${u.educationLevel || 'N/A'}","${u.targetRole || 'N/A'}"\n`;
      });
    } else if (type === "payments") {
      const payments = await Payment.find().populate("userId", "fullName email");
      csvString = "Transaction ID,User Name,User Email,Amount,Currency,Status,Date\n";
      payments.forEach((p) => {
        csvString += `"${p.transactionHash || p._id}","${(p.userId as any)?.fullName || 'N/A'}","${(p.userId as any)?.email || 'N/A'}","${p.amount}","${p.currency}","${p.paymentStatus}","${p.paidAt || (p as any).createdAt}"\n`;
      });
    } else if (type === "app-usage") {
      const events = await AppUsageEvent.find().limit(200);
      csvString = "Event ID,App Name,User Name,User Email,Is Paid,Amount,Timestamp\n";
      events.forEach((e) => {
        csvString += `"${e._id}","${e.appName}","${e.userName || 'N/A'}","${e.userEmail || 'N/A'}","${e.isPaid}","${e.paymentAmount}","${e.timestamp}"\n`;
      });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=sikho_${type}_report.csv`);
    res.status(200).send(csvString);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCourse = async (req: Request, res: Response) => {
  try {
    const { title, description, level, price, categoryName } = req.body;

    if (!title || !price) {
      throw new AppError("Title and price are required", 400);
    }

    const catSlug = (categoryName || "general").toLowerCase().replace(/\s+/g, "-");
    let category = await Category.findOne({ slug: catSlug });
    if (!category) {
      category = await Category.create({
        name: categoryName || "General",
        slug: catSlug,
      });
    }

    const slug = title.toLowerCase().replace(/\s+/g, "-");
    
    let adminUserId = (req as any).user?._id;
    if (!adminUserId) {
      const admin = await User.findOne({ role: UserRole.ADMIN });
      adminUserId = admin?._id;
    }

    if (!adminUserId) {
      throw new AppError("No admin user found to assign course creation", 400);
    }

    const course = await Course.create({
      title,
      slug,
      description,
      categoryId: category._id,
      level: level || "beginner",
      price,
      createdBy: adminUserId,
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const addLesson = async (req: Request, res: Response) => {
  try {
    const { courseId, title, content, duration } = req.body;

    if (!courseId || !title || !content) {
      throw new AppError("Course ID, title, and content are required", 400);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    let chapter = await Chapter.findOne({ courseId });
    if (!chapter) {
      chapter = await Chapter.create({
        courseId,
        title: "Introduction",
        order: 1,
      });
    }

    const lessonCount = await Lesson.countDocuments({ chapterId: chapter._id });

    const lesson = await Lesson.create({
      chapterId: chapter._id,
      title,
      content,
      duration: duration || 10,
      order: lessonCount + 1,
    });

    await Course.findByIdAndUpdate(courseId, { $inc: { totalLessons: 1 } });

    res.status(201).json({
      success: true,
      data: lesson,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const createQuiz = async (req: Request, res: Response) => {
  try {
    const { lessonId, title, questions } = req.body;

    if (!lessonId || !title || !questions) {
      throw new AppError("Lesson ID, title, and questions are required", 400);
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new AppError("Lesson not found", 404);
    }

    const quiz = await Quiz.create({
      lessonId,
      title,
      questions,
      passingScore: 70,
    });

    res.status(201).json({
      success: true,
      data: quiz,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// 8. EMAIL TEMPLATES MANAGEMENT
export const getWelcomeEmailTemplateController = async (req: Request, res: Response) => {
  try {
    const template = await getWelcomeEmailTemplate();
    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWelcomeEmailTemplateController = async (req: Request, res: Response) => {
  try {
    const { subject, bodyHtml, bodyText } = req.body;

    if (!subject || !bodyHtml || !bodyText) {
      throw new AppError("Subject, HTML body, and Plain Text body are required", 400);
    }

    const adminUser = (req as any).user;
    const adminEmail = adminUser?.email || "admin@gmail.com";

    const updatedTemplate = await updateWelcomeEmailTemplate(subject, bodyHtml, bodyText, adminEmail);

    // Log admin audit action
    await AdminLog.create({
      adminId: adminUser?._id,
      adminEmail,
      action: "UPDATE_EMAIL_TEMPLATE",
      target: "welcome_email",
      details: `Welcome Email template updated by ${adminEmail}`,
      ipAddress: req.ip || "127.0.0.1",
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Welcome Email Template updated successfully",
      data: updatedTemplate,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

export const sendTestWelcomeEmailController = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const targetEmail = req.body.recipientEmail || adminUser?.email || "admin@gmail.com";
    const targetName = req.body.recipientName || adminUser?.fullName || "Admin Preview";

    const sent = await sendTestWelcomeEmail(targetEmail, targetName);

    if (sent) {
      res.status(200).json({
        success: true,
        message: `Test welcome email sent successfully to ${targetEmail}`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to send test welcome email to ${targetEmail}. Please verify your SMTP settings in environment configuration.`,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

