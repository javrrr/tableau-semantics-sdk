# tableau-semantics-sdk

TypeScript SDK for the Salesforce **Tableau Semantics Layer** REST API (API
version **v65**) — semantic model authoring/administration and semantic queries.

A thin, hand-written resource layer over types generated from the Semantics
Layer OpenAPI specs. The layer ships as **two** published specs (authoring +
queries); `merge-specs` combines them into one document, `openapi-typescript`
emits the type surface, `generate-services` emits one base service per spec, the
`src/resources/*` modules add ergonomic extensions, and `TableauSemanticsClient`
composes them. Same architecture as
[`tableau-next-sdk`](https://github.com/javrrr/tableau-next-sdk) and
[`data-360-sdk`](https://github.com/javrrr/data-360-sdk).

## Scope

| Accessor | Surface | Path |
|---|---|---|
| `client.semanticModels` | Model authoring/administration | `/ssot/semantic/models` |
| `client.semanticQuery` | Semantic query gateway | `/semantic-engine/gateway` |

## Quick start

```ts
import { TableauSemanticsClient } from "tableau-semantics-sdk";

const client = new TableauSemanticsClient({
  instanceUrl: "https://my.salesforce.com/services/data/v65.0",
  auth: { type: "static", accessToken: process.env.SF_ACCESS_TOKEN! },
});

// Authoring: get / put (upsert) / patch / update / delete, plus
// getShallow / createClone / getValidate.
const model = await client.semanticModels.get("My_Model");

// Query a deployed model via the gateway.
const result = await client.semanticQuery.query({
  dataspace: "default",
  source: "source",
  structuredSemanticQuery: {
    /* fields, options, semanticModel — see src/resources/semantic-query.ts */
  },
});
```

> **Validation status:** the authoring surface mirrors shapes afd360 has
> exercised against a live org (historically v64; this SDK is v65 — confirm the
> delta before relying on it for a migration). The semantic-query request shape
> is derived from the v65 spec and has **not** yet been live-validated through
> this SDK; notably it differs from the older v64 hand-rolled envelope (inline
> `structuredSemanticQuery.semanticModel` vs. a sibling `semanticModelApiName`).
> See `src/resources/semantic-query.ts` for details.

## Development

```sh
npm install
npm run generate   # merge-specs -> generate-types -> generate-services
npm run build
npm test
npm run typecheck
```

Source specs live under `src/generated/sources/` (committed for provenance); the
merged `src/generated/openapi.yaml` and all generated artifacts are overwritten
by `npm run generate`. See [`scripts/README.md`](./scripts/README.md).

## License

MIT
