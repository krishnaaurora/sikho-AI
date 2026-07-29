import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseApi } from '../utils/api';
import CourseGrid from '../components/marketplace/CourseGrid';
import CourseFilters from '../components/marketplace/CourseFilters';
import Pagination from '../components/marketplace/Pagination';
import SearchBar from '../components/marketplace/SearchBar';
import type { GetCoursesQuery, Course, PaginationInfo } from '../types';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<GetCoursesQuery & { q: string }>({ q, page: 1, limit: 12 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFilters(prev => ({ ...prev, q, page: 1 }));
  }, [q]);

  useEffect(() => {
    if (filters.q) {
      fetchCourses();
    }
  }, [filters]);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await courseApi.searchCourses(filters);
      setCourses(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to search courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: GetCoursesQuery) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Search Results
          </h1>
          <p className="text-xl text-purple-100 text-center mb-8">
            Showing results for "{q}"
          </p>
          <div className="flex justify-center">
            <SearchBar initialQuery={q} />
          </div>
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
                <span className="font-semibold text-gray-900">{pagination.total}</span> results found
              </p>
            </div>

            <CourseGrid courses={courses} isLoading={isLoading} emptyMessage={`No courses found for "${q}"`} />

            {pagination.totalPages > 1 && (
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
