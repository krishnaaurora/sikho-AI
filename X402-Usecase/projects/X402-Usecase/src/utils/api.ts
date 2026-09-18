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
  const activeToken = accessToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 402) {
      let errorData: any = {};
      const paymentRequiredHeader =
        response.headers.get('payment-required') ||
        response.headers.get('Payment-Required') ||
        response.headers.get('PAYMENT-REQUIRED') ||
        '';

      if (paymentRequiredHeader) {
        try {
          const b64 = paymentRequiredHeader.includes(',')
            ? paymentRequiredHeader.split(',')[1].trim()
            : paymentRequiredHeader.trim();
          errorData = JSON.parse(atob(b64));
        } catch (_) {}
      }

      if (!errorData || Object.keys(errorData).length === 0) {
        try {
          errorData = await response.json();
        } catch (_) {
          errorData = { success: true, message: 'Payment Required' };
        }
      }

      return {
        success: true,
        data: errorData,
        paymentRequiredHeader,
        ...(typeof errorData === 'object' ? errorData : {}),
      } as unknown as T;
    }

    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        try {
          const parsed = typeof errorData.message === 'string' ? JSON.parse(errorData.message) : errorData.message;
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
            errorMessage = parsed.map((p: any) => p.message).join(', ');
          } else {
            errorMessage = errorData.message;
          }
        } catch (_) {
          errorMessage = errorData.message;
        }
      }
    } catch (_) {
      // ignore JSON parsing errors
    }
    if (response.status === 401) {
      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        errorMessage = "Wrong password, email, or user not registered.";
      } else {
        errorMessage = "Authentication required or session expired.";
      }
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
  async getOverview() {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/overview`);
  },
  async getStats() {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/stats`);
  },
  async getTransactions(params?: { status?: string; feature?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.feature) queryParams.append('feature', params.feature);
    if (params?.search) queryParams.append('search', params.search);
    const qs = queryParams.toString() ? `?${queryParams}` : '';
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/payments${qs}`);
  },
  async getPayments(params?: { status?: string; feature?: string; search?: string }) {
    return this.getTransactions(params);
  },
  async getUsers(params?: { search?: string; status?: string; page?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    const qs = queryParams.toString() ? `?${queryParams}` : '';
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/users${qs}`);
  },
  async getUserDetails(userId: string) {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/users/${userId}/details`);
  },
  async toggleUserStatus(userId: string, isActive: boolean) {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
  async getAppAnalytics(range: string = '30d') {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/app-analytics?range=${range}`);
  },
  async getActivityLogs() {
    return fetchAPI<ApiResponse<any[]>>(`${API_BASE_URL}/admin/activity-logs`);
  },
  async createActivityLog(data: { action: string; target?: string; details?: string }) {
    return fetchAPI<ApiResponse<any>>(`${API_BASE_URL}/admin/activity-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async downloadCsv(type: 'users' | 'payments' | 'app-usage') {
    const activeToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/admin/export-csv?type=${type}`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sikho_${type}_report.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
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

export const servicesApi = {
  async getRegistry() {
    return fetchAPI<ApiResponse<any[]>>(API_ENDPOINTS.SERVICES_REGISTRY);
  },

  async orchestrateCodeReview(data: {
    serviceId?: string;
    payload: {
      file_path?: string;
      raw_url?: string;
      code?: string;
      language?: string;
    };
    userPaymentTxId?: string;
  }) {
    return fetchAPI<ApiResponse<{
      transaction: any;
      service: any;
      result: any;
      receipts: {
        userPaymentTxId?: string;
        providerPaymentTxId: string;
        providerPayTo: string;
        providerAmount: number;
        platformFee: number;
        userTotalAmount: number;
        currency: string;
        network: string;
        verifiedAt: string;
      };
    }>>(API_ENDPOINTS.SERVICES_ORCHESTRATE_REVIEW, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTransactions() {
    return fetchAPI<ApiResponse<any[]>>(API_ENDPOINTS.SERVICES_TRANSACTIONS);
  },
};

export const githubReviewApi = {
  async discover(repoUrl: string, maxFiles?: number) {
    return fetchAPI<ApiResponse<{
      reviewId: string;
      owner: string;
      repository: string;
      repoUrl: string;
      defaultBranch: string;
      commitSha: string;
      reviewableFileCount: number;
      prismPricePerFile: number;
      platformFeePerFile: number;
      userPricePerFile: number;
      providerTotal: number;
      platformFeeTotal: number;
      userTotal: number;
      status: string;
      files: Array<{
        fileReviewId: string;
        filePath: string;
        language: string;
        size: number;
        status: string;
      }>;
    }>>(API_ENDPOINTS.GITHUB_REVIEW_DISCOVER, {
      method: 'POST',
      body: JSON.stringify({ repoUrl, maxFiles }),
    });
  },

  async discoverRepo(repoUrl: string, maxFiles?: number) {
    return this.discover(repoUrl, maxFiles);
  },

  async startReview(reviewId: string, userPaymentTxId: string, providerPaymentTxId?: string) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.GITHUB_REVIEW_START, {
      method: 'POST',
      body: JSON.stringify({ reviewId, userPaymentTxId, providerPaymentTxId }),
    });
  },

  async getSikhoChallenge(reviewId: string, fileId: string) {
    return fetchAPI<ApiResponse<{
      x402Version: number;
      error: string;
      resource: { url: string; description: string };
      accepts: Array<{
        scheme: string;
        network: string;
        payTo: string;
        amount: string;
        asset: string;
        description: string;
        extra: any;
      }>;
    }>>(API_ENDPOINTS.GITHUB_REVIEW_SIKHO_CHALLENGE(reviewId, fileId), {
      method: 'POST',
      body: JSON.stringify({ reviewId, fileId }),
    });
  },

  async submitSikhoPayment(reviewId: string, fileId: string, paymentSignatureOrTxId: string, senderAddress?: string) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.GITHUB_REVIEW_SIKHO_PAYMENT(reviewId, fileId), {
      method: 'POST',
      headers: {
        'Payment-Signature': paymentSignatureOrTxId,
        'X-PAYMENT': paymentSignatureOrTxId,
      },
      body: JSON.stringify({
        reviewId,
        fileId,
        sikhoPaymentTxId: paymentSignatureOrTxId,
        paymentSignature: paymentSignatureOrTxId,
        sender: senderAddress,
      }),
    });
  },

  async getPrismChallenge(reviewId: string, fileId: string) {
    return fetchAPI<ApiResponse<{
      fileReviewId: string;
      filePath: string;
      language: string;
      payTo: string;
      amountMicroUSDC: number;
      assetId: string;
      network: string;
      paymentRequiredHeader?: string;
    }>>(API_ENDPOINTS.GITHUB_REVIEW_PRISM_CHALLENGE(reviewId, fileId), {
      method: 'POST',
      body: JSON.stringify({ reviewId, fileId }),
    });
  },

  async submitPrismReview(reviewId: string, fileId: string, paymentSignature: string, prismPaymentTxId?: string) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.GITHUB_REVIEW_PRISM_SUBMIT(reviewId, fileId), {
      method: 'POST',
      headers: {
        'Payment-Signature': paymentSignature,
      },
      body: JSON.stringify({ reviewId, fileId, paymentSignature, prismPaymentTxId }),
    });
  },

  async reviewFile(reviewId: string, fileId: string, userPaymentTxId: string) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.GITHUB_REVIEW_FILE_REVIEW(reviewId, fileId), {
      method: 'POST',
      body: JSON.stringify({ reviewId, fileId, userPaymentTxId }),
    });
  },

  async getReviewStatus(reviewId: string) {
    return fetchAPI<ApiResponse<{
      review: any;
      files: any[];
    }>>(API_ENDPOINTS.GITHUB_REVIEW_STATUS(reviewId));
  },

  async getReviewFiles(reviewId: string) {
    return fetchAPI<ApiResponse<any[]>>(API_ENDPOINTS.GITHUB_REVIEW_FILES(reviewId));
  },

  async retryFile(reviewId: string, fileId: string, sikhoPaymentTxId?: string, paymentSignature?: string) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.GITHUB_REVIEW_RETRY(reviewId, fileId), {
      method: 'POST',
      body: JSON.stringify({ reviewId, fileId, sikhoPaymentTxId, paymentSignature }),
    });
  },

  async recordPlatformFee(data: {
    reviewId: string;
    fileId: string;
    filePath?: string;
    amount?: number;
    currency?: string;
    assetId?: string;
    network?: string;
    purpose?: string;
  }) {
    return fetchAPI<ApiResponse<any>>(API_ENDPOINTS.PLATFORM_FEE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};



