import { ApiResponseError, NetworkError, TimeoutError } from './errors';

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiResponseError(response.status, response.statusText, url);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      if (contentType.includes('xml') || contentType.includes('text')) {
        return (await response.text()) as unknown as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiResponseError) throw error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(url);
      }

      if (attempt === retries) {
        throw new NetworkError(error);
      }

      await new Promise((r) =>
        setTimeout(r, retryDelay * Math.pow(2, attempt))
      );
    }
  }

  throw new NetworkError('Max retries exceeded');
}
