#!/usr/bin/env tsx
/**
 * Audits OpenAPI spec examples against schema declarations.
 *
 * Compares each payload example in the spec with its corresponding schema
 * to find discrepancies: extra fields, missing required fields, type mismatches,
 * and enum value violations.
 *
 * Usage: npm run audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SPEC_PATH = path.resolve(ROOT, "src/generated/openapi.yaml");

// ────────────────────────────────────────────────────────────────────────────
// Spec types
// ────────────────────────────────────────────────────────────────────────────

interface SpecPropDef {
  type?: string;
  enum?: string[];
  items?: { $ref?: string; type?: string };
  $ref?: string;
  allOf?: Array<{ $ref?: string; properties?: Record<string, SpecPropDef>; required?: string[] }>;
  oneOf?: Array<{ $ref?: string }>;
  properties?: Record<string, SpecPropDef>;
  additionalProperties?: SpecPropDef | boolean;
  required?: string[];
}

interface SpecSchemaDef {
  properties?: Record<string, SpecPropDef>;
  allOf?: Array<{
    $ref?: string;
    type?: string;
    properties?: Record<string, SpecPropDef>;
    required?: string[];
    oneOf?: Array<{ $ref?: string }>;
  }>;
  oneOf?: Array<{ $ref?: string; properties?: Record<string, SpecPropDef> }>;
  required?: string[];
  type?: string;
  enum?: string[];
  items?: { $ref?: string; type?: string };
  additionalProperties?: SpecPropDef | boolean;
}

interface FlatField {
  type: string;
  enum?: string[];
  required: boolean;
  isArray: boolean;
  itemSchemaName?: string;
  nestedSchema?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Schema resolution
// ────────────────────────────────────────────────────────────────────────────

function refToName(ref: string): string {
  return ref.split("/").pop()!;
}

function flattenSchema(
  schemaName: string,
  schemas: Record<string, SpecSchemaDef>,
  visited = new Set<string>(),
): Record<string, FlatField> {
  if (visited.has(schemaName)) return {};
  visited.add(schemaName);

  const schema = schemas[schemaName];
  if (!schema) return {};

  const fields: Record<string, FlatField> = {};
  const requiredSet = new Set(schema.required ?? []);

  // Collect from direct properties
  if (schema.properties) {
    for (const [name, prop] of Object.entries(schema.properties)) {
      fields[name] = resolvePropField(prop, requiredSet.has(name));
    }
  }

  // Collect from allOf entries
  if (schema.allOf) {
    for (const entry of schema.allOf) {
      if (entry.$ref) {
        const parentFields = flattenSchema(refToName(entry.$ref), schemas, new Set(visited));
        // Parent fields are added first, child properties override
        for (const [name, field] of Object.entries(parentFields)) {
          if (!fields[name]) fields[name] = field;
        }
      }
      if (entry.properties) {
        const entryRequired = new Set(entry.required ?? []);
        for (const [name, prop] of Object.entries(entry.properties)) {
          fields[name] = resolvePropField(prop, entryRequired.has(name) || requiredSet.has(name));
        }
      }
    }
  }

  return fields;
}

function resolvePropField(prop: SpecPropDef, required: boolean): FlatField {
  // Handle $ref
  if (prop.$ref) {
    return { type: "object", required, isArray: false, nestedSchema: refToName(prop.$ref) };
  }

  // Handle allOf (typically a wrapped $ref)
  if (prop.allOf) {
    const ref = prop.allOf.find((e) => e.$ref);
    if (ref?.$ref) {
      return { type: "object", required, isArray: false, nestedSchema: refToName(ref.$ref) };
    }
  }

  // Handle array
  if (prop.type === "array") {
    const itemRef = prop.items?.$ref ? refToName(prop.items.$ref) : undefined;
    return {
      type: "array",
      required,
      isArray: true,
      itemSchemaName: itemRef,
    };
  }

  return {
    type: prop.type ?? "unknown",
    enum: prop.enum,
    required,
    isArray: false,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Example resolution
// ────────────────────────────────────────────────────────────────────────────

interface ExampleMapping {
  exampleName: string;
  exampleValue: unknown;
  schemaName: string;
  context: string; // "request" or "response"
  operation: string; // "POST /tableau/visualizations"
}

function resolveExampleRef(
  ref: string,
  allExamples: Record<string, { value?: unknown }>,
): unknown {
  const name = refToName(ref);
  return allExamples[name]?.value;
}

function collectExampleMappings(
  spec: {
    paths?: Record<string, Record<string, any>>;
    components?: {
      examples?: Record<string, { value?: unknown }>;
      schemas?: Record<string, SpecSchemaDef>;
    };
  },
): ExampleMapping[] {
  const mappings: ExampleMapping[] = [];
  const allExamples = spec.components?.examples ?? {};
  const methods = ["get", "post", "put", "patch", "delete"];

  for (const [specPath, pathDef] of Object.entries(spec.paths ?? {})) {
    for (const method of methods) {
      const op = pathDef[method];
      if (!op) continue;

      const opLabel = `${method.toUpperCase()} ${specPath}`;

      // Request body examples
      const rbContent = op.requestBody?.content?.["application/json"];
      if (rbContent) {
        const schemaRef = rbContent.schema?.$ref;
        const schemaName = schemaRef ? refToName(schemaRef) : undefined;

        if (schemaName) {
          // Single example
          if (rbContent.example) {
            mappings.push({
              exampleName: `${opLabel} (inline request)`,
              exampleValue: rbContent.example,
              schemaName,
              context: "request",
              operation: opLabel,
            });
          }

          // Named examples
          if (rbContent.examples) {
            for (const [name, ex] of Object.entries(rbContent.examples) as [string, any][]) {
              const value = ex.$ref
                ? resolveExampleRef(ex.$ref, allExamples)
                : ex.value;
              if (value !== undefined) {
                const exName = ex.$ref ? refToName(ex.$ref) : name;
                mappings.push({
                  exampleName: exName,
                  exampleValue: value,
                  schemaName,
                  context: "request",
                  operation: opLabel,
                });
              }
            }
          }
        }
      }

      // Response examples
      for (const [code, resp] of Object.entries(op.responses ?? {}) as [string, any][]) {
        const respContent = resp.content?.["application/json"];
        if (!respContent) continue;

        const schemaRef = respContent.schema?.$ref;
        const schemaName = schemaRef ? refToName(schemaRef) : undefined;
        if (!schemaName) continue;

        if (respContent.example) {
          mappings.push({
            exampleName: `${opLabel} ${code} (inline response)`,
            exampleValue: respContent.example,
            schemaName,
            context: "response",
            operation: opLabel,
          });
        }

        if (respContent.examples) {
          for (const [name, ex] of Object.entries(respContent.examples) as [string, any][]) {
            const value = ex.$ref
              ? resolveExampleRef(ex.$ref, allExamples)
              : ex.value;
            if (value !== undefined) {
              const exName = ex.$ref ? refToName(ex.$ref) : name;
              mappings.push({
                exampleName: exName,
                exampleValue: value,
                schemaName,
                context: "response",
                operation: opLabel,
              });
            }
          }
        }
      }
    }
  }

  return mappings;
}

// ────────────────────────────────────────────────────────────────────────────
// Comparison
// ────────────────────────────────────────────────────────────────────────────

interface Finding {
  severity: "error" | "warning" | "info";
  kind: string;
  message: string;
  exampleName: string;
  path: string; // dot-separated path within the example
}

function compareExampleToSchema(
  exampleValue: unknown,
  schemaName: string,
  schemas: Record<string, SpecSchemaDef>,
  exampleName: string,
  findings: Finding[],
  pathPrefix = "",
): void {
  if (exampleValue === null || exampleValue === undefined) return;
  if (typeof exampleValue !== "object") return;

  const fields = flattenSchema(schemaName, schemas);
  const example = exampleValue as Record<string, unknown>;
  const fieldPath = (name: string) => pathPrefix ? `${pathPrefix}.${name}` : name;

  // Check for extra fields in example
  for (const key of Object.keys(example)) {
    if (!fields[key]) {
      const value = example[key];
      const valueType = Array.isArray(value) ? "array" : typeof value;
      findings.push({
        severity: "warning",
        kind: "EXTRA_FIELD",
        message: `"${key}" (${valueType}) in example but not in schema ${schemaName}`,
        exampleName,
        path: fieldPath(key),
      });
    }
  }

  // Check for missing required fields
  for (const [name, field] of Object.entries(fields)) {
    if (field.required && !(name in example)) {
      findings.push({
        severity: "info",
        kind: "MISSING_REQUIRED",
        message: `"${name}" required in schema ${schemaName} but absent from example`,
        exampleName,
        path: fieldPath(name),
      });
    }
  }

  // Check enum values
  for (const [name, field] of Object.entries(fields)) {
    if (field.enum && name in example) {
      const value = example[name];
      if (typeof value === "string" && !field.enum.includes(value)) {
        findings.push({
          severity: "warning",
          kind: "ENUM_MISMATCH",
          message: `"${name}" value "${value}" not in enum [${field.enum.join(", ")}] of ${schemaName}`,
          exampleName,
          path: fieldPath(name),
        });
      }
    }
  }

  // Check type mismatches for primitive fields
  for (const [name, field] of Object.entries(fields)) {
    if (!(name in example) || example[name] === null) continue;
    const value = example[name];
    const actual = Array.isArray(value) ? "array" : typeof value;

    if (field.isArray && actual !== "array") {
      findings.push({
        severity: "warning",
        kind: "TYPE_MISMATCH",
        message: `"${name}" expected array but got ${actual} in ${schemaName}`,
        exampleName,
        path: fieldPath(name),
      });
    } else if (!field.isArray && field.type === "string" && actual !== "string") {
      findings.push({
        severity: "info",
        kind: "TYPE_MISMATCH",
        message: `"${name}" expected string but got ${actual} in ${schemaName}`,
        exampleName,
        path: fieldPath(name),
      });
    } else if (!field.isArray && (field.type === "integer" || field.type === "number") && actual !== "number") {
      findings.push({
        severity: "info",
        kind: "TYPE_MISMATCH",
        message: `"${name}" expected number but got ${actual} in ${schemaName}`,
        exampleName,
        path: fieldPath(name),
      });
    } else if (!field.isArray && field.type === "boolean" && actual !== "boolean") {
      findings.push({
        severity: "info",
        kind: "TYPE_MISMATCH",
        message: `"${name}" expected boolean but got ${actual} in ${schemaName}`,
        exampleName,
        path: fieldPath(name),
      });
    }
  }

  // Recurse into nested objects
  for (const [name, field] of Object.entries(fields)) {
    if (!(name in example) || example[name] === null) continue;
    const value = example[name];

    if (field.nestedSchema && typeof value === "object" && !Array.isArray(value)) {
      compareExampleToSchema(value, field.nestedSchema, schemas, exampleName, findings, fieldPath(name));
    }

    // Recurse into array items
    if (field.isArray && field.itemSchemaName && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === "object" && value[i] !== null) {
          compareExampleToSchema(
            value[i],
            field.itemSchemaName,
            schemas,
            exampleName,
            findings,
            `${fieldPath(name)}[${i}]`,
          );
        }
      }
    }
  }

  // Also recurse into extra fields that look like objects/arrays (to catch nested undeclared schemas)
  for (const key of Object.keys(example)) {
    if (fields[key]) continue; // already handled above
    const value = example[key];
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === "object" && value[i] !== null) {
          // Can't recurse without a schema, but note it
        }
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Report
// ────────────────────────────────────────────────────────────────────────────

function printReport(findings: Finding[]): void {
  // Group by schema (extracted from message)
  const bySchema = new Map<string, Finding[]>();
  for (const f of findings) {
    const schemaMatch = f.message.match(/(?:schema |in |of )(\w+Representation|\w+Input|\w+Config\w*)/);
    const schema = schemaMatch?.[1] ?? "Other";
    if (!bySchema.has(schema)) bySchema.set(schema, []);
    bySchema.get(schema)!.push(f);
  }

  // Deduplicate findings within each schema (same kind + field across different examples)
  const summaryBySchema = new Map<string, Map<string, { finding: Finding; examples: Set<string> }>>();

  for (const [schema, schemaFindings] of bySchema) {
    const deduped = new Map<string, { finding: Finding; examples: Set<string> }>();
    for (const f of schemaFindings) {
      // Key by kind + the field name (first quoted string in message)
      const fieldMatch = f.message.match(/"([^"]+)"/);
      const field = fieldMatch?.[1] ?? f.path;
      const key = `${f.kind}:${field}`;
      if (!deduped.has(key)) {
        deduped.set(key, { finding: f, examples: new Set() });
      }
      deduped.get(key)!.examples.add(f.exampleName);
    }
    summaryBySchema.set(schema, deduped);
  }

  // Sort schemas alphabetically
  const sortedSchemas = [...summaryBySchema.keys()].sort();

  const icons: Record<string, string> = {
    error: "X",
    warning: "!",
    info: "-",
  };

  let totalFindings = 0;

  for (const schema of sortedSchemas) {
    const deduped = summaryBySchema.get(schema)!;
    console.log(`\n=== ${schema} ===`);
    for (const [, { finding, examples }] of deduped) {
      totalFindings++;
      const icon = icons[finding.severity] ?? "?";
      const exCount = examples.size > 1 ? ` (${examples.size} examples)` : ` (${[...examples][0]})`;
      console.log(`  [${icon}] ${finding.kind}: ${finding.message}${exCount}`);
    }
  }

  // Summary
  const errorCount = findings.filter((f) => f.severity === "error").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const infoCount = findings.filter((f) => f.severity === "info").length;

  console.log(`\n--- Summary ---`);
  console.log(`${totalFindings} unique findings across ${sortedSchemas.length} schemas`);
  console.log(`  [X] errors: ${errorCount}  [!] warnings: ${warningCount}  [-] info: ${infoCount}`);
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

function main() {
  console.log("Auditing OpenAPI spec examples vs schema declarations...\n");

  const specYaml = fs.readFileSync(SPEC_PATH, "utf8");
  const spec = parse(specYaml) as {
    paths?: Record<string, Record<string, any>>;
    components?: {
      examples?: Record<string, { value?: unknown }>;
      schemas?: Record<string, SpecSchemaDef>;
    };
  };

  const schemas = spec.components?.schemas ?? {};
  const mappings = collectExampleMappings(spec);

  console.log(`Found ${mappings.length} example-to-schema mappings`);

  const findings: Finding[] = [];

  for (const mapping of mappings) {
    compareExampleToSchema(
      mapping.exampleValue,
      mapping.schemaName,
      schemas,
      mapping.exampleName,
      findings,
    );
  }

  printReport(findings);
}

main();
