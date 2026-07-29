import Chapter, { IChapter } from "../models/Chapter.model";
import { Types } from "mongoose";

class ChapterRepository {
  async findByCourseId(courseId: string | Types.ObjectId): Promise<IChapter[]> {
    return Chapter.find({ courseId, isDeleted: false }).sort({ order: 1 });
  }
}

export default new ChapterRepository();
