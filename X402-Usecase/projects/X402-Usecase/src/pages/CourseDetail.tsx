import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '../utils/api';
import RatingStars from '../components/marketplace/RatingStars';
import DifficultyBadge from '../components/marketplace/DifficultyBadge';
import LoadingSkeleton from '../components/marketplace/LoadingSkeleton';
import type { CourseDetail, Chapter, Review, Course } from '../types';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'pricing'>('overview');

  useEffect(() => {
    if (id) {
      fetchCourse(id);
    }
  }, [id]);

  const fetchCourse = async (courseId: string) => {
    setIsLoading(true);
    try {
      const response = await courseApi.getCourseById(courseId);
      setCourse(response.data);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getMinChapterPrice = (chapters: Chapter[]) => {
    if (!chapters.length) return 0;
    return Math.min(...chapters.map(ch => ch.price));
  };

  const getRatingDistribution = (reviews: Review[]) => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[5 - review.rating]++;
      }
    });
    const total = reviews.length || 1;
    return distribution.map(count => (count / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton count={1} />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <Link to="/courses" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const chapters = course.chapters || [];
  const reviews = course.reviews || [];
  const skills = course.skills || [];
  const requirements = course.requirements || [];
  const whoIsThisFor = course.whoIsThisFor || [];
  const relatedCourses = course.relatedCourses || [];
  const courseIncludes = course.courseIncludes || [];

  const minChapterPrice = getMinChapterPrice(chapters);
  const ratingDistribution = getRatingDistribution(reviews);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <Link to="/courses" className="inline-flex items-center gap-2 text-blue-300 hover:text-white mb-6 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to courses
              </Link>

              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <DifficultyBadge level={course.level} />
                <span className="text-gray-300">{course.language}</span>
                {course.badge && (
                  <span className="px-3 py-1 bg-yellow-500 text-yellow-900 rounded-full text-xs font-bold">
                    {course.badge}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6">{course.title}</h1>

              {course.shortDescription && (
                <p className="text-xl text-gray-300 mb-6">{course.shortDescription}</p>
              )}

              <div className="flex items-center gap-6 mb-8 flex-wrap">
                <div className="flex items-center gap-2">
                  <RatingStars rating={course.rating} size="md" />
                  <span className="text-2xl font-bold">{course.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({course.totalReviews.toLocaleString()} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{course.totalStudents.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDuration(course.duration)}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                  {course.instructor.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{course.instructor.fullName}</p>
                  <p className="text-gray-400 text-sm">Instructor</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-8">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full aspect-video object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {course.price === 0 ? 'Free' : `${course.currency} ${course.price}`}
                  </div>
                  {minChapterPrice > 0 && (
                    <p className="text-sm text-gray-500 mb-4">
                      or unlock chapters starting from {course.currency} {minChapterPrice}
                    </p>
                  )}
                  
                  {course.isPurchased ? (
                    <button className="w-full py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors mb-4">
                      Continue Learning
                    </button>
                  ) : (
                    <>
                      <button className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors mb-3">
                        Purchase Entire Course
                      </button>
                      <button className="w-full py-4 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-colors mb-4">
                        Unlock Individual Chapters
                      </button>
                    </>
                  )}

                  <div className="space-y-3">
                    {courseIncludes.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8 border-b border-gray-200 mb-8 overflow-x-auto">
          {['overview', 'curriculum', 'reviews', 'pricing'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-4 px-2 font-semibold text-sm transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Description */}
                    <section className="bg-white rounded-2xl shadow-sm p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Course</h2>
                      {course.description ? (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                      ) : (
                        <p className="text-gray-500">No description available</p>
                      )}
                    </section>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <section className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills You'll Learn</h2>
                        <div className="flex flex-wrap gap-3">
                          {skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Requirements */}
                    {requirements.length > 0 && (
                      <section className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          {requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Who This is For */}
                    {whoIsThisFor.length > 0 && (
                      <section className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Who This Course Is For</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          {whoIsThisFor.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Related Courses */}
                    {relatedCourses.length > 0 && (
                      <section className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Courses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {relatedCourses.map(related => (
                            <Link
                              key={related._id}
                              to={`/courses/${related._id}`}
                              className="group block border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                            >
                              {related.thumbnail && (
                                <img
                                  src={related.thumbnail}
                                  alt={related.title}
                                  className="w-full h-40 object-cover"
                                />
                              )}
                              <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                  {related.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <RatingStars rating={related.rating} size="sm" />
                                  <span>{related.rating.toFixed(1)}</span>
                                  <span>({related.totalRatings.toLocaleString()})</span>
                                </div>
                                <p className="text-lg font-bold text-gray-900 mt-2">
                                  {related.price === 0 ? 'Free' : `${related.currency} ${related.price}`}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {activeTab === 'curriculum' && (
                  <div className="space-y-4">
                    {chapters.map(chapter => (
                      <div
                        key={chapter._id}
                        className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                      >
                        <button
                          onClick={() => toggleChapter(chapter._id)}
                          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className="flex items-center gap-4">
                            <svg
                              className={`w-5 h-5 text-gray-500 transition-transform ${expandedChapters.has(chapter._id) ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <div>
                              <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{chapter.totalLessons} lessons</span>
                                {chapter.duration && <span>{formatDuration(chapter.duration)}</span>}
                              </div>
                            </div>
                          </div>
                        </button>

                        {expandedChapters.has(chapter._id) && (
                          <div className="px-6 py-4 border-t border-gray-200">
                            {chapter.description && (
                              <p className="text-gray-600 text-sm mb-4">{chapter.description}</p>
                            )}
                            <div className="space-y-2">
                              {(chapter.lessons || []).map(lesson => (
                                <div
                                  key={lesson._id}
                                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {lesson.isFree ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      )}
                                    </svg>
                                    <span className="text-gray-700">{lesson.title}</span>
                                    {lesson.isFree && (
                                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                        Free Preview
                                      </span>
                                    )}
                                  </div>
                                  {lesson.duration && (
                                    <span className="text-sm text-gray-500">{formatDuration(lesson.duration)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-8">
                    {/* Rating Summary */}
                    <section className="bg-white rounded-2xl shadow-sm p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center">
                          <div className="text-6xl font-bold text-gray-900">{course.averageRating.toFixed(1)}</div>
                          <div className="mt-2">
                            <RatingStars rating={course.averageRating} size="lg" />
                          </div>
                          <p className="text-gray-500 mt-2">{course.totalReviews} reviews</p>
                        </div>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((star, index) => (
                            <div key={star} className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 w-8">{star} star</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-400"
                                  style={{ width: `${ratingDistribution[index]}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500 w-8 text-right">
                                {reviews.filter(r => r.rating === star).length}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* Review List */}
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review._id} className="bg-white rounded-2xl shadow-sm p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {review.userId.fullName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{review.userId.fullName}</h4>
                                <div className="flex items-center gap-2">
                                  <RatingStars rating={review.rating} size="sm" />
                                </div>
                              </div>
                              {review.title && <h5 className="font-medium text-gray-800 mb-1">{review.title}</h5>}
                              {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                  Helpful ({review.helpfulCount})
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {reviews.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
                          No reviews yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'pricing' && (
                  <div className="space-y-4">
                    <section className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chapter Pricing</h2>
                      <div className="space-y-3">
                        {chapters.map(chapter => (
                          <div key={chapter._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                              <p className="text-sm text-gray-500">{chapter.totalLessons} lessons</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">{chapter.currency} {chapter.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
