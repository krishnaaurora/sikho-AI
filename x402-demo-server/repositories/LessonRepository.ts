import Lesson, { ILesson } from "../models/Lesson.model";
import { Types } from "mongoose";

class LessonRepository {
  async findByChapterId(chapterId: string | Types.ObjectId): Promise<ILesson[]> {
    return Lesson.find({ 
      chapterId, isDeleted: false })
      .sort({ order: 1 });
  }

  async findByCourseId(courseId: string | Types.ObjectId): Promise<ILesson[]> {
    return Lesson.find({ 
      courseId, isDeleted: false })
      .sort({ order: 1 });
  }
}

export default new LessonRepository();
