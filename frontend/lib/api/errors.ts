export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class TimeoutError extends ApiError {
  constructor(url?: string) {
    super(`Request timed out${url ? `: ${url}` : ''}`, 408, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends ApiError {
  constructor(cause: unknown) {
    const msg = cause instanceof Error ? cause.message : 'Network error';
    super(msg, undefined, 'NETWORK');
    this.name = 'NetworkError';
  }
}

export class ApiResponseError extends ApiError {
  constructor(status: number, statusText: string, url?: string) {
    super(
      `HTTP ${status}: ${statusText}${url ? ` for ${url}` : ''}`,
      status,
      'HTTP_ERROR'
    );
    this.name = 'ApiResponseError';
  }
}
