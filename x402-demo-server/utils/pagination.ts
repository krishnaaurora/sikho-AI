import { constants } from "./constants";

export const getPaginationParams = (query: any) => {
  const page = Math.max(1, parseInt(query.page) || constants.DEFAULT_PAGE);
  const limit = Math.min(
    constants.MAX_LIMIT,
    Math.max(1, parseInt(query.limit) || constants.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildPaginationResponse = (
  data: any[],
  total: number,
  page: number,
  limit: number
) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}