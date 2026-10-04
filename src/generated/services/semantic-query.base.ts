/**
 * Auto-generated base service for Semantic Query.
 * DO NOT EDIT — run `npm run generate` to regenerate.
 * Extend this class in src/resources/semantic-query.ts for customizations.
 */
import { BaseResource } from "../../resources/base-resource.js";
import type { RequestOptions } from "../../core/types.js";
import type {
  SemanticQueryRequest,
  SemanticQueryResponse,
} from "../../schemas.js";

// ── Base service class ──

export class SemanticQueryServiceBase extends BaseResource {
  protected readonly basePath = "/semantic-engine/gateway";

  /** POST /semantic-engine/gateway */
  async execute(body: SemanticQueryRequest, options?: RequestOptions): Promise<SemanticQueryResponse> {
    return this.httpClient.post(this.basePath, body, options);
  }
}
