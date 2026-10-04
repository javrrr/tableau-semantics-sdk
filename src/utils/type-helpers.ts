import type { components, paths } from "../generated/openapi.js";

/**
 * Flatten a complex intersection / mapped type into a single object type.
 * Improves IntelliSense hover display without changing assignability.
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/** Extract a schema type by its name in components.schemas */
export type Schema<K extends keyof components["schemas"]> =
  components["schemas"][K];

/** HTTP methods supported in the spec */
type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/** Extract the response body type for a given path + method (200 JSON response) */
export type ResponseBody<
  P extends keyof paths,
  M extends HttpMethod,
> = paths[P] extends { [K in M]: infer Op }
  ? Op extends {
      responses: {
        200: { content: { "application/json": infer R } };
      };
    }
    ? R
    : never
  : never;

/** Extract the request body type for a given path + method */
export type RequestBody<
  P extends keyof paths,
  M extends HttpMethod,
> = paths[P] extends { [K in M]: infer Op }
  ? Op extends {
      requestBody: { content: { "application/json": infer B } };
    }
    ? B
    : never
  : never;

/** Extract query parameters for a given path + method */
export type QueryParams<
  P extends keyof paths,
  M extends HttpMethod,
> = paths[P] extends { [K in M]: infer Op }
  ? Op extends { parameters: { query?: infer Q } }
    ? Q
    : never
  : never;

/** Extract path parameters for a given path + method */
export type PathParams<
  P extends keyof paths,
  M extends HttpMethod,
> = paths[P] extends { [K in M]: infer Op }
  ? Op extends { parameters: { path: infer PP } }
    ? PP
    : never
  : never;
