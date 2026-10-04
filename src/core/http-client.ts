import type {
  ClientConfig,
  RequestOptions,
  RequestInterceptor,
  ResponseInterceptor,
} from "./types.js";
import { type TokenProvider, createTokenProvider } from "./auth.js";
import { parseErrorResponse, RateLimitError } from "./errors.js";

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenProvider: TokenProvider;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetchFn: typeof globalThis.fetch;
  private readonly requestInterceptors: RequestInterceptor[];
  private readonly responseInterceptors: ResponseInterceptor[];

  constructor(config: ClientConfig) {
    this.baseUrl = config.instanceUrl.replace(/\/$/, "");
    this.tokenProvider = createTokenProvider(config.auth, config.fetch);
    this.timeout = config.timeout ?? 30_000;
    this.maxRetries = config.maxRetries ?? 3;
    this.fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
    this.requestInterceptors = config.requestInterceptors ?? [];
    this.responseInterceptors = config.responseInterceptors ?? [];
  }

  async request<T>(
    method: string,
    path: string,
    options?: RequestOptions & {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
    },
  ): Promise<T> {
    const url = this.buildUrl(path, options?.query);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...options?.headers,
    };

    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const token = await this.tokenProvider.getToken();
    headers["Authorization"] = `Bearer ${token}`;

    let reqUrl = url;
    let reqInit: RequestInit = {
      method,
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    };

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor({ url: reqUrl, init: reqInit });
      reqUrl = result.url;
      reqInit = result.init;
    }

    const timeout = options?.timeout ?? this.timeout;
    const maxRetries = options?.skipRetry ? 0 : this.maxRetries;

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Combine with external signal if provided
        if (options?.signal) {
          options.signal.addEventListener("abort", () => controller.abort());
        }

        let response: Response;
        try {
          response = await this.fetchFn(reqUrl, {
            ...reqInit,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        // Run response interceptors
        for (const interceptor of this.responseInterceptors) {
          response = await interceptor(response, { url: reqUrl, init: reqInit });
        }

        if (response.ok) {
          if (response.status === 204) {
            return undefined as T;
          }
          return (await response.json()) as T;
        }

        // Parse error body
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = null;
        }

        const error = parseErrorResponse(
          response.status,
          response.statusText,
          errorBody,
          response.headers,
        );

        // Retry on rate limit or 5xx
        if (this.isRetriable(response.status) && attempt < maxRetries) {
          lastError = error;
          const delay = this.getRetryDelay(attempt, error);
          await this.sleep(delay);
          continue;
        }

        throw error;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error(`Request timed out after ${timeout}ms`);
        }
        // Re-throw TableauSemanticsError instances (already handled above)
        if (err && typeof err === "object" && "status" in err) {
          throw err;
        }
        // Network errors — retry
        if (attempt < maxRetries) {
          lastError = err;
          await this.sleep(this.getRetryDelay(attempt));
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }

  async get<T>(path: string, options?: RequestOptions & { query?: Record<string, string | number | boolean | undefined> }): Promise<T> {
    return this.request<T>("GET", path, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions & { query?: Record<string, string | number | boolean | undefined> }): Promise<T> {
    return this.request<T>("POST", path, { ...options, body });
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions & { query?: Record<string, string | number | boolean | undefined> }): Promise<T> {
    return this.request<T>("PUT", path, { ...options, body });
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions & { query?: Record<string, string | number | boolean | undefined> }): Promise<T> {
    return this.request<T>("PATCH", path, { ...options, body });
  }

  async delete<T>(path: string, options?: RequestOptions & { query?: Record<string, string | number | boolean | undefined> }): Promise<T> {
    return this.request<T>("DELETE", path, options);
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private isRetriable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private getRetryDelay(attempt: number, error?: unknown): number {
    if (error instanceof RateLimitError && error.retryAfter) {
      return error.retryAfter * 1000;
    }
    // Exponential backoff with jitter: 1s, 2s, 4s base + random jitter
    const base = Math.pow(2, attempt) * 1000;
    const jitter = Math.random() * 1000;
    return base + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
