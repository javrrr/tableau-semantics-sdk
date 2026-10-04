import type { HttpClient } from "./http-client.js";
import type { PaginationParams, RequestOptions } from "./types.js";

/**
 * Response shape expected from paginated list endpoints.
 * The SDK normalizes various response shapes into this format.
 */
interface RawPaginatedResponse<T> {
  data?: T[];
  metadata?: T[];
  records?: T[];
  totalSize?: number;
  nextPageUrl?: string;
  offset?: number;
}

function extractItems<T>(raw: RawPaginatedResponse<T>): T[] {
  // Check well-known keys first
  if (raw.data) return raw.data;
  if (raw.metadata) return raw.metadata;
  if (raw.records) return raw.records;

  // Fall back to the first array-valued property (handles collection responses
  // like { dataStreams: [...] }, { connections: [...] }, etc.)
  for (const value of Object.values(raw)) {
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

export interface PaginateOptions<T> extends PaginationParams {
  /** HTTP client instance */
  httpClient: HttpClient;
  /** API path */
  path: string;
  /** Additional query params beyond pagination */
  query?: Record<string, string | number | boolean | undefined>;
  /** Request options */
  requestOptions?: RequestOptions;
  /** Custom extractor for items from response */
  extractItems?: (raw: unknown) => T[];
}

function normalizeNextPagePath(nextPageUrl: string): string {
  const trimmed = nextPageUrl.trim();
  let pathWithQuery = trimmed;

  try {
    // API may return a full absolute URL; HttpClient expects a path.
    const parsed = new URL(trimmed);
    pathWithQuery = `${parsed.pathname}${parsed.search}`;
  } catch {
    // Not an absolute URL, keep as-is.
  }

  // API may return "/services/data/vXX.X/..." while the client baseUrl already
  // includes "/services/data/vXX.X".
  const withVersionPrefix = pathWithQuery.match(/^\/services\/data\/v\d+(?:\.\d+)?(\/.*)$/);
  if (withVersionPrefix) {
    return withVersionPrefix[1];
  }

  return pathWithQuery;
}

/**
 * Async generator that yields pages of items from a paginated endpoint.
 * Supports both offset-based and nextPageUrl-based pagination.
 */
export async function* paginate<T>(
  options: PaginateOptions<T>,
): AsyncGenerator<T, void, undefined> {
  const {
    httpClient,
    path,
    batchSize = 20,
    offset: startOffset = 0,
    orderBy,
    pageSizeParam = "batchSize",
    query = {},
    requestOptions,
    extractItems: customExtractor,
  } = options;

  let currentOffset = startOffset;
  let nextUrl: string | undefined;
  let totalSize: number | undefined;

  while (true) {
    const paginationQuery: Record<string, string | number | boolean | undefined> = {
      ...query,
      [pageSizeParam]: batchSize,
      offset: currentOffset,
    };

    if (orderBy) {
      paginationQuery.orderBy = orderBy;
    }

    // If we have a nextPageUrl, use that instead
    const requestPath = nextUrl ?? path;
    const requestQuery = nextUrl ? undefined : paginationQuery;

    const raw = await httpClient.get<RawPaginatedResponse<T>>(requestPath, {
      ...requestOptions,
      query: requestQuery,
    });

    const items = customExtractor ? customExtractor(raw) : extractItems(raw);
    if (typeof raw.totalSize === "number" && Number.isFinite(raw.totalSize) && raw.totalSize >= 0) {
      totalSize = raw.totalSize;
    }

    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      yield item;
    }
    currentOffset += items.length;

    // Safety net: stop when we have already yielded all advertised rows.
    if (totalSize !== undefined && currentOffset >= totalSize) {
      break;
    }

    // Check for next page
    if (raw.nextPageUrl) {
      nextUrl = normalizeNextPagePath(raw.nextPageUrl);
    } else if (items.length < batchSize) {
      // No more pages
      break;
    } else {
      nextUrl = undefined;
    }
  }
}

/**
 * Collects all items from a paginated endpoint into a single array.
 */
export async function collectAll<T>(
  options: PaginateOptions<T>,
): Promise<T[]> {
  const all: T[] = [];
  for await (const item of paginate(options)) {
    all.push(item);
  }
  return all;
}
