import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import type { 
  Course, 
  CourseDetail, 
  Category, 
  PaginatedResponse, 
  ApiResponse, 
  GetCoursesQuery, 
  SearchCoursesQuery 
} from '../types';

// Store access token in localStorage
let accessToken: string | null = localStorage.getItem('accessToken');

function setAccessToken(token: string) {
  accessToken = token;
  localStorage.setItem('accessToken', token);
}

function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('accessToken');
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  // Add access token to headers if available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (_) {
      // ignore JSON parsing errors
    }
    if (response.status === 401) {
      errorMessage = "Wrong password, email, or user not registered.";
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const authApi = {
  async register(data: { fullName: string; email: string; password: string; confirmPassword: string }) {
    const response = await fetchAPI<ApiResponse<any>>(API_ENDPOINTS.AUTH_REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response;
  },

  async login(data: { email: string; password: string }) {
    const response = await fetchAPI<ApiResponse<{ accessToken: string; user: any }>>(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success && response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response;
  },

  async logout() {
    clearAccessToken();
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.AUTH_LOGOUT, {
      method: 'POST',
    });
  },

  async getCurrentUser() {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.AUTH_ME);
  },
  async updateProfile(data: any) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.AUTH_PROFILE_UPDATE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export const courseApi = {
  async getCourses(query?: GetCoursesQuery): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_ENDPOINTS.COURSES}${params.toString() ? `?${params}` : ''}`;
    return fetchAPI(url);
  },

  async getCourseById(id: string): Promise<ApiResponse<CourseDetail>> {
    return fetchAPI(API_ENDPOINTS.COURSE_DETAIL(id));
  },

  async getCourseBySlug(slug: string): Promise<ApiResponse<CourseDetail>> {
    return fetchAPI(API_ENDPOINTS.COURSE_DETAIL_SLUG(slug));
  },

  async searchCourses(query: SearchCoursesQuery): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const url = `${API_ENDPOINTS.COURSE_SEARCH}?${params}`;
    return fetchAPI(url);
  },

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return fetchAPI(API_ENDPOINTS.COURSE_CATEGORIES);
  },

  async getCoursesByCategory(slug: string, query?: GetCoursesQuery): Promise<ApiResponse<{ category: Category } & PaginatedResponse<Course>>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_ENDPOINTS.COURSE_CATEGORY(slug)}${params.toString() ? `?${params}` : ''}`;
    return fetchAPI(url);
  },

  async getPopularCourses(query?: GetCoursesQuery): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_ENDPOINTS.COURSE_POPULAR}${params.toString() ? `?${params}` : ''}`;
    return fetchAPI(url);
  },

  async getTrendingCourses(query?: GetCoursesQuery): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_ENDPOINTS.COURSE_TRENDING}${params.toString() ? `?${params}` : ''}`;
    return fetchAPI(url);
  },

  async getRecommendedCourses(query?: GetCoursesQuery): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const url = `${API_ENDPOINTS.COURSE_RECOMMENDED}${params.toString() ? `?${params}` : ''}`;
    return fetchAPI(url);
  },
};

export const learnerApi = {
  async createCourse(topic: string) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.LEARNER_COURSES, {
      method: 'POST',
      body: JSON.stringify({ topic }),
    });
  },

  async getCourses() {
    return fetchAPI<ApiResponse<any[]>>(API_ENDPOINTS.LEARNER_COURSES);
  },

  async unlockChapter(chapterId: string, transactionHash: string) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.LEARNER_UNLOCK_CHAPTER, {
      method: 'POST',
      body: JSON.stringify({ chapterId, transactionHash }),
    });
  },

  async routeIntent(query: string) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.AI_ROUTE_INTENT, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
};

export const adminApi = {
  async getStats() {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/stats`);
  },
  async getTransactions() {
    return fetchAPI<ApiResponse<any[]>>(`${API_BASE_URL}/admin/transactions`);
  },
  async getUsers() {
    return fetchAPI<ApiResponse<any[]>>(`${API_BASE_URL}/admin/users`);
  },
  async addCourse(data: { title: string; description?: string; level?: string; price: number; categoryName?: string }) {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/courses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async addLesson(data: { courseId: string; title: string; content: string; duration?: number }) {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async createQuiz(data: { lessonId: string; title: string; questions: any[] }) {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/quizzes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const analyticsApi = {
  async getOverview() {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/analytics/overview`);
  },
};

export const aiApi = {
  async explain(data: {
    query: string;
    learningStyle: string;
    depth: string;
    examples: string;
    language: string;
  }) {
    return fetchAPI<ApiResponse<{
      topic: string;
      preferences: {
        learningStyle: string;
        depth: string;
        examples: string;
        language: string;
      };
      blocks: {
        id: string;
        type: "definition" | "explanation" | "example" | "takeaways";
        title: string;
        content?: string;
        items?: string[];
      }[];
    }>>(API_ENDPOINTS.AI_EXPLAIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

