import mongoose, { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export enum UserRole {
  LEARNER = "learner",
  ADMIN = "admin",
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  profileImage?: string;
  walletAddress?: string;
  purchasedCourses: Types.ObjectId[];
  completedLessons: Types.ObjectId[];
  certificates: Types.ObjectId[];
  learningStreak: number;
  totalLearningHours: number;
  isVerified: boolean;
  isActive: boolean;
  educationLevel?: string;
  interests?: string[];
  currentSkills?: string[];
  targetRole?: string;
  experienceLevel?: string;
  preferredLanguage?: string;
  whatAreYouHereToDo?: string[];
  resumeText?: string;
  githubUrl?: string;
  completedChapters?: string[];
  previousResults?: Array<{ topic: string; score: number; date: Date }>;
  lastLogin?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  collegeUniversity?: string;
  degree?: string;
  graduationYear?: string;
  currentYearSemester?: string;
  careerJourneyState?: string;
  preferredIndustry?: string;
  targetCompanies?: string[];
  projects?: any;
  internships?: any;
  hackathons?: any;
  certifications?: any;
  achievements?: any;
  learningTimePerDay?: string;
  preferredLearningTime?: string;
  country?: string;
  onboardingCompleted?: boolean;
  specialization?: string;
  preferredLocations?: string[];
  targetTimeline?: string;
  expectedSalary?: string;
  careerDiscoveryAnswers?: any;
  openSource?: any;
  skillProficiencies?: any;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
      default: UserRole.LEARNER,
    },
    profileImage: {
      type: String,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    purchasedCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    completedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    certificates: [
      {
        type: Schema.Types.ObjectId,
        ref: "Certificate",
      },
    ],
    learningStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLearningHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    educationLevel: {
      type: String,
      trim: true,
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    currentSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    targetRole: {
      type: String,
      trim: true,
    },
    experienceLevel: {
      type: String,
      trim: true,
    },
    preferredLanguage: {
      type: String,
      trim: true,
    },
    whatAreYouHereToDo: [
      {
        type: String,
        trim: true,
      },
    ],
    resumeText: {
      type: String,
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    completedChapters: [
      {
        type: String,
      },
    ],
    previousResults: [
      {
        topic: String,
        score: Number,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastLogin: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    collegeUniversity: { type: String, trim: true },
    degree: { type: String, trim: true },
    graduationYear: { type: String, trim: true },
    currentYearSemester: { type: String, trim: true },
    careerJourneyState: { type: String, trim: true },
    preferredIndustry: { type: String, trim: true },
    targetCompanies: [{ type: String, trim: true }],
    projects: { type: Schema.Types.Mixed },
    internships: { type: Schema.Types.Mixed },
    hackathons: { type: Schema.Types.Mixed },
    certifications: { type: Schema.Types.Mixed },
    achievements: { type: Schema.Types.Mixed },
    learningTimePerDay: { type: String, trim: true },
    preferredLearningTime: { type: String, trim: true },
    country: { type: String, trim: true },
    onboardingCompleted: { type: Boolean, default: false },
    specialization: { type: String, trim: true },
    preferredLocations: [{ type: String, trim: true }],
    targetTimeline: { type: String, trim: true },
    expectedSalary: { type: String, trim: true },
    careerDiscoveryAnswers: { type: Schema.Types.Mixed },
    openSource: { type: Schema.Types.Mixed },
    skillProficiencies: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ isDeleted: 1 });

const User = model<IUser>("User", UserSchema);
export default User;
