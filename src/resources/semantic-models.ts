import {
  SemanticModelsServiceBase,
  type SemanticModelsPatchParams,
} from "../generated/services/semantic-models.base.js";
import type { RequestOptions } from "../core/types.js";
import type {
  SemanticModelInputRepresentation,
  SemanticModelOutputRepresentation,
} from "../schemas.js";

/**
 * Ergonomic service for the Semantic Model authoring surface
 * (`/ssot/semantic/models`, API v65).
 *
 * The generated base provides `get` / `put` / `patch` / `delete` plus the
 * `getShallow` / `createClone` / `getValidate` sub-operations. This extension
 * adds `create` (see below) and an `update` alias for `patch`.
 *
 * ── create vs. put (LIVE-VERIFIED v65, 2026-10-04) ──
 * The published spec exposes only PUT/PATCH/DELETE on `/{id}` and NO collection
 * POST — but that is wrong. Live:
 *  • `create(body)` → POST `/ssot/semantic/models` → 201. This is the ONLY way to
 *    create a model. The endpoint is absent from the published spec, so it is
 *    hand-authored here.
 *  • `put(apiName, body)` is REPLACE-ONLY: a PUT to a not-yet-existing apiName
 *    returns 404 (`SEMANTIC_ENTITY_NOT_EXIST`), it does NOT create. Use it only
 *    to replace an existing model.
 *
 * ── Create-body rules the spec example gets wrong (LIVE-VERIFIED) ──
 *  • `dataspace` is a MANDATORY top-level shell field — omitting it 400s
 *    (`CREATE_SEMANTIC_ENTITY_FAILED: missing a mandatory dataspace value`).
 *  • Two shell enums use the v64 spellings, NOT the spec's modeled values:
 *    `sourceCreation: "DataCloud"` (spec `Manual|Import` is rejected) and
 *    `queryUnrelatedDataObjects: "Union"` (spec `Allow|Disallow` is rejected).
 *    The exported `SemanticModel*Enum` types are live-corrected accordingly.
 *  • A semantic data object field's `apiName` must be space-free (alphanumeric +
 *    underscore); put display text in `label`. A space in the apiName surfaces as
 *    a 500 `SERVER_INTERNAL_ERROR`, not a 400.
 *  • The body collapses the old v64 five-POST sequence into one nested shape:
 *    `semanticDataObjects`, `semanticRelationships`, `semanticCalculatedMeasurements`,
 *    `semanticCalculatedDimensions`, … The element and shell schemas are open
 *    objects (`additionalProperties: true`), so leaf field names/values are NOT
 *    type-checked — the caller owns them.
 */
export class SemanticModelsService extends SemanticModelsServiceBase {
  /**
   * POST `/ssot/semantic/models` — create a semantic model (returns 201).
   *
   * Hand-authored: the collection POST is absent from the published v65 spec but
   * is the live create verb (`put` is replace-only — see class docs). The body
   * must include a top-level `dataspace`; see the create-body rules above.
   */
  async create(
    body: SemanticModelInputRepresentation,
    options?: RequestOptions,
  ): Promise<SemanticModelOutputRepresentation> {
    return this.httpClient.post<SemanticModelOutputRepresentation>(
      this.basePath,
      body,
      options,
    );
  }

  /**
   * PATCH `/ssot/semantic/models/{modelApiNameOrId}` — partially update a model.
   * Ergonomic alias for {@link SemanticModelsServiceBase.patch}.
   */
  async update(
    modelApiNameOrId: string,
    body: SemanticModelInputRepresentation,
    params?: SemanticModelsPatchParams,
    options?: RequestOptions,
  ): Promise<SemanticModelOutputRepresentation> {
    return super.patch(modelApiNameOrId, body, params, options);
  }
}
