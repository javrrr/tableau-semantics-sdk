/**
 * Auto-generated base service for Semantic Models.
 * DO NOT EDIT — run `npm run generate` to regenerate.
 * Extend this class in src/resources/semantic-models.ts for customizations.
 */
import { BaseResource } from "../../resources/base-resource.js";
import type { RequestOptions } from "../../core/types.js";
import type {
  SemanticModelInputRepresentation,
  SemanticModelOutputRepresentation,
  SemanticModelValidationOutputRepresentation,
} from "../../schemas.js";

// ── Query parameter interfaces ──

export interface SemanticModelsGetParams {
  /** Include unmapped semantic definitions in the response. */
  allowUnmapped?: boolean;
  /** Filter results to fields whose labels contain the specified text. */
  fieldName?: string;
  /** Apply fine-grained security filtering for a partial semantic model. */
  fineGrainSecurity?: boolean;
  /** Enrich the model with its content in the response. */
  includeModelContent?: boolean;
  /** Include information about key qualifiers and primary key indicators in the response. */
  includeTableKeys?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface SemanticModelsPatchParams {
  /** If set to True, includes unmapped semantic definitions in the response. */
  allowUnmapped?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface SemanticModelsPutParams {
  /** Include unmapped semantic definitions in the response. */
  allowUnmapped?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface SemanticModelsGetShallowParams {
  /** If set to True, includes unmapped semantic definitions in the response. */
  allowUnmapped?: boolean;
  /** Returns only fields that contain the specified substring in their label. */
  fieldName?: string;
  /** If enabled, applies fine-grained security rules and returns a partial semantic model that respects access restrictions. */
  fineGrainSecurity?: boolean;
  /** If set, enriches the response with the model’s full content. */
  includeModelContent?: boolean;
  [key: string]: string | number | boolean | undefined;
}

// ── Base service class ──

export class SemanticModelsServiceBase extends BaseResource {
  protected readonly basePath = "/ssot/semantic/models";

  /** DELETE /ssot/semantic/models/{modelApiNameOrId} */
  async delete(modelApiNameOrId: string, options?: RequestOptions): Promise<void> {
    return this.httpClient.delete(`${this.basePath}/${encodeURIComponent(modelApiNameOrId)}`, options);
  }

  /** GET /ssot/semantic/models/{modelApiNameOrId} */
  async get(modelApiNameOrId: string, params?: SemanticModelsGetParams, options?: RequestOptions): Promise<SemanticModelOutputRepresentation> {
    return this.httpClient.get(`${this.basePath}/${encodeURIComponent(modelApiNameOrId)}`, { ...options, query: params });
  }

  /** PATCH /ssot/semantic/models/{modelApiNameOrId} */
  async patch(modelApiNameOrId: string, body: SemanticModelInputRepresentation, params?: SemanticModelsPatchParams, options?: RequestOptions): Promise<SemanticModelOutputRepresentation> {
    return this.httpClient.patch(`${this.basePath}/${encodeURIComponent(modelApiNameOrId)}`, body, { ...options, query: params });
  }

  /** PUT /ssot/semantic/models/{modelApiNameOrId} */
  async put(modelApiNameOrId: string, body: SemanticModelInputRepresentation, params?: SemanticModelsPutParams, options?: RequestOptions): Promise<SemanticModelOutputRepresentation> {
    return this.httpClient.put(`${this.basePath}/${encodeURIComponent(modelApiNameOrId)}`, body, { ...options, query: params });
  }

  /** POST /ssot/semantic/models/{modelApiNameOrId}/clone */
  async createClone(modelApiNameOrId: string, options?: RequestOptions): Promise<SemanticModelOutputRepresentation> {
    return this.httpClient.post(`${this.basePath}/${encodeURIComponent(modelApiNameOrId)}/clone`, undefined, options);
  }

  /** GET /ssot/semantic/models/{modelApiNameOrId}/shallow */
  async getShallow(modelApiNameOrId: string, params?: SemanticModelsGetShallowParams, options?: RequestOptions): Promise<SemanticModelOutputRepresentation> {
    return this.httpClient.get(`${this.basePath}/${encodeURIComponent(modelApiNameOrId)}/shallow`, { ...options, query: params });
  }

  /** GET /ssot/semantic/models/{modelApiNameOrId}/validate */
  async getValidate(modelApiNameOrId: string, options?: RequestOptions): Promise<SemanticModelValidationOutputRepresentation> {
    return this.httpClient.get(`${this.basePath}/${encodeURIComponent(modelApiNameOrId)}/validate`, options);
  }
}
