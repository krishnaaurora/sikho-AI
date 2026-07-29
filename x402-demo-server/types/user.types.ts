import { IUser } from "../models/User.model";

export interface UserResponse {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  bio?: string;
  profileImage?: string;
  walletAddress?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const toUserResponse = (user: any): UserResponse => {
  return {
    _id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    bio: user.bio,
    profileImage: user.profileImage,
    walletAddress: user.walletAddress,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
