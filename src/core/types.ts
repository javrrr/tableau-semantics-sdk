/** Static token auth — provide a pre-obtained access token */
export interface StaticTokenAuth {
  type: "static";
  accessToken: string;
}

/** Refreshable token auth — SDK calls refresh function when token expires */
export interface RefreshableTokenAuth {
  type: "refresh";
  accessToken: string;
  refreshToken: string;
  refreshFn: (refreshToken: string) => Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }>;
}

/** OAuth2 client-credentials auth — SDK handles the full token lifecycle */
export interface OAuth2Auth {
  type: "oauth2";
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
}

export type AuthConfig = StaticTokenAuth | RefreshableTokenAuth | OAuth2Auth;

export interface ClientConfig {
  /** Base URL including version, e.g. https://instance.my.salesforce.com/services/data/v66.0 */
  instanceUrl: string;
  /** Authentication configuration */
  auth: AuthConfig;
  /** Default timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retries for retriable errors (default: 3) */
  maxRetries?: number;
  /** Custom fetch implementation (defaults to globalThis.fetch) */
  fetch?: typeof globalThis.fetch;
  /** Request interceptors */
  requestInterceptors?: RequestInterceptor[];
  /** Response interceptors */
  responseInterceptors?: ResponseInterceptor[];
}

export interface RequestOptions {
  /** Override the default timeout for this request */
  timeout?: number;
  /** Additional headers */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Skip retry logic */
  skipRetry?: boolean;
}

export interface PaginationParams {
  /** Number of results to return (1-200, default: 20) */
  batchSize?: number;
  /** Number of rows to skip */
  offset?: number;
  /** Sort order, e.g. "createdDate desc" */
  orderBy?: string;
  /** Query parameter name for page size — some endpoints use "limit" instead of "batchSize" */
  pageSizeParam?: "batchSize" | "limit";
}

export interface PaginatedResponse<T> {
  data: T[];
  totalSize?: number;
  offset?: number;
  nextPageUrl?: string;
}

export interface RequestInterceptor {
  (request: {
    url: string;
    init: RequestInit;
  }): Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };
}

export interface ResponseInterceptor {
  (response: Response, request: { url: string; init: RequestInit }):
    | Promise<Response>
    | Response;
}
