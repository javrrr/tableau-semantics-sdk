# Type Generation

The generator pipeline produces TypeScript types from the Tableau Semantics Layer OpenAPI specs. It is the single source of truth for all generated type artifacts in the SDK.

> **Two specs, merged:** the Semantics Layer ships as two published specs (both v65) — "Authoring Administration Operations" (`/ssot/semantic/models`) and "Queries Operations" (`/semantic-engine/gateway`). They're committed under `src/generated/sources/`. `scripts/merge-specs.ts` runs first (via `npm run generate`): it injects a tag per source spec ("Semantic Models" / "Semantic Query" — the specs declare no operation tags, and the service generator groups by tag), merges paths + component schemas (failing loudly on any cross-spec name collision), and writes the combined `src/generated/openapi.yaml`. `generate-types.ts` then reads that merged file (there is no single upstream URL to fetch). To refresh, re-download the two sources and re-run `npm run generate`.

> **Schema name sanitization:** `scripts/lib/schema-names.ts` maps each schema name to a clean TS identifier. These specs already use plain identifiers (no dotted FQNs), so the mapping is effectively identity here — but it is kept so the harness stays identical to the sibling SDKs and remains robust if a future spec introduces dotted names.

```
npm run generate
```

## Output files

| File | Contents | Editable? |
|---|---|---|
| `src/generated/openapi.yaml` | The fetched OpenAPI spec, saved for diffing | No |
| `src/generated/openapi.d.ts` | Raw types produced by `openapi-typescript` with post-processing fixes | No |
| `src/schemas.ts` | Flattened schema re-exports, enum types, schema overrides, and discriminated union types | No |

All three files are overwritten on every generation run. When the upstream spec changes, `git diff src/generated/openapi.yaml` shows exactly what changed in the spec before you review the generated type diffs.

## Pipeline overview

The generator runs through five steps:

1. **Fetch and save the spec** — downloads the YAML spec and writes it to `src/generated/openapi.yaml`. This file is committed to the repo so that `git diff` shows exactly what changed in the spec between generation runs.

2. **Generate raw types** — feeds the parsed spec to `openapi-typescript`, then applies the empty-abstract-input-base normalization (see below).

3. **Extract enum types** — walks every schema property looking for `type: string` + `enum` combinations. Each is emitted as a named string-literal union type. Naming convention: strip `Representation`/`InputRepresentation` suffix from the schema name, PascalCase the property name, and concatenate. Deduplication keeps the superset when multiple schemas produce the same enum name.

4. **Flatten schemas, apply overrides, and generate discriminated unions** — walks `allOf` chains to produce flat object types (see "Schema flattening"), patches spec bugs via `SCHEMA_OVERRIDES`, validates `DISCRIMINATED_UNIONS` against the spec, and emits strict TypeScript discriminated union types.

5. **Write `schemas.ts`** — assembles flattened schema re-exports, enum types, and discriminated union types into a single file.

## Updating the spec

When the upstream spec changes:

1. Run `npm run generate` — this fetches the latest spec and overwrites `src/generated/openapi.yaml`.
2. Run `git diff src/generated/openapi.yaml` to review what changed in the spec.
3. If any post-processing configs are stale (renamed schemas, new `oneOf` entries), the generator will error or warn (see sections below).
4. Run `npm run typecheck` to verify everything compiles.
5. Commit the spec, generated types, and any config updates together in a dedicated update PR.

## Post-processing: empty abstract input bases

`openapi-typescript` emits empty object schemas as `Record<string, never>`. This is correct for leaf types, but becomes a problem for abstract base schemas used in `allOf` input models: `Record<string, never> & { ... }` is contradictory (no keys allowed, but keys required).

The `EMPTY_ABSTRACT_INPUT_BASES` set lists schemas where `Record<string, never>` should be replaced with `{}`. This is applied as a regex post-processing pass on the raw generated output.

**Current members:** _(none)_ — these specs do not produce empty abstract input bases, so the set starts empty.

**When to update:** if a new empty abstract schema appears in the spec and its subtypes produce type errors due to `Record<string, never>` intersections, add it to the set.

## Schema flattening

Schemas that use `allOf` inheritance produce deeply nested intersection types (e.g., `CdpObjectBaseInputRepresentation & DataObjectInputRepresentation & { ... }`). TypeScript displays these intersections verbatim in IntelliSense hovers and error messages, making them hard to read.

