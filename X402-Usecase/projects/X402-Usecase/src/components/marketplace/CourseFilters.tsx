import React, { useEffect, useState } from 'react';
import { courseApi } from '../../utils/api';
import type { Category, GetCoursesQuery, CourseLevel } from '../../types';

interface CourseFiltersProps {
  filters: GetCoursesQuery;
  onFiltersChange: (filters: GetCoursesQuery) => void;
}

const CourseFilters: React.FC<CourseFiltersProps> = ({ filters, onFiltersChange }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const response = await courseApi.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (key: keyof GetCoursesQuery, value: any) => {
    const newFilters = { ...filters, [key]: value === '' ? undefined : value, page: 1 };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({ page: 1, limit: 12 });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear all
        </button>
      </div>

      {/* Category */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
        <select
          value={filters.category || ''}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Level */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Level</h4>
        <select
          value={filters.level || ''}
          onChange={(e) => handleChange('level', e.target.value as CourseLevel)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
        >
          <option value="">All Levels</option>
          <option value={CourseLevel.BEGINNER}>Beginner</option>
          <option value={CourseLevel.INTERMEDIATE}>Intermediate</option>
          <option value={CourseLevel.ADVANCED}>Advanced</option>
        </select>
      </div>

      {/* Language */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Language</h4>
        <select
          value={filters.language || ''}
          onChange={(e) => handleChange('language', e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
        >
          <option value="">All Languages</option>
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Minimum Rating</h4>
        <select
          value={filters.minRating || ''}
          onChange={(e) => handleChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
        >
          <option value="">Any Rating</option>
          <option value="4">4.0+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
          <option value="3">3.0+ Stars</option>
        </select>
      </div>

      {/* Sort By */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Sort By</h4>
        <select
          value={filters.sortBy || 'newest'}
          onChange={(e) => handleChange('sortBy', e.target.value as any)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>
    </div>
  );
};

export default CourseFilters;
