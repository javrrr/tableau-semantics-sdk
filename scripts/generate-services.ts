#!/usr/bin/env tsx
/**
 * Generates TypeScript base service classes from the merged Tableau Semantics Layer OpenAPI spec.
 *
 * Produces:
 *   - src/generated/services/{tag}.base.ts  — one base service per API tag
 *   - src/generated/services/index.ts       — barrel export
 *
 * Usage: npm run generate  (runs after generate-types.ts)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { buildSchemaNameMap } from "./lib/schema-names.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SPEC_PATH = path.resolve(ROOT, "src/generated/openapi.yaml");
const SERVICES_OUTPUT = path.resolve(ROOT, "src/generated/services");

// ────────────────────────────────────────────────────────────────────────────
// Spec types
// ────────────────────────────────────────────────────────────────────────────

interface SpecParam {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  description?: string;
  required?: boolean;
  schema?: { type?: string; enum?: string[]; format?: string; default?: unknown };
}

interface SpecOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: SpecParam[];
  requestBody?: {
    content?: { "application/json"?: { schema?: { $ref?: string } } };
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: { "application/json"?: { schema?: { $ref?: string } } };
    }
  >;
}

interface SpecPath {
  parameters?: SpecParam[];
  get?: SpecOperation;
  post?: SpecOperation;
  put?: SpecOperation;
  patch?: SpecOperation;
  delete?: SpecOperation;
}

interface SpecPropDef {
  type?: string;
  items?: { $ref?: string; type?: string };
  allOf?: Array<{ $ref?: string }>;
}

interface SpecSchemaDef {
  properties?: Record<string, SpecPropDef>;
  allOf?: Array<{ $ref?: string; properties?: Record<string, SpecPropDef> }>;
}

// ────────────────────────────────────────────────────────────────────────────
// Service configuration
// ────────────────────────────────────────────────────────────────────────────

interface ServiceConfig {
  /** Override generated class name (default: derived from tag) */
  className?: string;
  /** Override file name (default: derived from tag) */
  fileName?: string;
  /** Property name on TableauSemanticsClient */
  clientPropertyName?: string;
  /** Override computed base path */
  basePath?: string;
  /** Include paths from other tags */
  additionalPaths?: string[];
  /** Skip specific paths entirely */
  excludePaths?: string[];
  /** Skip specific generated method names */
  excludeMethods?: string[];
  /** Don't generate listAll for this service */
  generateListAll?: boolean;
  /** Method name overrides: key is the auto-derived name, value is the desired name */
  methodNames?: Record<string, string>;
  /**
   * Qualify action method names with the preceding resource segment.
   *
   * By default `/{resource}/actions/{verb}` derives to just `{verb}` (e.g.
   * `bulkCreate`). For services that expose the same action verb across many
   * sibling sub-resources (e.g. Data Governance has `bulk-create` under
   * classifications, tags, taxonomies, …), the bare verb collides. Enabling
   * this appends the resource segment so each is unique and self-describing,
   * e.g. `bulkCreateClassifications`, `bulkCreateTags`.
   *
   * Only affects actions that have a literal resource segment before `actions`
   * (`/{id}/actions/{verb}` and base-level `/actions/{verb}` are unchanged).
   */
  qualifyActionsWithResource?: boolean;
}

/**
 * Per-tag service configuration overrides.
 *
 * - Tags not listed here get default behavior.
 * - Every entry is validated against the spec at generation time.
 */
/**
 * Per-tag service configuration for the Tableau Semantics Layer surface.
 *
 * Tags are injected by scripts/merge-specs.ts (one per source spec), so there
 * are exactly two. basePath is set explicitly because the two surfaces live
 * under unrelated roots (/ssot/semantic/models and /semantic-engine).
 */
