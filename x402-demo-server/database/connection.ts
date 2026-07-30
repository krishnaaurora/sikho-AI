import mongoose from "mongoose";
import { dbConfig } from "../config/db.config";
import { logger } from "../utils/logger";
import * as Models from "../models";
import { UserRole } from "../models/User.model";
import { CourseLevel } from "../models/Course.model";
import { PaymentMethod, PaymentStatus } from "../models/Payment.model";
import { PurchaseStatus } from "../models/Purchase.model";
import { AiChatRole } from "../models/AiChat.model";

let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    logger.info("Already connected to MongoDB");
    return;
  }

  try {
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(dbConfig.uri, dbConfig.options);
    isConnected = true;
    logger.info("Successfully connected to MongoDB");

    // Create indexes
    await Promise.all(
      Object.values(Models)
        .filter((model) => typeof model === "function")
        .map(async (model) => {
          try {
            await model.createIndexes();
            logger.info(`Indexes created for ${(model as any).modelName}`);
          } catch (err: any) {
            logger.warn(`Index creation warning for ${(model as any).modelName}: ${err.message}`);
          }
        })
    );
    logger.info("All MongoDB indexes processed");

    // Seed database
    await seedDatabase();

    process.on("SIGINT", async () => {
      await mongoose.disconnect();
      logger.info("MongoDB connection closed due to app termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

async function seedDatabase() {
  const adminEmail = "admin@sikhaoai.com";
  const User = Models.User;
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    logger.info("Admin user not found. Seeding admin user...");
    await User.create({
      fullName: "SikhoAI Admin",
      email: adminEmail,
      password: "Admin123!",
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: true,
    });
    logger.info("Admin user seeded successfully!");
  }

  const Category = Models.Category;
  const Course = Models.Course;
  const Chapter = Models.Chapter;
  const Lesson = Models.Lesson;
  const Payment = Models.Payment;
  const Purchase = Models.Purchase;
  const Analytics = Models.Analytics;
  const ChatSession = Models.ChatSession;
  const AiChat = Models.AiChat;

  const categoryCount = await Category.countDocuments();
  if (categoryCount === 0) {
    logger.info("Seeding initial mock categories...");
    const techCategory = await Category.create({
      name: "Technology",
      slug: "technology",
      description: "Modern software development and design",
    });
    const blockCategory = await Category.create({
      name: "Blockchain",
      slug: "blockchain",
      description: "Decentralized applications and smart contracts",
    });

    const adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      logger.info("Seeding initial mock courses and lessons...");
      
      const course1 = await Course.create({
        title: "Introduction to Algorand Smart Contracts",
        slug: "intro-algorand-smart-contracts",
        description: "Learn how to write and deploy PyTeal smart contracts on Algorand.",
        categoryId: (blockCategory as any)._id,
        level: CourseLevel.BEGINNER,
        duration: 120,
        tags: ["Algorand", "Python", "Blockchain"],
        rating: 4.8,
        totalRatings: 12,
        totalStudents: 45,
        totalLessons: 4,
        price: 25,
        currency: "USDC",
        isPublished: true,
        createdBy: (adminUser as any)._id,
      });

      const course2 = await Course.create({
        title: "Full Stack Development with Vite and React",
        slug: "full-stack-vite-react",
        description: "Build robust frontend web apps using modern React ecosystem.",
        categoryId: (techCategory as any)._id,
        level: CourseLevel.INTERMEDIATE,
        duration: 180,
        tags: ["React", "Vite", "TypeScript"],
        rating: 4.6,
        totalRatings: 8,
        totalStudents: 32,
        totalLessons: 3,
        price: 15,
        currency: "USDC",
        isPublished: true,
        createdBy: (adminUser as any)._id,
      });

      const ch1 = await Chapter.create({
        courseId: (course1 as any)._id,
        title: "Algorand Fundamentals",
        order: 1,
      });
      await Lesson.create({
        chapterId: (ch1 as any)._id,
        courseId: (course1 as any)._id,
        title: "What is Algorand?",
        content: "Algorand is a pure proof-of-stake blockchain network...",
        duration: 15,
        order: 1,
      });
      await Lesson.create({
        chapterId: (ch1 as any)._id,
        courseId: (course1 as any)._id,
        title: "Account Creation and Assets",
        content: "How to manage keys, addresses, and ASAs on Algorand.",
        duration: 25,
        order: 2,
      });

      const ch2 = await Chapter.create({
        courseId: (course1 as any)._id,
        title: "PyTeal Basics",
        order: 2,
      });
      await Lesson.create({
        chapterId: (ch2 as any)._id,
        courseId: (course1 as any)._id,
        title: "Writing PyTeal Contracts",
        content: "Learn how PyTeal compiler translates Python to TEAL bytecode.",
        duration: 35,
        order: 1,
      });

      const student1 = await User.create({
        fullName: "Rahul Kumar",
        email: "rahul@gmail.com",
        password: "Password123!",
        role: UserRole.LEARNER,
        isVerified: true,
        totalLearningHours: 24,
      });

      const student2 = await User.create({
        fullName: "Sneha Patel",
        email: "sneha@gmail.com",
        password: "Password123!",
        role: UserRole.LEARNER,
        isVerified: true,
        totalLearningHours: 15,
      });

      const p1 = await Payment.create({
        userId: (student1 as any)._id,
        courseId: (course1 as any)._id,
        amount: 25,
        currency: "USDC",
        blockchain: "Algorand",
        transactionHash: "TX_ALGO_10023948712398471293847",
        paymentMethod: PaymentMethod.ALGORAND,
        paymentStatus: PaymentStatus.COMPLETED,
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });

      await Purchase.create({
        userId: (student1 as any)._id,
        courseId: (course1 as any)._id,
        paymentId: (p1 as any)._id,
        transactionHash: "TX_ALGO_10023948712398471293847",
        amount: 25,
        currency: "USDC",
        purchaseStatus: PurchaseStatus.COMPLETED,
        purchasedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });

      const p2 = await Payment.create({
        userId: (student2 as any)._id,
        courseId: (course2 as any)._id,
        amount: 15,
        currency: "USDC",
        blockchain: "Algorand",
        transactionHash: "TX_X402_77394812398471923847",
        paymentMethod: PaymentMethod.X402,
        paymentStatus: PaymentStatus.COMPLETED,
        x402Reference: "X402-REF-992348",
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });

      await Purchase.create({
        userId: (student2 as any)._id,
        courseId: (course2 as any)._id,
        paymentId: (p2 as any)._id,
        transactionHash: "TX_X402_77394812398471923847",
        amount: 15,
        currency: "USDC",
        purchaseStatus: PurchaseStatus.COMPLETED,
        purchasedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      });

      const session = await ChatSession.create({
        userId: (student1 as any)._id,
        title: "PyTeal Compile Errors",
      });

      await AiChat.create({
        sessionId: (session as any)._id,
        userId: (student1 as any)._id,
        role: AiChatRole.USER,
        message: "Why does my PyTeal contract fail compilation with a TealTypeError?",
        tokens: 42,
        modelName: "Llama 3",
      });

      await AiChat.create({
        sessionId: (session as any)._id,
        userId: (student1 as any)._id,
        role: AiChatRole.ASSISTANT,
        message: "TealTypeError occurs when there is a mismatch between the expected and actual TEAL stack type (Uint64 vs Bytes). Check your Expr definition...",
        tokens: 154,
        modelName: "Llama 3",
      });

      await Analytics.create({
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dailyUsers: 14,
        revenue: 40,
        coursesPurchased: 2,
        aiRequests: 35,
        quizAttempts: 8,
        learningHours: 42,
      });

      await Analytics.create({
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dailyUsers: 22,
        revenue: 15,
        coursesPurchased: 1,
        aiRequests: 58,
        quizAttempts: 12,
        learningHours: 64,
      });

      await Analytics.create({
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dailyUsers: 28,
        revenue: 0,
        coursesPurchased: 0,
        aiRequests: 74,
        quizAttempts: 15,
        learningHours: 85,
      });

      await Analytics.create({
        date: new Date(),
        dailyUsers: 34,
        revenue: 25,
        coursesPurchased: 1,
        aiRequests: 92,
        quizAttempts: 21,
        learningHours: 110,
      });
      
      logger.info("Mock database seeding completed!");
    }
  }
}