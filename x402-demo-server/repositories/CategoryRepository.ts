import Category, { ICategory } from "../models/Category.model";

class CategoryRepository {
  async findAll(): Promise<ICategory[]> {
    return Category.find({ isDeleted: false }).sort({ name: 1 });
  }

  async findById(id: string): Promise<ICategory | null> {
    return Category.findOne({ _id: id, isDeleted: false });
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug, isDeleted: false });
  }
}

export default new CategoryRepository();