The generator resolves this by walking `allOf` chains at generation time and emitting pre-flattened object types. For example, instead of:

```ts
export type DataLakeObjectInputRepresentation = Schemas["DataLakeObjectInputRepresentation"];
// Hover shows: CdpObjectBaseInputRepresentation & { category?: ... } & { category: ...; dataspaceInfo: ... }
```

The generator emits:

```ts
export type DataLakeObjectInputRepresentation = {
  dataSpaceName?: string;
  description?: string;
  label: string;
  name: string;
  category: "Engagement" | "Other" | "Profile";
  dataspaceInfo: Schemas["DataSpaceInputRepresentation"][];
  // ... all properties visible at a glance
}
```

**What gets flattened:**

- All schemas with simple `allOf` chains (no `oneOf` inside `allOf`) — currently ~330 schemas
- Schemas listed in `SCHEMA_OVERRIDES`, even if they don't use `allOf` (forced flattening so overrides can be applied cleanly)

**What doesn't get flattened:**

- Schemas with `oneOf` inside `allOf` (complex polymorphic types) — these are handled by discriminated unions instead
- Plain schemas without `allOf` and without overrides — already flat via `Schemas["X"]`

**Enum intersection behavior:** when both a parent and child in an `allOf` chain define an enum for the same property, TypeScript intersection semantics narrow to the common values. The flattener matches this behavior to stay structurally compatible with the raw generated types.

## Schema overrides

The `SCHEMA_OVERRIDES` config in `generate-types.ts` patches spec bugs where the OpenAPI definition doesn't match the actual API behavior. Overrides are applied on top of the flattened schema properties.

### Config structure

```ts
const SCHEMA_OVERRIDES: Record<string, SchemaOverride> = {
  DataStreamInputRepresentation: {
    note: "Why this override exists (emitted as JSDoc)",
    makeOptional: ["mappings", "sourceFields"],
    fieldTypes: {
      dataLakeObjectInfo: "DataLakeObjectInputRepresentation | DataLakeObjectInputRepresentation[]",
    },
  },
  DataStreamRepresentation: {
    note: "Runtime list/get includes dataSource but spec omits it",
    addOptionalFields: {
      dataSource: "string",
    },
  },
};
```

| Field | Purpose |
|---|---|
| `note` | Reason for the override. Emitted as a `@override` JSDoc comment in the generated output. |
| `makeOptional` | Fields to relax from required to optional. Use when the spec marks a field as required but the API accepts payloads without it. |
| `fieldTypes` | Fields whose type should be replaced. Values are TypeScript type expressions using names from `schemas.ts` (not `Schemas["..."]`), so error messages show the flattened types. |
| `addOptionalFields` | Optional fields to add when runtime responses include stable keys that the spec currently omits. |

### Current overrides

_(none)_ — `SCHEMA_OVERRIDES` starts empty. Add entries here as live validation reveals spec/wire mismatches. Keys are the schema identifiers from `schemas.ts`. The audit (`npm run audit`) is a good source of candidates.

### Validation

Every override is validated at generation time: if the overridden schema is removed from the spec, generation fails with a clear error so stale overrides don't silently persist.

### How to add a new override

1. Add an entry to `SCHEMA_OVERRIDES` with a `note` explaining the spec bug.
2. Use `makeOptional` to relax required fields, `fieldTypes` to change a field's type.
3. Run `npm run generate` and `npm run typecheck`.

## Discriminated unions

> `DISCRIMINATED_UNIONS` starts **empty**. Add entries here if/when a polymorphic `oneOf` input needs strict narrowing. The mechanism below is unchanged from the shared harness — the examples use data-360-sdk connector types to illustrate the two config shapes.

The OpenAPI spec uses `oneOf` to model polymorphic input types, but doesn't always include formal `discriminator` mappings. `openapi-typescript` emits these as broad unions with a `string` discriminator, so TypeScript can't narrow the associated detail/subtype shape when a specific discriminator value is checked.

The generator fixes this by emitting strict discriminated union types where each branch pairs a literal discriminator value with its corresponding schema.

### Config structure

The `DISCRIMINATED_UNIONS` array in `generate-types.ts` defines two kinds of config:

