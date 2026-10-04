#!/usr/bin/env tsx
/**
 * Merges the two Tableau Semantics Layer OpenAPI specs into a single document
 * that the generator pipeline consumes.
 *
 * The Semantics Layer is published as two separate specs (both v65):
 *   - authoring.yaml  — "Authoring Administration Operations" (/ssot/semantic/models/*)
 *   - queries.yaml    — "Queries Operations" (/semantic-engine/gateway)
 *
 * Neither spec declares operation `tags`, and the service generator groups
 * operations by tag. So this step injects a tag per source spec, then merges
 * paths and component schemas into src/generated/openapi.yaml. Schema-name
 * collisions across the two specs fail the merge loudly.
 *
 * Source specs are committed under src/generated/sources/ for provenance and
 * diffing; the merged openapi.yaml is also committed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCES = path.resolve(ROOT, "src/generated/sources");
const OUTPUT = path.resolve(ROOT, "src/generated/openapi.yaml");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

interface SourceSpec {
  file: string;
  /** Tag injected onto every operation from this spec. */
  tag: string;
}

const SOURCE_SPECS: SourceSpec[] = [
  { file: "authoring.yaml", tag: "Semantic Models" },
  { file: "queries.yaml", tag: "Semantic Query" },
];

interface OpenApiDoc {
  openapi?: string;
  info?: Record<string, unknown>;
  servers?: unknown[];
  paths?: Record<string, Record<string, { tags?: string[] }>>;
  components?: { schemas?: Record<string, unknown>; [k: string]: unknown };
}

function main(): void {
  const merged: OpenApiDoc = {
    openapi: "3.0.3",
    info: {
      title: "Tableau Semantics Layer REST API",
      description:
        "Merged Tableau Semantics Layer API: semantic model authoring/administration (/ssot/semantic/models) and semantic queries (/semantic-engine/gateway).",
      version: "v65.0",
    },
    servers: undefined,
    paths: {},
    components: { schemas: {} },
  };

  for (const { file, tag } of SOURCE_SPECS) {
    const full = path.join(SOURCES, file);
    if (!fs.existsSync(full)) {
      console.error(`Missing source spec: ${path.relative(ROOT, full)}`);
      process.exit(1);
    }
    const spec = parse(fs.readFileSync(full, "utf8")) as OpenApiDoc;

    // First spec's servers win (both specs share /services/data/v65.0).
    if (!merged.servers && spec.servers) merged.servers = spec.servers;

    // Merge paths, injecting the per-spec tag onto each operation.
    for (const [p, pathItem] of Object.entries(spec.paths ?? {})) {
      if (merged.paths![p]) {
        console.error(`Path collision across specs: ${p}`);
        process.exit(1);
      }
      for (const m of HTTP_METHODS) {
        const op = pathItem[m];
        if (op) op.tags = [tag];
      }
      merged.paths![p] = pathItem;
    }

    // Merge component schemas (fail loudly on name collision).
    for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
      if (merged.components!.schemas![name]) {
        console.error(`Schema name collision across specs: ${name}`);
        process.exit(1);
      }
      merged.components!.schemas![name] = schema;
    }

    // Merge any other components sub-sections (responses, parameters, …).
    for (const [key, val] of Object.entries(spec.components ?? {})) {
      if (key === "schemas") continue;
      const bucket = (merged.components![key] ??= {}) as Record<string, unknown>;
      for (const [n, v] of Object.entries(val as Record<string, unknown>)) {
        if (bucket[n]) {
          console.error(`components.${key} collision across specs: ${n}`);
          process.exit(1);
        }
        bucket[n] = v;
      }
    }

    const opCount = Object.values(spec.paths ?? {}).reduce(
      (sum, pi) => sum + HTTP_METHODS.filter((m) => pi[m]).length,
      0,
    );
    console.log(
      `Merged ${file} → tag "${tag}" (${Object.keys(spec.paths ?? {}).length} paths, ${opCount} ops, ${Object.keys(spec.components?.schemas ?? {}).length} schemas)`,
    );
  }

  fs.writeFileSync(OUTPUT, stringify(merged));
  console.log(
    `Wrote ${path.relative(ROOT, OUTPUT)} (${Object.keys(merged.paths!).length} paths, ${Object.keys(merged.components!.schemas!).length} schemas)`,
  );
}

main();
