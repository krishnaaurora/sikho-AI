import React from 'react';
import CourseCard from './CourseCard';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';
import type { Course } from '../../types';

interface CourseGridProps {
  courses: Course[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const CourseGrid: React.FC<CourseGridProps> = ({ 
  courses, 
  isLoading = false, 
  emptyMessage = "No courses found" 
}) => {
  if (isLoading) {
    return <LoadingSkeleton count={9} />;
  }

  if (courses.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
};

export default CourseGrid;