const SERVICE_CONFIG: Record<string, ServiceConfig> = {
  "Semantic Models": {
    className: "SemanticModelsServiceBase",
    fileName: "semantic-models",
    clientPropertyName: "semanticModels",
    basePath: "/ssot/semantic/models",
    generateListAll: false,
  },
  "Semantic Query": {
    className: "SemanticQueryServiceBase",
    fileName: "semantic-query",
    clientPropertyName: "semanticQuery",
    basePath: "/semantic-engine/gateway",
    generateListAll: false,
    // POST /semantic-engine/gateway — expose as execute() rather than create().
    methodNames: { create: "execute" },
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

/** Pagination-related query param names to exclude from generated param interfaces */
const PAGINATION_PARAMS = new Set([
  "batchSize",
  "limit",
  "offset",
  "orderBy",
  "orderby",
]);

function refToName(ref: string): string {
  return ref.split("/").pop()!;
}

/**
 * Map from fully-qualified dotted schema names to clean TS identifiers,
 * populated in main() once the spec is read. `toId` converts a schema
 * ref/name to the identifier used in `import`/`body:`/return positions.
 * Schema LOOKUPS (e.g. findItemType) keep using the original FQN.
 */
let schemaNameMap = new Map<string, string>();
function toId(fqn: string): string {
  return schemaNameMap.get(fqn) ?? fqn;
}

/** "data-streams" → "DataStreams" */
function kebabToPascal(s: string): string {
  return s
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/** "Data Streams" → "data-streams" */
function tagToFileName(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "Data Streams" → "dataStreams" */
function tagToPropertyName(tag: string): string {
  const pascal = kebabToPascal(tagToFileName(tag));
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/** "refresh-status" → "refreshStatus" */
function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** "objects" → "Objects" */
function toPascal(s: string): string {
  const camel = kebabToCamel(s);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/** Convert spec type to TS type for query params */
function specTypeToTS(param: SpecParam): string {
  const type = param.schema?.type;
  if (type === "integer" || type === "number") return "number";
  if (type === "boolean") return "boolean";
  return "string";
}

/** Clean up JSDoc description: trim, single-line, remove markdown */
function cleanDescription(desc?: string): string | undefined {
  if (!desc) return undefined;
  // Take first sentence/line, trim whitespace
  const first = desc.split("\n")[0].trim();
  // Remove markdown bold
  return first.replace(/\*\*/g, "");
}

// ────────────────────────────────────────────────────────────────────────────
// Operation parsing
// ────────────────────────────────────────────────────────────────────────────

interface ParsedOperation {
  method: HttpMethod;
  path: string;
  summary?: string;
  pathParams: SpecParam[];
  queryParams: SpecParam[];
  paginationQueryParams: SpecParam[];
  requestBodyRef?: string;
  responseRef?: string;
  responseCode: string;
}

function parseOperation(
  method: HttpMethod,
  specPath: string,
  op: SpecOperation,
  pathLevelParams: SpecParam[],
): ParsedOperation {
  const allParams = [...(pathLevelParams || []), ...(op.parameters || [])];
  const declaredPathParams = allParams.filter((p) => p.in === "path");
  const allQueryParams = allParams.filter((p) => p.in === "query");

  // Ensure all path params from the URL template are included, even if
  // the spec doesn't declare them at this path level (common with nested paths)
  const urlParamNames = [...specPath.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  const declaredNames = new Set(declaredPathParams.map((p) => p.name));
  const pathParams = [
    ...declaredPathParams,
    ...urlParamNames
      .filter((name) => !declaredNames.has(name))
      .map((name): SpecParam => ({ name, in: "path", required: true, schema: { type: "string" } })),
  ];
  const queryParams = allQueryParams.filter((p) => !PAGINATION_PARAMS.has(p.name));
  const paginationQueryParams = allQueryParams.filter((p) => PAGINATION_PARAMS.has(p.name));

  let requestBodyRef: string | undefined;
  const bodyContent = op.requestBody?.content?.["application/json"];
  if (bodyContent?.schema?.$ref) {
    requestBodyRef = refToName(bodyContent.schema.$ref);
  }

  let responseRef: string | undefined;
  let responseCode = "200";
  for (const code of ["200", "201", "204"]) {
    const resp = op.responses?.[code];
    if (resp) {
      responseCode = code;
      const content = resp.content?.["application/json"];
      if (content?.schema?.$ref) {
        responseRef = refToName(content.schema.$ref);
      }
      break;
    }
  }

  return {
    method,
    path: specPath,
    summary: op.summary,
    pathParams,
    queryParams,
    paginationQueryParams,
    requestBodyRef,
    responseRef,
    responseCode,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Method name derivation
// ────────────────────────────────────────────────────────────────────────────

interface GeneratedMethod {
  name: string;
  op: ParsedOperation;
  isListEndpoint: boolean;
  pageSizeParam: "batchSize" | "limit";
}

/** Length of the longest common character prefix between two strings. */
function longestCommonPrefixLength(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

function deriveMethodName(
  op: ParsedOperation,
  basePath: string,
  isCollectionResponse: boolean,
  qualifyActionsWithResource = false,
): { name: string; isListEndpoint: boolean } {
  // When the path shares the basePath, strip it. Otherwise strip only the
  // longest common prefix so method names stay short.
  //
  // The basePath must match at a segment boundary: a sibling like
  // `/ssot/semantic/models` is NOT under basePath `/ssot/semantic/model` even though
  // it shares the character prefix. Without this check the plural segment would
  // be mangled to a bare `s` suffix, producing method names like `listS`.
  let suffix: string;
  if (op.path === basePath || op.path.startsWith(`${basePath}/`)) {
    suffix = op.path.slice(basePath.length);
  } else {
    let lcpLen = longestCommonPrefixLength(basePath, op.path);
    // If the LCP splits mid-word (neither side is at a `/` or `-` boundary),
    // truncate back to the last `/` to preserve full URL segments.
    const charAfter = op.path[lcpLen];
    const charBefore = op.path[lcpLen - 1];
    if (
      charAfter && charAfter !== "/" && charAfter !== "-" &&
      charBefore && charBefore !== "/" && charBefore !== "-"
    ) {
      lcpLen = op.path.lastIndexOf("/", lcpLen - 1) + 1;
    }
    suffix = op.path.slice(lcpLen);
  }

  // Remove path parameter segments for pattern matching
  const segments = suffix
    .split("/")
    .filter((s) => s.length > 0);

  // Classify segments as param or literal
  const parts: Array<{ value: string; isParam: boolean }> = segments.map((s) => ({
    value: s.startsWith("{") ? s.slice(1, -1) : s,
    isParam: s.startsWith("{"),
  }));

  const method = op.method;
  const literalParts = parts.filter((p) => !p.isParam);

  // Base path (no suffix)
  if (parts.length === 0) {
    if (method === "get") return { name: "list", isListEndpoint: true };
    if (method === "post") return { name: "create", isListEndpoint: false };
    return { name: method, isListEndpoint: false };
  }

  // /{id} only
  if (parts.length === 1 && parts[0].isParam) {
    if (method === "get") return { name: "get", isListEndpoint: false };
    if (method === "delete") return { name: "delete", isListEndpoint: false };
    if (method === "patch") return { name: "patch", isListEndpoint: false };
    if (method === "put") return { name: "put", isListEndpoint: false };
    if (method === "post") return { name: "create", isListEndpoint: false };
    return { name: method, isListEndpoint: false };
  }

  // Actions pattern: .../actions/{name} or .../actions/name
  const actionsIdx = literalParts.findIndex((p) => p.value === "actions");
  if (actionsIdx !== -1 && actionsIdx < literalParts.length - 1) {
    const actionName = literalParts[actionsIdx + 1].value;
    // Optionally qualify with the resource segment before `actions` so the same
    // verb on sibling resources doesn't collide (e.g. bulkCreateClassifications).
    if (qualifyActionsWithResource && actionsIdx > 0) {
      const resourceSeg = literalParts[actionsIdx - 1].value;
      return { name: `${kebabToCamel(actionName)}${toPascal(resourceSeg)}`, isListEndpoint: false };
    }
    return { name: kebabToCamel(actionName), isListEndpoint: false };
  }

  // Sub-resource patterns
  // /{id}/sub-resource
  if (parts.length >= 2 && parts[0].isParam && !parts[1].isParam) {
    const subResource = parts[1].value;

    // /{id}/sub-resource/{subId} — get a specific sub-resource item
    if (parts.length >= 3 && parts[2].isParam) {
      if (parts.length === 3) {
        if (method === "get") return { name: `get${toPascal(subResource)}`, isListEndpoint: false };
        if (method === "patch") return { name: `patch${toPascal(subResource)}`, isListEndpoint: false };
        if (method === "delete") return { name: `delete${toPascal(subResource)}`, isListEndpoint: false };
        if (method === "put") return { name: `put${toPascal(subResource)}`, isListEndpoint: false };
      }

      // /{id}/sub/{subId}/deeper
      if (parts.length >= 4 && !parts[3].isParam) {
        const deeper = parts[3].value;

        // actions at deeper level
        if (deeper === "actions" && parts.length >= 5) {
          const actionName = parts[4].isParam ? parts[4].value : parts[4].value;
          return { name: kebabToCamel(actionName), isListEndpoint: false };
        }

        // /{id}/sub/{subId}/deeper
        if (method === "get") {
          const isCollection = isCollectionResponse;
          return {
            name: isCollection ? `list${toPascal(deeper)}` : `get${toPascal(deeper)}`,
            isListEndpoint: isCollection,
          };
        }
        if (method === "post") return { name: `create${toPascal(deeper)}`, isListEndpoint: false };
        if (method === "patch") return { name: `patch${toPascal(deeper)}`, isListEndpoint: false };
        if (method === "delete") return { name: `delete${toPascal(deeper)}`, isListEndpoint: false };
      }

      // /{id}/sub/{subId}/deeper/{deeperId}
      if (parts.length >= 5 && parts[3] && !parts[3].isParam && parts[4]?.isParam) {
        const deeper = parts[3].value;
        if (method === "get") return { name: `get${toPascal(deeper)}ById`, isListEndpoint: false };
        if (method === "patch") return { name: `patch${toPascal(deeper)}`, isListEndpoint: false };
      }
    }

    // /{id}/sub-resource (no sub-id)
    if (parts.length === 2) {
      if (method === "get") {
        const isList = isCollectionResponse;
        return {
          name: isList ? `list${toPascal(subResource)}` : `get${toPascal(subResource)}`,
          isListEndpoint: isList,
        };
      }
      if (method === "post") return { name: `create${toPascal(subResource)}`, isListEndpoint: false };
      if (method === "put") return { name: `put${toPascal(subResource)}`, isListEndpoint: false };
      if (method === "delete") return { name: `delete${toPascal(subResource)}`, isListEndpoint: false };
    }
  }

  // Top-level sub-paths (no leading param): /sub-resource
  if (parts.length >= 1 && !parts[0].isParam) {
    const resource = parts[0].value;

    // /sub-resource/{id}
    if (parts.length === 2 && parts[1].isParam) {
      if (method === "get") return { name: `get${toPascal(resource)}`, isListEndpoint: false };
      if (method === "delete") return { name: `delete${toPascal(resource)}`, isListEndpoint: false };
      if (method === "patch") return { name: `patch${toPascal(resource)}`, isListEndpoint: false };
      if (method === "put") return { name: `put${toPascal(resource)}`, isListEndpoint: false };
      if (method === "post") return { name: `create${toPascal(resource)}ById`, isListEndpoint: false };
    }

    // /sub-resource (no id)
    if (parts.length === 1) {
      if (method === "get") {
        const isList = isCollectionResponse;
        return {
          name: isList ? `list${toPascal(resource)}` : `get${toPascal(resource)}`,
          isListEndpoint: isList,
        };
      }
      if (method === "post") return { name: `create${toPascal(resource)}`, isListEndpoint: false };
    }

    // /sub-resource/{id}/deeper-resource
    if (parts.length >= 3 && parts[1].isParam && !parts[2].isParam) {
      const deeper = parts[2].value;
      if (method === "get") {
        return {
          name: isCollectionResponse ? `list${toPascal(resource)}${toPascal(deeper)}` : `get${toPascal(resource)}${toPascal(deeper)}`,
          isListEndpoint: isCollectionResponse,
        };
      }
      if (method === "post") return { name: `create${toPascal(resource)}${toPascal(deeper)}`, isListEndpoint: false };
      if (method === "delete") return { name: `delete${toPascal(resource)}${toPascal(deeper)}`, isListEndpoint: false };
      if (method === "patch") return { name: `patch${toPascal(resource)}${toPascal(deeper)}`, isListEndpoint: false };
    }
  }

  // Fallback: concat all literal parts with method prefix
  const fallbackName = literalParts.map((p) => toPascal(p.value)).join("");
  return { name: `${method}${fallbackName}`, isListEndpoint: false };
}

function isCollectionSchema(schemaName?: string): boolean {
  if (!schemaName) return false;
  return (
    schemaName.includes("Collection") ||
    schemaName.includes("Container")
  );
}

function detectPagination(
  op: ParsedOperation,
): "batchSize" | "limit" {
  const paginationNames = op.paginationQueryParams.map((p) => p.name);
  if (paginationNames.includes("limit")) return "limit";
  return "batchSize";
}

// ────────────────────────────────────────────────────────────────────────────
// Item type detection for listAll
// ────────────────────────────────────────────────────────────────────────────

function findItemType(
  collectionSchemaName: string,
  schemas: Record<string, SpecSchemaDef>,
): string | undefined {
  const schema = schemas[collectionSchemaName];
  if (!schema) return undefined;

  // Collect all properties including from allOf
  const props: Record<string, SpecPropDef> = { ...schema.properties };
  for (const entry of schema.allOf ?? []) {
    if (entry.properties) Object.assign(props, entry.properties);
    if (entry.$ref) {
      const refSchema = schemas[refToName(entry.$ref)];
      if (refSchema?.properties) Object.assign(props, refSchema.properties);
    }
  }

  // Find first array property with $ref items
  for (const [, propDef] of Object.entries(props)) {
    if (propDef.type === "array" && propDef.items?.$ref) {
      return refToName(propDef.items.$ref);
    }
  }

  // Handle nested collection wrappers (e.g., CdpCalculatedInsightCollectionRepresentation.collection → sub-collection)
  for (const [, propDef] of Object.entries(props)) {
    if (propDef.allOf) {
      for (const entry of propDef.allOf) {
        if (entry.$ref) {
          const nestedRef = refToName(entry.$ref);
          const nestedItem = findItemType(nestedRef, schemas);
          if (nestedItem) return nestedItem;
        }
      }
    }
  }

  return undefined;
}

// ────────────────────────────────────────────────────────────────────────────
// Code generation
// ────────────────────────────────────────────────────────────────────────────

interface ServiceDefinition {
  tag: string;
  className: string;
  fileName: string;
  clientPropertyName: string;
  basePath: string;
  methods: GeneratedMethod[];
  schemaImports: Set<string>;
  queryParamInterfaces: string[];
  listAllMethods: GeneratedMethod[];
}

function computeBasePath(paths: string[]): string {
  if (paths.length === 0) return "/ssot";

  // Find the shortest common prefix that ends at a "/" boundary
  const sorted = [...paths].sort((a, b) => a.length - b.length);
  let common = sorted[0];

  for (const p of sorted) {
    while (!p.startsWith(common)) {
      common = common.slice(0, common.lastIndexOf("/"));
    }
  }

  // The base path must NOT contain path parameters — truncate before first {
  const paramIdx = common.indexOf("/{");
  if (paramIdx !== -1) {
    common = common.slice(0, paramIdx);
  }

  // Don't go shorter than the first meaningful segment
  if (common === "/ssot" || common.length < "/ssot/a".length) {
    // Find the most common first two segments
    const prefixCounts: Record<string, number> = {};
    for (const p of paths) {
      const match = p.match(/^\/ssot\/[^/{]+/);
      if (match) {
        prefixCounts[match[0]] = (prefixCounts[match[0]] || 0) + 1;
      }
    }
    const best = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1])[0];
    if (best) return best[0];
  }

  return common;
}

function generateService(
  tag: string,
  operations: ParsedOperation[],
  schemas: Record<string, SpecSchemaDef>,
  config: ServiceConfig | undefined,
): ServiceDefinition {
  const tagFileName = config?.fileName ?? tagToFileName(tag);
  const tagClassName = config?.className ?? `${kebabToPascal(tagFileName)}ServiceBase`;
  const tagClientProp = config?.clientPropertyName ?? tagToPropertyName(tag);

  // Compute base path
  const allPaths = operations.map((op) => op.path);
  const basePath = config?.basePath ?? computeBasePath(allPaths);

  const schemaImports = new Set<string>();
  const queryParamInterfaces: string[] = [];
  const methods: GeneratedMethod[] = [];
  const listAllMethods: GeneratedMethod[] = [];
  const seenMethodNames = new Set<string>();

  // Sort operations by path then method for deterministic output
  operations.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  for (const op of operations) {
    // Apply excludes
    if (config?.excludePaths?.includes(op.path)) continue;

    const isCollection = isCollectionSchema(op.responseRef);
    const derived = deriveMethodName(op, basePath, isCollection, config?.qualifyActionsWithResource);
    let methodName = derived.name;

    // Apply method name overrides
    if (config?.methodNames?.[methodName]) {
      methodName = config.methodNames[methodName];
    }

    // Apply excludeMethods
    if (config?.excludeMethods?.includes(methodName)) continue;

    // Handle collisions
    if (seenMethodNames.has(methodName)) {
      // Try "<name>By<Method>", then "<method><Name>", then a numeric suffix.
      // The final loop guarantees a globally unique name so we never silently
      // emit two methods with the same signature (a hard TS compile error).
      const candidates = [
        `${methodName}By${toPascal(op.method)}`,
        `${op.method}${toPascal(methodName)}`,
      ];
      let resolved = candidates.find((c) => !seenMethodNames.has(c));
      if (!resolved) {
        let n = 2;
        while (seenMethodNames.has(`${methodName}${n}`)) n++;
        resolved = `${methodName}${n}`;
      }
      methodName = resolved;
    }
    seenMethodNames.add(methodName);

    // Collect schema imports (sanitized identifiers)
    if (op.requestBodyRef) schemaImports.add(toId(op.requestBodyRef));
    if (op.responseRef && op.responseCode !== "204") schemaImports.add(toId(op.responseRef));

    // Generate query param interface if needed
    const nonPaginationQueryParams = op.queryParams;
    const pageSizeParam = detectPagination(op);
    let queryParamInterfaceName: string | undefined;

    if (nonPaginationQueryParams.length > 0) {
      const servicePascal = kebabToPascal(tagFileName);
      const methodPascal = methodName.charAt(0).toUpperCase() + methodName.slice(1);
      queryParamInterfaceName = `${servicePascal}${methodPascal}Params`;

      const lines: string[] = [];
      lines.push(`export interface ${queryParamInterfaceName} {`);
      for (const param of nonPaginationQueryParams) {
        const desc = cleanDescription(param.description);
        if (desc) lines.push(`  /** ${desc} */`);
        const tsType = specTypeToTS(param);
        const optional = param.required ? "" : "?";
        lines.push(`  ${param.name}${optional}: ${tsType};`);
      }
      lines.push("  [key: string]: string | number | boolean | undefined;");
      lines.push("}");
      queryParamInterfaces.push(lines.join("\n"));
    }

    const genMethod: GeneratedMethod = {
      name: methodName,
      op: { ...op, queryParams: nonPaginationQueryParams },
      isListEndpoint: derived.isListEndpoint,
      pageSizeParam,
    };

    // Attach query param interface name and whether it has required fields
    (genMethod as any).queryParamInterfaceName = queryParamInterfaceName;
    (genMethod as any).hasRequiredQueryParams = nonPaginationQueryParams.some((p) => p.required);

    methods.push(genMethod);

    // Generate listAll if applicable
    if (
      derived.isListEndpoint &&
      (config?.generateListAll !== false)
    ) {
      const itemTypeFqn = op.responseRef
        ? findItemType(op.responseRef, schemas)
        : undefined;
      if (itemTypeFqn) {
        const itemType = toId(itemTypeFqn);
        schemaImports.add(itemType);
        const listAllName = methodName === "list"
          ? "listAll"
          : methodName.replace(/^list/, "listAll");
        const listAllMethod: GeneratedMethod = {
          ...genMethod,
          name: listAllName,
          isListEndpoint: false,
        };
        (listAllMethod as any).itemType = itemType;
        (listAllMethod as any).queryParamInterfaceName = queryParamInterfaceName;
        (listAllMethod as any).hasRequiredQueryParams = nonPaginationQueryParams.some((p) => p.required);
        (listAllMethod as any).listMethodName = methodName;
        listAllMethods.push(listAllMethod);
        seenMethodNames.add(listAllName);
      }
    }
  }

  return {
    tag,
    className: tagClassName,
    fileName: tagFileName,
    clientPropertyName: tagClientProp,
    basePath,
    methods,
    schemaImports,
    queryParamInterfaces,
    listAllMethods,
  };
}

function emitMethodBody(method: GeneratedMethod, basePath: string): string {
  const op = method.op;
  const queryInterfaceName = (method as any).queryParamInterfaceName as
    | string
    | undefined;

  // Build path expression
  const startsWithBase = op.path.startsWith(basePath);
  const relativePath = startsWithBase ? op.path.slice(basePath.length) : null;
  let pathExpr: string;
  if (relativePath === null) {
    // Path is outside the basePath — use the full path directly
    const fullTemplate = op.path.replace(
      /\{([^}]+)\}/g,
      (_, param) => `\${encodeURIComponent(${param})}`,
    );
    pathExpr = "`" + fullTemplate + "`";
  } else if (!relativePath || relativePath === "") {
    pathExpr = "this.basePath";
  } else {
    // Replace {param} with ${encodeURIComponent(param)}
    const pathTemplate = relativePath.replace(
      /\{([^}]+)\}/g,
      (_, param) => `\${encodeURIComponent(${param})}`,
    );
    pathExpr = "`${this.basePath}" + pathTemplate + "`";
  }

  // Build parameters
  const params: string[] = [];

  // Path params — include all that appear in the full path, de-duplicated
  const pathParamNames = new Set<string>();
  const pathParams = op.pathParams.filter((p) => {
    if (pathParamNames.has(p.name)) return false;
    if (!op.path.includes(`{${p.name}}`)) return false;
    pathParamNames.add(p.name);
    return true;
  });
  for (const p of pathParams) {
    params.push(`${p.name}: string`);
  }

  // Request body
  if (op.requestBodyRef) {
    params.push(`body: ${toId(op.requestBodyRef)}`);
  }

  // Query params (non-pagination)
  const hasPagination = method.isListEndpoint && op.paginationQueryParams.length > 0;
  const hasRequiredQuery = (method as any).hasRequiredQueryParams as boolean;
  const optionalMark = hasRequiredQuery ? "" : "?";
  if (queryInterfaceName && hasPagination) {
    params.push(`params${optionalMark}: PaginationParams & ${queryInterfaceName}`);
  } else if (queryInterfaceName) {
    params.push(`params${optionalMark}: ${queryInterfaceName}`);
  } else if (hasPagination) {
    params.push(`params?: PaginationParams`);
  }

  // Options always last
  params.push("options?: RequestOptions");

  // Return type
  const returnType =
    op.responseCode === "204" || !op.responseRef
      ? "void"
      : toId(op.responseRef);

  // Build method body
  const lines: string[] = [];
  const summary = op.summary ? ` — ${op.summary}` : "";
  lines.push(
    `  /** ${op.method.toUpperCase()} ${op.path}${summary} */`,
  );
  lines.push(
    `  async ${method.name}(${params.join(", ")}): Promise<${returnType}> {`,
  );

  // Build the httpClient call
  const httpMethod = op.method;

  if (hasPagination && queryInterfaceName) {
    // Destructure pagination from query params
    const pageSizeParam = method.pageSizeParam;
    lines.push(
      `    const { batchSize, offset, orderBy, ...query } = params ?? {};`,
    );
    if (op.requestBodyRef) {
      lines.push(
        `    return this.httpClient.${httpMethod}(${pathExpr}, body, {`,
      );
    } else {
      lines.push(`    return this.httpClient.${httpMethod}(${pathExpr}, {`);
    }
    lines.push(`      ...options,`);
    lines.push(
      `      query: { ...this.paginationQuery({ batchSize, offset, orderBy, pageSizeParam: "${pageSizeParam}" }), ...query },`,
    );
    lines.push(`    });`);
  } else if (hasPagination) {
    const pageSizeParam = method.pageSizeParam;
    if (op.requestBodyRef) {
      lines.push(
        `    return this.httpClient.${httpMethod}(${pathExpr}, body, {`,
      );
    } else {
      lines.push(`    return this.httpClient.${httpMethod}(${pathExpr}, {`);
    }
    lines.push(`      ...options,`);
    lines.push(
      `      query: this.paginationQuery({ ...params, pageSizeParam: "${pageSizeParam}" }),`,
    );
    lines.push(`    });`);
  } else if (queryInterfaceName) {
    // Non-paginated but has query params
    if (op.requestBodyRef) {
      lines.push(
        `    return this.httpClient.${httpMethod}(${pathExpr}, body, { ...options, query: params });`,
      );
    } else if (httpMethod === "post" || httpMethod === "put" || httpMethod === "patch") {
      lines.push(
        `    return this.httpClient.${httpMethod}(${pathExpr}, undefined, { ...options, query: params });`,
      );
    } else {
      lines.push(
        `    return this.httpClient.${httpMethod}(${pathExpr}, { ...options, query: params });`,
      );
    }
  } else {
    // No query params
    if (op.requestBodyRef) {
      if (httpMethod === "post" || httpMethod === "put" || httpMethod === "patch") {
        lines.push(
          `    return this.httpClient.${httpMethod}(${pathExpr}, body, options);`,
        );
      } else {
        lines.push(
          `    return this.httpClient.${httpMethod}(${pathExpr}, options);`,
        );
      }
    } else {
      if (httpMethod === "post") {
        lines.push(
          `    return this.httpClient.${httpMethod}(${pathExpr}, undefined, options);`,
        );
      } else {
        lines.push(
          `    return this.httpClient.${httpMethod}(${pathExpr}, options);`,
        );
      }
    }
  }

  lines.push(`  }`);
  return lines.join("\n");
}

function emitListAllMethod(
  method: GeneratedMethod,
  basePath: string,
): string {
  const op = method.op;
  const itemType = (method as any).itemType as string;
  const queryInterfaceName = (method as any).queryParamInterfaceName as
    | string
    | undefined;
  const pageSizeParam = method.pageSizeParam;

  // Build path expression
  const startsWithBase = op.path.startsWith(basePath);
  const relativePath = startsWithBase ? op.path.slice(basePath.length) : null;
  let pathExpr: string;
  if (relativePath === null) {
    const fullTemplate = op.path.replace(
      /\{([^}]+)\}/g,
      (_, param) => `\${encodeURIComponent(${param})}`,
    );
    pathExpr = "`" + fullTemplate + "`";
  } else if (!relativePath) {
    pathExpr = "this.basePath";
  } else {
    const pathTemplate = relativePath.replace(
      /\{([^}]+)\}/g,
      (_, param) => `\${encodeURIComponent(${param})}`,
    );
    pathExpr = "`${this.basePath}" + pathTemplate + "`";
  }

  // Path params — include all that appear in the full path, de-duplicated
  const pathParamNames = new Set<string>();
  const pathParams = op.pathParams.filter((p) => {
    if (pathParamNames.has(p.name)) return false;
    if (!op.path.includes(`{${p.name}}`)) return false;
    pathParamNames.add(p.name);
    return true;
  });

  const params: string[] = [];
  for (const p of pathParams) {
    params.push(`${p.name}: string`);
  }

  const hasRequiredQuery = (method as any).hasRequiredQueryParams as boolean;
  const optionalMark = hasRequiredQuery ? "" : "?";
  if (queryInterfaceName) {
    params.push(`params${optionalMark}: PaginationParams & ${queryInterfaceName}`);
  } else {
    params.push("params?: PaginationParams");
  }
  params.push("options?: RequestOptions");

  const lines: string[] = [];
  lines.push(`  /** Async generator yielding all items from ${(method as any).listMethodName ?? "list"} */`);
  lines.push(
    `  async *${method.name}(${params.join(", ")}): AsyncGenerator<${itemType}, void, undefined> {`,
  );

  if (queryInterfaceName) {
    lines.push(
      `    const { batchSize, offset, orderBy, ...query } = params ?? {};`,
    );
    lines.push(
      `    yield* this.paginate<${itemType}>(${pathExpr}, { batchSize, offset, orderBy, pageSizeParam: "${pageSizeParam}", query }, options);`,
    );
  } else {
    lines.push(
      `    yield* this.paginate<${itemType}>(${pathExpr}, { ...params, pageSizeParam: "${pageSizeParam}" }, options);`,
    );
  }

  lines.push(`  }`);
  return lines.join("\n");
}

function emitServiceFile(svc: ServiceDefinition): string {
  const lines: string[] = [];

  lines.push(
    "/**",
    ` * Auto-generated base service for ${svc.tag}.`,
    " * DO NOT EDIT — run `npm run generate` to regenerate.",
    ` * Extend this class in src/resources/${svc.fileName}.ts for customizations.`,
    " */",
  );

  // Imports
  lines.push(
    `import { BaseResource } from "../../resources/base-resource.js";`,
  );

  const coreImports: string[] = ["RequestOptions"];
  const needsPagination =
    svc.methods.some((m) => m.isListEndpoint && m.op.paginationQueryParams.length > 0) ||
    svc.listAllMethods.length > 0;
  if (needsPagination) coreImports.unshift("PaginationParams");
  lines.push(
    `import type { ${coreImports.join(", ")} } from "../../core/types.js";`,
  );

  if (svc.schemaImports.size > 0) {
    const sorted = [...svc.schemaImports].sort();
    lines.push(`import type {`);
    for (const imp of sorted) {
      lines.push(`  ${imp},`);
    }
    lines.push(`} from "../../schemas.js";`);
  }

  lines.push("");

  // Query param interfaces
  if (svc.queryParamInterfaces.length > 0) {
    lines.push("// ── Query parameter interfaces ──");
    lines.push("");
    for (const iface of svc.queryParamInterfaces) {
      lines.push(iface);
      lines.push("");
    }
  }

  // Class
  lines.push("// ── Base service class ──");
  lines.push("");
  lines.push(`export class ${svc.className} extends BaseResource {`);
  lines.push(`  protected readonly basePath = "${svc.basePath}";`);

  for (const method of svc.methods) {
    lines.push("");
    lines.push(emitMethodBody(method, svc.basePath));
  }

  for (const method of svc.listAllMethods) {
    lines.push("");
    lines.push(emitListAllMethod(method, svc.basePath));
  }

  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Generating service files...");

  // Read the spec
  const specYaml = fs.readFileSync(SPEC_PATH, "utf8");
  const spec = parse(specYaml) as {
    paths?: Record<string, SpecPath>;
    components?: { schemas?: Record<string, SpecSchemaDef> };
  };

  const specPaths = spec.paths ?? {};
  const schemas = spec.components?.schemas ?? {};

  // Build the FQN → identifier map used by toId() for all schema references.
  schemaNameMap = buildSchemaNameMap(Object.keys(schemas));

  // Group operations by tag
  const tagOperations = new Map<string, ParsedOperation[]>();

  for (const [specPath, pathDef] of Object.entries(specPaths)) {
    const pathLevelParams = pathDef.parameters ?? [];

    for (const method of HTTP_METHODS) {
      const op = pathDef[method];
      if (!op || !op.tags?.length) continue;

      const tag = op.tags[0];
      const parsed = parseOperation(method, specPath, op, pathLevelParams);

      if (!tagOperations.has(tag)) tagOperations.set(tag, []);
      tagOperations.get(tag)!.push(parsed);
    }
  }

  // Add additional paths from config
  for (const [tag, config] of Object.entries(SERVICE_CONFIG)) {
    if (!config.additionalPaths) continue;
    if (!tagOperations.has(tag)) tagOperations.set(tag, []);
    const ops = tagOperations.get(tag)!;

    for (const addPath of config.additionalPaths) {
      const pathDef = specPaths[addPath];
      if (!pathDef) {
        console.warn(`⚠ SERVICE_CONFIG "${tag}": additionalPath "${addPath}" not found in spec`);
        continue;
      }
      const pathLevelParams = pathDef.parameters ?? [];
      for (const method of HTTP_METHODS) {
        const op = pathDef[method];
        if (!op) continue;
        // Avoid duplicates
        if (ops.some((o) => o.path === addPath && o.method === method)) continue;
        ops.push(parseOperation(method, addPath, op, pathLevelParams));
      }
    }
  }

  // Generate services
  const services: ServiceDefinition[] = [];

  for (const [tag, ops] of tagOperations) {
    const config = SERVICE_CONFIG[tag];
    const svc = generateService(tag, ops, schemas, config);
    services.push(svc);
  }

  // Write output
  fs.mkdirSync(SERVICES_OUTPUT, { recursive: true });

  // Clean existing generated services
  for (const file of fs.readdirSync(SERVICES_OUTPUT)) {
    fs.unlinkSync(path.join(SERVICES_OUTPUT, file));
  }

  for (const svc of services) {
    const filePath = path.join(SERVICES_OUTPUT, `${svc.fileName}.base.ts`);
    const content = emitServiceFile(svc);
    fs.writeFileSync(filePath, content);
  }

  // Write barrel export
  const barrelLines: string[] = [
    "// Auto-generated — DO NOT EDIT. Run `npm run generate` to regenerate.",
    "",
  ];
  for (const svc of services.sort((a, b) => a.fileName.localeCompare(b.fileName))) {
    barrelLines.push(
      `export { ${svc.className} } from "./${svc.fileName}.base.js";`,
    );
    // Also export query param interfaces
    barrelLines.push(
      `export type * from "./${svc.fileName}.base.js";`,
    );
  }
  barrelLines.push("");
  fs.writeFileSync(path.join(SERVICES_OUTPUT, "index.ts"), barrelLines.join("\n"));

  console.log(
    `Generated ${services.length} base services in src/generated/services/`,
  );
  console.log(
    `Total methods: ${services.reduce((sum, s) => sum + s.methods.length + s.listAllMethods.length, 0)}`,
  );
}

main().catch((err) => {
  console.error("Service generation failed:", err);
  process.exit(1);
});
