/**
 * Named type exports for all 39 OpenAPI schemas, 0 enum types,
 * and 0 discriminated union types.
 * Auto-generated — DO NOT EDIT. Run `npm run generate` to regenerate.
 *
 * Usage:
 *   import type { SemanticModelInputRepresentation } from "tableau-semantics-sdk";
 *   import type { SemanticQueryRequest } from "tableau-semantics-sdk/schemas";
 */
import type { components } from "./generated/openapi.js";

type Schemas = components["schemas"];

// ── Schema types (39) ──

export type SemanticAbstractModelPartialOutputRepresentation = {
  apiName?: string;
  baseModelApiName?: string;
  cacheKey?: string;
  createdBy?: string;
  createdDate?: string;
  description?: string;
  externalConnectionApiName?: string;
  id?: string;
  isQueryable?: Schemas["SemanticEntityQueryableEnum"];
  label?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  agentEnabled?: boolean;
  app?: string;
  baseModels?: Schemas["SemanticBaseModelOutputRepresentation"][];
  businessPreferences?: string;
  categories?: Schemas["SemanticCategoryEnum"][];
  currency?: Schemas["SemanticModelCurrencyOutputRepresentation"];
  dataspace?: string;
  externalConnections?: Schemas["SemanticModelExternalConnectionOutputRepresentation"][];
  isLocked?: boolean;
  lastDraftModifiedDate?: string;
  lastPublishedModifiedDate?: string;
  lockedActions?: { [key: string]: string[] };
  queryUnrelatedDataObjects?: Schemas["SemanticQueryUnrelatedDataObjectsTypeEnum"];
  semanticCalculatedDimensionsUrl?: string;
  semanticCalculatedMeasurementsUrl?: string;
  semanticDataObjectsUrl?: string;
  semanticGroupingsUrl?: string;
  semanticParametersUrl?: string;
  semanticRelationshipsUrl?: string;
  sourceCreation?: Schemas["SemanticModelSourceCreationTypeEnum"];
  sourceCreationName?: string;
  versionState?: Schemas["SemanticModelVersionStateEnum"];
}
export type SemanticBaseModelInputRepresentation = Schemas["SemanticBaseModelInputRepresentation"];
export type SemanticBaseModelOutputRepresentation = Schemas["SemanticBaseModelOutputRepresentation"];
export type SemanticCalculatedDimensionInputRepresentation = Schemas["SemanticCalculatedDimensionInputRepresentation"];
export type SemanticCalculatedDimensionOutputRepresentation = Schemas["SemanticCalculatedDimensionOutputRepresentation"];
export type SemanticCalculatedMeasurementInputRepresentation = Schemas["SemanticCalculatedMeasurementInputRepresentation"];
export type SemanticCalculatedMeasurementOutputRepresentation = Schemas["SemanticCalculatedMeasurementOutputRepresentation"];
export type SemanticCategoryEnum = Schemas["SemanticCategoryEnum"];
export type SemanticDataObjectInputRepresentation = Schemas["SemanticDataObjectInputRepresentation"];
export type SemanticDataObjectOutputRepresentation = Schemas["SemanticDataObjectOutputRepresentation"];
export type SemanticEntityOutputRepresentation = Schemas["SemanticEntityOutputRepresentation"];
export type SemanticEntityQueryableEnum = Schemas["SemanticEntityQueryableEnum"];
export type SemanticGroupingInputRepresentation = Schemas["SemanticGroupingInputRepresentation"];
export type SemanticGroupingOutputRepresentation = Schemas["SemanticGroupingOutputRepresentation"];
export type SemanticLogicalViewInputRepresentation = Schemas["SemanticLogicalViewInputRepresentation"];
export type SemanticLogicalViewOutputRepresentation = Schemas["SemanticLogicalViewOutputRepresentation"];
export type SemanticMetricInputRepresentation = Schemas["SemanticMetricInputRepresentation"];
export type SemanticMetricOutputRepresentation = Schemas["SemanticMetricOutputRepresentation"];
export type SemanticModelCurrencyOutputRepresentation = Schemas["SemanticModelCurrencyOutputRepresentation"];
export type SemanticModelExternalConnectionInputRepresentation = Schemas["SemanticModelExternalConnectionInputRepresentation"];
export type SemanticModelExternalConnectionOutputRepresentation = Schemas["SemanticModelExternalConnectionOutputRepresentation"];
export type SemanticModelInfoOutputRepresentation = Schemas["SemanticModelInfoOutputRepresentation"];
export type SemanticModelInputRepresentation = {
  baseModels?: Schemas["SemanticBaseModelInputRepresentation"][];
  externalConnections?: Schemas["SemanticModelExternalConnectionInputRepresentation"][];
  fieldsOverrides?: Schemas["SemanticOverrideInputRepresentation"][];
  semanticCalculatedDimensions?: Schemas["SemanticCalculatedDimensionInputRepresentation"][];
  semanticCalculatedMeasurements?: Schemas["SemanticCalculatedMeasurementInputRepresentation"][];
  semanticDataObjects?: Schemas["SemanticDataObjectInputRepresentation"][];
  semanticGroupings?: Schemas["SemanticGroupingInputRepresentation"][];
  semanticLogicalViews?: Schemas["SemanticLogicalViewInputRepresentation"][];
  semanticMetrics?: Schemas["SemanticMetricInputRepresentation"][];
  semanticParameters?: Schemas["SemanticParameterInputRepresentation"][];
  semanticRelationships?: Schemas["SemanticRelationshipInputRepresentation"][];
}
export type SemanticModelOutputRepresentation = {
  apiName?: string;
  baseModelApiName?: string;
  cacheKey?: string;
  createdBy?: string;
  createdDate?: string;
  description?: string;
  externalConnectionApiName?: string;
  id?: string;
  isQueryable?: Schemas["SemanticEntityQueryableEnum"];
  label?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  agentEnabled?: boolean;
  app?: string;
  baseModels?: Schemas["SemanticBaseModelOutputRepresentation"][];
  businessPreferences?: string;
  categories?: Schemas["SemanticCategoryEnum"][];
  currency?: Schemas["SemanticModelCurrencyOutputRepresentation"];
  dataspace?: string;
  externalConnections?: Schemas["SemanticModelExternalConnectionOutputRepresentation"][];
  isLocked?: boolean;
  lastDraftModifiedDate?: string;
  lastPublishedModifiedDate?: string;
  lockedActions?: { [key: string]: string[] };
  queryUnrelatedDataObjects?: Schemas["SemanticQueryUnrelatedDataObjectsTypeEnum"];
  semanticCalculatedDimensionsUrl?: string;
  semanticCalculatedMeasurementsUrl?: string;
  semanticDataObjectsUrl?: string;
  semanticGroupingsUrl?: string;
  semanticParametersUrl?: string;
  semanticRelationshipsUrl?: string;
  sourceCreation?: Schemas["SemanticModelSourceCreationTypeEnum"];
  sourceCreationName?: string;
  versionState?: Schemas["SemanticModelVersionStateEnum"];
  fieldsOverrides?: Schemas["SemanticOverrideOutputRepresentation"][];
  hasUnmapped?: boolean;
  isPartialSdm?: boolean;
  semanticCalculatedDimensions?: Schemas["SemanticCalculatedDimensionOutputRepresentation"][];
  semanticCalculatedMeasurements?: Schemas["SemanticCalculatedMeasurementOutputRepresentation"][];
  semanticDataObjects?: Schemas["SemanticDataObjectOutputRepresentation"][];
  semanticGroupings?: Schemas["SemanticGroupingOutputRepresentation"][];
  semanticLogicalViews?: Schemas["SemanticLogicalViewOutputRepresentation"][];
  semanticMetrics?: Schemas["SemanticMetricOutputRepresentation"][];
  semanticModelInfo?: Schemas["SemanticModelInfoOutputRepresentation"];
  semanticParameters?: Schemas["SemanticParameterOutputRepresentation"][];
  semanticRelationships?: Schemas["SemanticRelationshipOutputRepresentation"][];
}
export type SemanticModelPartialInputRepresentation = Schemas["SemanticModelPartialInputRepresentation"];
/** @override LIVE-CORRECTED (v65, 2026-10-04): the spec's `Manual|Import` are REJECTED by the live org (`POST_BODY_PARSE_ERROR: Invalid Model Source Creation Type`). The only accepted value observed is `DataCloud` (the v64 spelling). */
export type SemanticModelSourceCreationTypeEnum = "DataCloud";
export type SemanticModelValidationOutputRepresentation = Schemas["SemanticModelValidationOutputRepresentation"];
export type SemanticModelVersionStateEnum = Schemas["SemanticModelVersionStateEnum"];
export type SemanticOverrideInputRepresentation = Schemas["SemanticOverrideInputRepresentation"];
export type SemanticOverrideOutputRepresentation = Schemas["SemanticOverrideOutputRepresentation"];
export type SemanticParameterInputRepresentation = Schemas["SemanticParameterInputRepresentation"];
export type SemanticParameterOutputRepresentation = Schemas["SemanticParameterOutputRepresentation"];
export type SemanticQueryErrorResponse = Schemas["SemanticQueryErrorResponse"];
/** @override LIVE-CORRECTED (v65, 2026-10-03, verified to a 200): the published spec is wrong for the query gateway. The live engine requires a TOP-LEVEL sibling `semanticModelApiName` and REJECTS the spec's `semanticModel` (`INVALID_API_INPUT: Cannot find field: semanticModel`). `structuredSemanticQuery` is strictly `{ fields, options }` (projections/dimensions/tables/etc. 400). Each `fields[]` entry needs a per-field ROLE or it defaults to NONE and is dropped (`Query doesn't include select fields`): a dimension sets `row_grouping: true`; a measure sets `semantic_aggregation_method` to a FULL enum (`SEMANTIC_AGGREGATION_METHOD_{AUTO|SUM|AVG|COUNT|...}` — short forms 400). `expression` is a oneof: `table_field{name,table_name}` (table_name = the SDO apiName, NOT the physical __dlm/__cio name; name = the SDO-scoped field apiName), `semantic_field{name}` (model-level name, no table_name), or `calculated_field`. Use `alias` to label a field (there is no `name` on the field itself). `options.limit_options.limit` (not row_limit). */
export type SemanticQueryRequest = {
  dataspace?: string;
  source?: string;
  structuredSemanticQuery: { fields: { expression: { table_field: { name: string; table_name: string } } | { semantic_field: { name: string } } | { calculated_field: Record<string, unknown> }; alias: string; row_grouping?: boolean; semantic_aggregation_method?: `SEMANTIC_AGGREGATION_METHOD_${string}` }[]; options?: { limit_options?: { limit?: number } } & Record<string, unknown> };
  semanticModel?: never;
  semanticModelApiName: string;
}
/** @override LIVE-SHAPED (v65, 2026-10-03) from a 200 capture. `queryData.rows` are POSITIONAL value arrays; map columns via `queryMetadata.fields[alias].placeInOrder`. */
export type SemanticQueryResponse = {
  queryResults?: { queryMetadata?: { fields?: Record<string, { placeInOrder: number; type: string; semanticType?: Record<string, unknown> }> }; queryData?: { rows?: { values: (string | number | boolean | null)[] }[] } };
  status?: string;
}
/** @override LIVE-CORRECTED (v65, 2026-10-04): the spec's `Allow|Disallow` are REJECTED by the live org (`POST_BODY_PARSE_ERROR: Invalid Semantic Query Unrelated Data Objects Type`). The only accepted value observed is `Union` (the v64 spelling). */
export type SemanticQueryUnrelatedDataObjectsTypeEnum = "Union";
export type SemanticRelationshipInputRepresentation = Schemas["SemanticRelationshipInputRepresentation"];
export type SemanticRelationshipOutputRepresentation = Schemas["SemanticRelationshipOutputRepresentation"];
export type SemanticResourceValidationOutputRepresentation = Schemas["SemanticResourceValidationOutputRepresentation"];

// ── Enum types (0) ──



// ── Discriminated union types (0) ──

