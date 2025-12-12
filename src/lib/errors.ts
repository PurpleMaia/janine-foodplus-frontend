export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const Errors = {
  NO_SESSION_COOKIE: new ApiError('NO_SESSION', 401, 'No session cookie found. Please log in.'),
  INVALID_CREDENTIALS: new ApiError('INVALID_CREDENTIALS', 401, 'Invalid credentials. Please try again.'),
  TOO_MANY_REQUESTS: new ApiError('TOO_MANY_REQUESTS', 429, 'Too many requests. Please try again later.'),

  USER_ALREADY_EXISTS: new ApiError('USER_ALREADY_EXISTS', 409, 'User already exists. Please choose a different email or username.'),
  UNAUTHORIZED: new ApiError('UNAUTHORIZED', 401, 'Unauthorized access. Please log in.'),
  CLIENTS_NOT_FOUND: new ApiError('CLIENTS_NOT_FOUND', 404, 'No clients found.'), // shouldnt happen

  REPORT_NOT_FOUND: new ApiError('REPORT_NOT_FOUND', 404, 'No report found.'),
  SITES_NOT_FOUND: new ApiError('SITES_NOT_FOUND', 404, 'No sample sites found for the report.'),
  METRICS_NOT_FOUND: new ApiError('METRICS_NOT_FOUND', 404, 'No metrics found for the report.'),
  RANGES_NOT_FOUND: new ApiError('RANGES_NOT_FOUND', 404, 'No metric ranges found for the report.'),

  INTERNAL_ERROR: new ApiError('INTERNAL_ERROR', 500, 'Internal server error. Please try again later.'),
} as const;