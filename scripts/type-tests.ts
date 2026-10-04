/**
 * Compile-time type assertions over the generated Tableau Semantics SDK surface.
 *
 * Type-checked by `npm run typecheck` (in the tsconfig include set), never
 * executed. Pins the public shapes so a future spec regeneration that drops or
 * renames them fails loudly here. All sample values are neutral placeholders.
 */
import { TableauSemanticsClient } from "../src/index.js";
import type {
  SemanticModelInputRepresentation,
  SemanticModelOutputRepresentation,
  SemanticQueryRequest,
  SemanticQueryResponse,
} from "../src/schemas.js";

function expectType<T>(_value: T): void {}

const client = new TableauSemanticsClient({
  instanceUrl: "https://example.my.salesforce.com/services/data/v65.0",
  auth: { type: "static", accessToken: "REPLACE_AT_RUNTIME" },
});

// One accessor per spec tag.
void client.semanticModels;
void client.semanticQuery;

// Semantic models: CRUD + ergonomic update alias.
async function semanticModelSurface(body: SemanticModelInputRepresentation): Promise<void> {
  const created: SemanticModelOutputRepresentation = await client.semanticModels.create(body);
  expectType<SemanticModelOutputRepresentation>(created);
  const got: SemanticModelOutputRepresentation = await client.semanticModels.get("Model_Api_Name");
  const put: SemanticModelOutputRepresentation = await client.semanticModels.put("Model_Api_Name", body);
  const patched: SemanticModelOutputRepresentation = await client.semanticModels.patch("Model_Api_Name", body);
  const updated: SemanticModelOutputRepresentation = await client.semanticModels.update("Model_Api_Name", body);
  await client.semanticModels.delete("Model_Api_Name");
  expectType<SemanticModelOutputRepresentation>(got);
  expectType<SemanticModelOutputRepresentation>(put);
  expectType<SemanticModelOutputRepresentation>(patched);
  expectType<SemanticModelOutputRepresentation>(updated);
}

// Semantic query: execute + ergonomic query alias.
async function semanticQuerySurface(body: SemanticQueryRequest): Promise<void> {
  const executed: SemanticQueryResponse = await client.semanticQuery.execute(body);
  const queried: SemanticQueryResponse = await client.semanticQuery.query(body);
  expectType<SemanticQueryResponse>(executed);
  expectType<SemanticQueryResponse>(queried);
}

void semanticModelSurface;
void semanticQuerySurface;
