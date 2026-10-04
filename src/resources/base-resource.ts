import type { HttpClient } from "../core/http-client.js";
import type { PaginationParams, RequestOptions } from "../core/types.js";
import { paginate, collectAll } from "../core/pagination.js";

export abstract class BaseResource {
  protected readonly httpClient: HttpClient;
  protected abstract readonly basePath: string;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /** Resolve path parameters, e.g. "/tableau/visualizations/{visualizationIdOrApiName}" */
  protected resolvePath(
    path: string,
    params: Record<string, string>,
  ): string {
    let resolved = path;
    for (const [key, value] of Object.entries(params)) {
      resolved = resolved.replace(`{${key}}`, encodeURIComponent(value));
    }
    return resolved;
  }

  /** Build pagination query params */
  protected paginationQuery(
    params?: PaginationParams,
  ): Record<string, string | number | boolean | undefined> {
    if (!params) return {};
    const pageSizeParam = params.pageSizeParam ?? "batchSize";
    return {
      [pageSizeParam]: params.batchSize,
      offset: params.offset,
      orderBy: params.orderBy,
    };
  }

  /** Create an async generator for paginated results */
  protected paginate<T>(
    path: string,
    params?: PaginationParams & { query?: Record<string, string | number | boolean | undefined> },
    requestOptions?: RequestOptions,
  ): AsyncGenerator<T, void, undefined> {
    const { batchSize, offset, orderBy, pageSizeParam, query, ...rest } = params ?? {};
    return paginate<T>({
      httpClient: this.httpClient,
      path,
      batchSize,
      offset,
      orderBy,
      pageSizeParam,
      query,
      requestOptions: { ...rest, ...requestOptions },
    });
  }

  /** Collect all items from paginated endpoint */
  protected collectAll<T>(
    path: string,
    params?: PaginationParams & { query?: Record<string, string | number | boolean | undefined> },
    requestOptions?: RequestOptions,
  ): Promise<T[]> {
    const { batchSize, offset, orderBy, pageSizeParam, query, ...rest } = params ?? {};
    return collectAll<T>({
      httpClient: this.httpClient,
      path,
      batchSize,
      offset,
      orderBy,
      pageSizeParam,
      query,
      requestOptions: { ...rest, ...requestOptions },
    });
  }
}
