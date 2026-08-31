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
  [key: string]: any;
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
    educationLevel: user.educationLevel,
    interests: user.interests,
    currentSkills: user.currentSkills,
    targetRole: user.targetRole,
    experienceLevel: user.experienceLevel,
    preferredLanguage: user.preferredLanguage,
    whatAreYouHereToDo: user.whatAreYouHereToDo,
    resumeText: user.resumeText,
    collegeUniversity: user.collegeUniversity,
    degree: user.degree,
    graduationYear: user.graduationYear,
    currentYearSemester: user.currentYearSemester,
    careerJourneyState: user.careerJourneyState,
    preferredIndustry: user.preferredIndustry,
    targetCompanies: user.targetCompanies,
    projects: user.projects,
    internships: user.internships,
    hackathons: user.hackathons,
    certifications: user.certifications,
    achievements: user.achievements,
    learningTimePerDay: user.learningTimePerDay,
    preferredLearningTime: user.preferredLearningTime,
    country: user.country,
    onboardingCompleted: user.onboardingCompleted,
    specialization: user.specialization,
    preferredLocations: user.preferredLocations,
    targetTimeline: user.targetTimeline,
    expectedSalary: user.expectedSalary,
    careerDiscoveryAnswers: user.careerDiscoveryAnswers,
    openSource: user.openSource,
    skillProficiencies: user.skillProficiencies,
  };
};
