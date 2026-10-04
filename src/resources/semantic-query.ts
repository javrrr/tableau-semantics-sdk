import { SemanticQueryServiceBase } from "../generated/services/semantic-query.base.js";
import type { RequestOptions } from "../core/types.js";
import type { SemanticQueryRequest, SemanticQueryResponse } from "../schemas.js";

/**
 * Ergonomic service for the Semantic Query gateway
 * (`POST /semantic-engine/gateway`, API v65) — run a query against a deployed
 * semantic model and get structured results back.
 *
 * The generated base exposes `execute(body)`; this extension adds a `query`
 * alias reading more naturally at the call site:
 *
 *   await client.semanticQuery.query({ dataspace, source, structuredSemanticQuery });
 *
 * Request shape — LIVE-VERIFIED to a 200 (v65, 2026-10-03). Example with
 * neutral placeholders:
 *   await client.semanticQuery.query({
 *     dataspace: "default",
 *     semanticModelApiName: "Example_Model",        // REQUIRED, top-level sibling
 *     structuredSemanticQuery: {
 *       fields: [
 *         // dimension — row_grouping:true
 *         { expression: { table_field: { name: "Example Dimension", table_name: "Example_SDO" } },
 *           alias: "dim", row_grouping: true },
 *         // measure — semantic_aggregation_method (FULL enum name)
 *         { expression: { table_field: { name: "Example Measure", table_name: "Example_SDO" } },
 *           alias: "meas", semantic_aggregation_method: "SEMANTIC_AGGREGATION_METHOD_AUTO" },
 *       ],
 *       options: { limit_options: { limit: 10 } },
 *     },
 *   });
 *
 * Rules (all protobuf-reject-probed against a live v65 engine):
 *  • `structuredSemanticQuery` is strictly `{ fields, options }` — other keys
 *    (projections/dimensions/tables/select/…) 400 with "Cannot find field".
 *  • Each `fields[]` entry needs a per-field ROLE or it defaults to NONE and is
 *    dropped ("Query doesn't include select fields"): a dimension sets
 *    `row_grouping: true`; a measure sets `semantic_aggregation_method` to a FULL
 *    enum name (`SEMANTIC_AGGREGATION_METHOD_{AUTO|SUM|AVG|COUNT|…}` — short forms 400).
 *  • `alias` labels the field (the field has no `name` of its own).
 *  • `expression` is a oneof: `table_field { name, table_name }` where
 *    `table_name` is the SDO apiName (NOT the physical `__dlm`/`__cio` name — those
 *    "Failed to resolve table") and `name` is the SDO-scoped field apiName;
 *    `semantic_field { name }` for a model-level field (calc measurement; no
 *    table_name); or `calculated_field`.
 *  • `options.limit_options.limit` (not `row_limit`, not a root-level `limit`).
 *
 * Response: `queryData.rows` are POSITIONAL value arrays — map each column via
 * `queryMetadata.fields[alias].placeInOrder`.
 *
 * ⚠ The published v65 spec is WRONG here; the SDK type is overridden to this
 * live contract (see SCHEMA_OVERRIDES in scripts/generate-types.ts). The spec's
 * `semanticModel` (inline and top-level) is rejected by the engine.
 */
export class SemanticQueryService extends SemanticQueryServiceBase {
  /**
   * POST `/semantic-engine/gateway` — execute a semantic query.
   * Ergonomic alias for {@link SemanticQueryServiceBase.execute}.
   */
  async query(
    body: SemanticQueryRequest,
    options?: RequestOptions,
  ): Promise<SemanticQueryResponse> {
    return super.execute(body, options);
  }
}
