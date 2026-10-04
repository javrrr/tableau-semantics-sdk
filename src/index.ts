// Client
export { TableauSemanticsClient } from "./client.js";

// Core types
export type {
  ClientConfig,
  AuthConfig,
  StaticTokenAuth,
  RefreshableTokenAuth,
  OAuth2Auth,
  RequestOptions,
  PaginationParams,
  PaginatedResponse,
  RequestInterceptor,
  ResponseInterceptor,
} from "./core/types.js";

// Errors
export {
  TableauSemanticsError,
  BadRequestError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from "./core/errors.js";

// Pagination helpers
export { paginate, collectAll } from "./core/pagination.js";

// Type helpers
export type {
  Simplify,
  Schema,
  ResponseBody,
  RequestBody,
  QueryParams,
  PathParams,
} from "./utils/type-helpers.js";

// Generated types (raw)
export type { paths, components, operations } from "./generated/openapi.js";

// All named schema types — discoverable via autocomplete
export type * from "./schemas.js";

// Generated query param interfaces — discoverable via autocomplete
export type * from "./generated/services/index.js";

// Resource service classes — one per spec tag
export { SemanticModelsService } from "./resources/semantic-models.js";
export { SemanticQueryService } from "./resources/semantic-query.js";
