import Review, { IReview } from "../models/Review.model";
import { Types } from "mongoose";

class ReviewRepository {
  async findByCourseId(courseId: string | Types.ObjectId): Promise<IReview[]> {
    return Review.find({ 
      courseId, 
      isDeleted: false 
    })
      .populate("userId", "fullName profileImage");
  }

  async getRatingDistribution(courseId: string | Types.ObjectId) {
    return Review.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId), isDeleted: false } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      }
    ]);
  }

  async getAverageRating(courseId: string | Types.ObjectId) {
    const result = await Review.aggregate([
      { $match: { courseId: new Types.ObjectId(courseId), isDeleted: false } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    return result[0] || { averageRating: 0, totalReviews: 0 };
  }
}

export default new ReviewRepository();