**`property` kind** — a property's `oneOf` is narrowed by a sibling discriminator property.

```ts
{
  kind: "property",
  exportName: "DataStreamConnectorInput",
  sourceSchema: "ConnectorInputRepresentation",
  discriminatorProp: "connectorType",      // the narrowing field
  discriminatedProp: "connectorDetails",   // the field whose type varies
  mapping: {
    "DataConnector": "DataConnectorDetailsConfig",
    "IngestApi": "IngestApiConnectorDetailsConfig",
    // ...
  },
}
```

Generated output:

```ts
export type DataStreamConnectorInput =
    { connectorType: "DataConnector"; connectorDetails: Schemas["DataConnectorDetailsConfig"] }
  | { connectorType: "IngestApi"; connectorDetails: Schemas["IngestApiConnectorDetailsConfig"] }
  | ...;
```

**`schema` kind** — the schema's `oneOf` lists subtypes that share common base properties and add extensions. The generator reads base properties and per-subtype extension properties directly from the spec YAML and emits flat object types.

```ts
{
  kind: "schema",
  exportName: "ConnectionCreateInput",
  sourceSchema: "ConnectionInputRepresentation",
  discriminatorProp: "connectorType",
  mapping: {
    "IngestApi": "IngestApiConnectionInputRepresentation",
    "SalesforceDotCom": "CrmConnectionInputRepresentation",
    "Snowflake": "DataConnectionInputRepresentation",
    // ...
  },
}
```

Generated output:

```ts
export type ConnectionCreateInput =
    Simplify<{ connectorType: "IngestApi"; label: string; name?: string }>
  | Simplify<{ connectorType: "SalesforceDotCom"; label: string; name?: string; organizationId: string }>
  | Simplify<{ connectorType: "Snowflake" | "Databricks" | ...; label: string; name?: string; credentials: ...; method: ...; parameters: ... }>
  | ...;
```

When multiple discriminator literals map to the same target schema (e.g., all DCF data connectors use `DataConnectionInputRepresentation`), they are grouped into a single branch with a union literal type.

### Validation

At generation time, every config entry is validated against the spec:

| Check | Severity | Trigger |
|---|---|---|
| Source schema missing | Hard error | Schema renamed or removed in spec |
| Mapping target schema missing | Hard error | Subtype schema renamed or removed in spec |
| Mapping target not in spec's `oneOf` | Hard error | `property` kind only — target not a valid `oneOf` member |
| Spec `oneOf` entry not covered by any mapping | Warning | New subtype added to spec but not yet mapped |

Warnings do not fail the build. Consumers can use the raw generated types as an escape hatch until the mapping is updated.

### Spec update behavior

| Spec change | Effect |
|---|---|
| Mapped schema renamed or removed | Generation **fails** with a hard error naming the missing schema |
| New subtype added to a `oneOf` | Generation **warns** — existing types still compile; consumers use the raw type as escape hatch until the mapping is updated |
| Property added/removed on a base or extension schema | **Automatically picked up** — properties are read from the spec YAML, not hand-maintained |
| Spec YAML changes | Visible in `git diff src/generated/openapi.yaml` — review before committing |

### How to add a new connector type

1. Run `npm run generate` to fetch the latest spec.
2. Add the new literal-to-schema entry in the appropriate `mapping` object inside `DISCRIMINATED_UNIONS`.
3. Run `npm run generate` and confirm no errors or warnings.
4. Run `npm run typecheck` to verify downstream consumers compile.

### Escape hatches

Service method signatures accept both the strict discriminated union and the raw generated type:

```ts
async create(body: ConnectionCreateInput | ConnectionInputRepresentation, ...)
```

This lets consumers pass unknown or future connector types without waiting for a mapping update.

## Type tests

`scripts/type-tests.ts` contains compile-time assertions that verify the generated types work as expected. It is included in `npm run typecheck` via tsconfig includes (it is not a runtime test). It covers:

- `TableauSemanticsClient` exposes one accessor per spec tag
- Semantic model CRUD plus the ergonomic `update` alias return `SemanticModelOutputRepresentation`
- Semantic query `execute`/`query` return `SemanticQueryResponse`
- Key input/output representations are importable

When adding new overrides or discriminated union configs, add corresponding assertions here.
