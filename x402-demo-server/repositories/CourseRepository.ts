import Course, { ICourse } from "../models/Course.model";
import { Types } from "mongoose";

class CourseRepository {
  async findAll(
    filter: any = {},
    options: { skip?: number; limit?: number; sort?: any } = {}
  ): Promise<{ courses: ICourse[]; total: number }> {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    
    const [courses, total] = await Promise.all([
      Course.find({ ...filter, isDeleted: false, isPublished: true })
        .populate("categoryId", "name slug")
        .populate("createdBy", "fullName email profileImage")
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Course.countDocuments({ ...filter, isDeleted: false, isPublished: true })
    ]);

    return { courses, total };
  }

  async findById(id: string | Types.ObjectId): Promise<ICourse | null> {
    return Course.findOne({ 
      _id: id, 
      isDeleted: false, 
      isPublished: true 
    })
      .populate("categoryId", "name slug image description")
      .populate("createdBy", "fullName email profileImage bio");
  }

  async findBySlug(slug: string): Promise<ICourse | null> {
    return Course.findOne({ 
      slug, 
      isDeleted: false, 
      isPublished: true 
    })
      .populate("categoryId", "name slug image description")
      .populate("createdBy", "fullName email profileImage bio");
  }

  async search(
    query: string,
    filter: any = {},
    options: { skip?: number; limit?: number; sort?: any } = {}
  ): Promise<{ courses: ICourse[]; total: number }> {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;

    const searchFilter = {
      ...filter,
      isDeleted: false,
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { shortDescription: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ],
    };

    const [courses, total] = await Promise.all([
      Course.find(searchFilter)
        .populate("categoryId", "name slug")
        .populate("createdBy", "fullName email profileImage")
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Course.countDocuments(searchFilter),
    ]);

    return { courses, total };
  }

  async findPopular(options: { skip?: number; limit?: number } = {}): Promise<{ courses: ICourse[]; total: number }> {
    const { skip = 0, limit = 10 } = options;
    return this.findAll({}, { skip, limit, sort: { totalStudents: -1, rating: -1 } });
  }

  async findTrending(options: { skip?: number; limit?: number } = {}): Promise<{ courses: ICourse[]; total: number }> {
    const { skip = 0, limit = 10 } = options;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.findAll(
      { createdAt: { $gte: sevenDaysAgo } }, 
      { skip, limit, sort: { totalStudents: -1, createdAt: -1 } }
    );
  }

  async findRecommended(options: { skip?: number; limit?: number } = {}): Promise<{ courses: ICourse[]; total: number }> {
    const { skip = 0, limit = 10 } = options;
    return this.findAll({}, { skip, limit, sort: { rating: -1, totalRatings: -1 } });
  }

  async findByCategorySlug(
    categorySlug: string,
    filter: any = {},
    options: { skip?: number; limit?: number; sort?: any } = {}
  ): Promise<{ courses: ICourse[]; total: number }> {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return this.findAll({ ...filter }, { skip, limit, sort });
  }
}

export default new CourseRepository();
