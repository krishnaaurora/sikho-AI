import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { courseApi } from '../utils/api';
import CourseGrid from '../components/marketplace/CourseGrid';
import CourseFilters from '../components/marketplace/CourseFilters';
import Pagination from '../components/marketplace/Pagination';
import type { GetCoursesQuery, Course, PaginationInfo, Category } from '../types';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<GetCoursesQuery>({ page: 1, limit: 12 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchCourses();
    }
  }, [slug, filters]);

  const fetchCourses = async () => {
    if (!slug) return;
    setIsLoading(true);
    try {
      const response = await courseApi.getCoursesByCategory(slug, filters);
      setCourses(response.data.data);
      setCategory(response.data.category);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch category courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: GetCoursesQuery) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (!isLoading && !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {category?.name || 'Loading...'}
          </h1>
          {category?.description && (
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <CourseFilters filters={filters} onFiltersChange={handleFiltersChange} />
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{pagination.total}</span> courses in {category?.name}
              </p>
            </div>

            <CourseGrid courses={courses} isLoading={isLoading} emptyMessage={`No courses found in ${category?.name}`} />

            {pagination.totalPages > 1 && (
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
