import { Types } from "mongoose";
import Course, { CourseLevel } from "../../models/Course.model";
import Chapter from "../../models/Chapter.model";
import Lesson from "../../models/Lesson.model";
import Purchase, { PurchaseStatus } from "../../models/Purchase.model";
import Category from "../../models/Category.model";
import { AppError } from "../../utils/errors";
import { generateCourseChapters } from "../ai";

// Create a custom course for the learner
export const createCustomCourseService = async (userId: string, topic: string) => {
  // Get or create a default category
  // @ts-ignore
  let category = await Category.findOne({ name: "Custom Courses" });
  if (!category) {
    // @ts-ignore
    category = await Category.create({
      name: "Custom Courses",
      slug: "custom-courses",
      description: "AI-generated custom courses for learners",
    });
  }

  // Generate AI course structure
  const aiCourse = await generateCourseChapters(topic, 15);

  // Create the course
  // @ts-ignore
  const course = await Course.create({
    title: topic,
    slug: `${topic.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    description: aiCourse.courseDescription,
    categoryId: category._id,
    level: CourseLevel.BEGINNER,
    language: "English",
    tags: [topic, "AI-Generated", "Custom"],
    createdBy: new Types.ObjectId(userId),
    isPublished: true,
    totalLessons: aiCourse.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0),
  });

  // Create chapters and lessons
  const chapters: any[] = [];
  const lessons: any[] = [];
  for (let i = 0; i < aiCourse.chapters.length; i++) {
    const aiChapter = aiCourse.chapters[i];
    // @ts-ignore
    const chapter = await Chapter.create({
      courseId: course._id,
      title: aiChapter.title,
      order: i + 1,
      description: aiChapter.description,
      totalLessons: aiChapter.lessons.length,
      duration: 15 + aiChapter.lessons.length * 10,
      price: 0.02,
      currency: "USDC",
    });
    chapters.push(chapter);

    // Create lessons for this chapter
    for (let j = 0; j < aiChapter.lessons.length; j++) {
      // @ts-ignore
      const lesson = await Lesson.create({
        chapterId: chapter._id,
        courseId: course._id,
        title: aiChapter.lessons[j].title,
        description: `Learn about ${aiChapter.lessons[j].title}`,
        content: aiChapter.lessons[j].content,
        duration: 10 + Math.floor(Math.random() * 20),
        order: j + 1,
        isFree: i === 0 && j < 2, // First 2 lessons free
      });
      lessons.push(lesson);
    }
  }

  return { course, chapters, lessons };
};

// Get learner's courses
export const getLearnerCoursesService = async (userId: string) => {
  // Get all courses created by the learner
  // @ts-ignore
  const courses = await Course.find({
    createdBy: new Types.ObjectId(userId),
    isDeleted: false,
  }).sort({ createdAt: -1 });

  // Get all purchases for this learner to check unlocked chapters
  // @ts-ignore
  const purchases = await Purchase.find({
    userId: new Types.ObjectId(userId),
    purchaseStatus: PurchaseStatus.COMPLETED,
  });

  // For each course, get chapters and mark unlocked ones
    const coursesWithChapters = await Promise.all(
      courses.map(async (course: any) => {
        // @ts-ignore
        const chapters = await Chapter.find({
          courseId: course._id,
          isDeleted: false,
        }).sort({ order: 1 });

        // @ts-ignore
        const allLessons = await Lesson.find({
          courseId: course._id,
          isDeleted: false,
        }).sort({ order: 1 });

        const chaptersWithUnlocked = chapters.map((chapter: any) => {
          const isUnlocked = purchases.some(
            (p: any) => p.chapterId && p.chapterId.toString() === chapter._id.toString()
          );
          
          const chapterLessons = allLessons
            .filter((l: any) => l.chapterId.toString() === chapter._id.toString())
            .map((l: any) => {
              const lessonObj = l.toObject();
              if (!isUnlocked && !lessonObj.isFree) {
                delete lessonObj.content;
              }
              return lessonObj;
            });

          return { ...chapter.toObject(), isUnlocked, lessons: chapterLessons };
        });

        return { ...course.toObject(), chapters: chaptersWithUnlocked };
      })
    );

  return coursesWithChapters;
};

// Unlock a chapter (purchase)
export const unlockChapterService = async (
  userId: string,
  chapterId: string,
  transactionHash: string
) => {
  // @ts-ignore
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    throw new AppError("Chapter not found", 404);
  }

  // Check if already purchased
  // @ts-ignore
  const existingPurchase = await Purchase.findOne({
    userId: new Types.ObjectId(userId),
    // @ts-ignore
    chapterId: new Types.ObjectId(chapterId),
    purchaseStatus: PurchaseStatus.COMPLETED,
  });
  if (existingPurchase) {
    throw new AppError("Chapter already unlocked", 400);
  }

  // Create purchase
  // @ts-ignore
  const purchase = await Purchase.create({
    userId: new Types.ObjectId(userId),
    courseId: chapter.courseId,
    // @ts-ignore
    chapterId: new Types.ObjectId(chapterId),
    amount: chapter.price,
    currency: chapter.currency,
    transactionHash,
    purchaseStatus: PurchaseStatus.COMPLETED,
  });

  return purchase;
};
