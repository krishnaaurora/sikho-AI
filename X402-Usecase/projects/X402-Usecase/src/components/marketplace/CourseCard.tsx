import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RatingStars from './RatingStars';
import DifficultyBadge from './DifficultyBadge';
import DurationBadge from './DurationBadge';
import type { Course } from '../../types';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const getBadgeStyle = () => {
    if (!course.badge) return null;
    
    const badgeColors: Record<string, string> = {
      'Best Seller': 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white',
      'Trending': 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
      'New': 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
      'AI Pick': 'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
    };

    return (
      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${badgeColors[course.badge] || 'bg-gray-800 text-white'}`}>
        {course.badge}
      </span>
    );
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="group bg-white dark:bg-slate-905 rounded-2xl shadow-sm hover:shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-850 transition-all duration-300"
    >
      <Link to={`/courses/${course._id}`} className="block">
        <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <svg className="w-12 h-12 text-slate-350 dark:text-slate-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v11.494m5.75-5.747H6.25" />
              </svg>
            </div>
          )}
          {getBadgeStyle()}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <DifficultyBadge level={course.level} />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{course.language}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {course.shortDescription && (
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
              {course.shortDescription}
            </p>
          )}

          <div className="flex items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1">
              <RatingStars rating={course.rating} size="sm" />
              <span className="text-slate-500 dark:text-slate-450 ml-1 font-semibold">({course.totalRatings.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{course.totalStudents.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{course.totalLessons} lessons</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850/50 pt-4 mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {course.price === 0 ? 'Free' : `${course.currency} ${course.price}`}
            </div>
            <DurationBadge duration={course.duration} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CourseCard;
