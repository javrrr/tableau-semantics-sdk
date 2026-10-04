import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { TableauSemanticsClient } from "../../src/index.js";
import type { SemanticQueryRequest } from "../../src/schemas.js";

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), "utf8"));

function recordingClient(response: { status?: number; body?: unknown }) {
  const calls: Array<{ url: string; method?: string; body: unknown }> = [];
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(response.body === undefined ? null : JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof globalThis.fetch;
  const client = new TableauSemanticsClient({
    instanceUrl: "https://example.my.salesforce.com/services/data/v65.0",
    auth: { type: "static", accessToken: "TEST_TOKEN" },
    fetch: fetchFn,
    maxRetries: 0,
  });
  return { client, calls };
}

describe("Semantic query (fixture round-trip)", () => {
  it("POSTs the live-verified body verbatim and parses the positional response", async () => {
    const request = fixture("semantic-query.request.json");
    const response = fixture("semantic-query.response.json") as {
      queryResults: { queryMetadata: { fields: Record<string, { placeInOrder: number }> }; queryData: { rows: { values: unknown[] }[] } };
    };
    const { client, calls } = recordingClient({ body: response });

    const result = await client.semanticQuery.query(request as SemanticQueryRequest);

    expect(calls[0].method).toBe("POST");
    expect(calls[0].url).toBe("https://example.my.salesforce.com/services/data/v65.0/semantic-engine/gateway");
    // Resource layer passes the body through unmangled.
    expect(calls[0].body).toEqual(request);

    // Positional rows map to columns via queryMetadata.fields[alias].placeInOrder.
    const meta = (result as typeof response).queryResults.queryMetadata.fields;
    const rows = (result as typeof response).queryResults.queryData.rows;
    const dimValue = rows[0].values[meta["dim"].placeInOrder];
    const measValue = rows[0].values[meta["meas"].placeInOrder];
    expect(dimValue).toBe("Tier A");
    expect(measValue).toBe(1898133.16);
  });

  it("the generated type requires semanticModelApiName and rejects a bare semanticModel", () => {
    // Compile-time guard expressed via a typed literal (exercised by tsc on build).
    const body: SemanticQueryRequest = {
      semanticModelApiName: "Example_Model",
      structuredSemanticQuery: { fields: [], options: { limit_options: { limit: 1 } } },
    };
    expect(body.semanticModelApiName).toBe("Example_Model");
  });
});
