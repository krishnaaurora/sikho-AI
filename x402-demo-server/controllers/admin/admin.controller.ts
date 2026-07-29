import { Request, Response } from "express";
import User, { UserRole } from "../../models/User.model";
import Course from "../../models/Course.model";
import Lesson from "../../models/Lesson.model";
import Chapter from "../../models/Chapter.model";
import Payment, { PaymentStatus, PaymentMethod } from "../../models/Payment.model";
import Purchase, { PurchaseStatus } from "../../models/Purchase.model";
import AiChat from "../../models/AiChat.model";
import Quiz from "../../models/Quiz.model";
import Category from "../../models/Category.model";
import { AppError } from "../../utils/errors";

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const activeUsers = await User.countDocuments({ isActive: true, isDeleted: false });
    const totalCourses = await Course.countDocuments({ isDeleted: false });
    const totalLessons = await Lesson.countDocuments({ isDeleted: false });
    const totalPurchases = await Purchase.countDocuments({ purchaseStatus: PurchaseStatus.COMPLETED });

    // Revenue sum from purchases
    const purchases = await Purchase.find({ purchaseStatus: PurchaseStatus.COMPLETED });
    const totalRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);

    // AI Requests Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aiRequestsToday = await AiChat.countDocuments({
      createdAt: { $gte: today },
    });

    // x402 Transactions
    const x402Transactions = await Purchase.countDocuments({
      purchaseStatus: PurchaseStatus.COMPLETED,
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalCourses,
        totalLessons,
        totalPurchases,
        totalRevenue,
        aiRequestsToday,
        x402Transactions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const purchases = await Purchase.find()
      .populate("userId", "fullName email")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users,
    });
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

    // Find or create category
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
