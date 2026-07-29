import Purchase, { IPurchase } from "../models/Purchase.model";
import { Types } from "mongoose";
import { PurchaseStatus } from "../models/Purchase.model";

class PurchaseRepository {
  async findByUserAndCourse(
    userId: string | Types.ObjectId,
    courseId: string | Types.ObjectId
  ): Promise<IPurchase | null> {
    return Purchase.findOne({
      userId,
      courseId,
      purchaseStatus: PurchaseStatus.COMPLETED
    });
  }

  async findByUser(userId: string | Types.ObjectId): Promise<IPurchase[]> {
    return Purchase.find({
      userId, purchaseStatus: PurchaseStatus.COMPLETED });
  }
}

export default new PurchaseRepository();
