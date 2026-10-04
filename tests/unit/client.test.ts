import { describe, it, expect } from "vitest";
import {
  TableauSemanticsClient,
  NotFoundError,
  BadRequestError,
} from "../../src/index.js";

function mockFetch(responses: Array<{ status?: number; body?: unknown }>) {
  const calls: Array<{ url: string; method?: string; body: unknown; headers: Record<string, string> }> = [];
  let i = 0;
  const fn = async (url: string | URL, init?: RequestInit): Promise<Response> => {
    calls.push({
      url: String(url),
      method: init?.method,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      headers: (init?.headers as Record<string, string>) ?? {},
    });
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
      status: r.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  };
  return { fn: fn as unknown as typeof globalThis.fetch, calls };
}

const INSTANCE = "https://example.my.salesforce.com/services/data/v65.0";

function makeClient(fetchFn: typeof globalThis.fetch) {
  return new TableauSemanticsClient({
    instanceUrl: INSTANCE,
    auth: { type: "static", accessToken: "TEST_TOKEN" },
    fetch: fetchFn,
    maxRetries: 0,
  });
}

describe("TableauSemanticsClient wiring", () => {
  it("exposes one accessor per spec tag", () => {
    const client = makeClient(mockFetch([{}]).fn);
    expect(client.semanticModels).toBeDefined();
    expect(client.semanticQuery).toBeDefined();
  });
});

describe("Semantic models routing", () => {
  it("GET get() hits /ssot/semantic/models/{id} with a bearer token", async () => {
    const { fn, calls } = mockFetch([{ body: { id: "0SM1", apiName: "Example_Model" } }]);
    const model = await makeClient(fn).semanticModels.get("Example_Model");
    expect(calls[0].url).toBe(`${INSTANCE}/ssot/semantic/models/Example_Model`);
    expect(calls[0].headers["Authorization"]).toBe("Bearer TEST_TOKEN");
    expect((model as { apiName?: string }).apiName).toBe("Example_Model");
  });

  it("create() POSTs to the collection /ssot/semantic/models (live create verb)", async () => {
    const { fn, calls } = mockFetch([{ status: 201, body: { apiName: "Example_Model" } }]);
    await makeClient(fn).semanticModels.create({
      apiName: "Example_Model",
      dataspace: "default",
      sourceCreation: "DataCloud",
      queryUnrelatedDataObjects: "Union",
    } as never);
    expect(calls[0].method).toBe("POST");
    expect(calls[0].url).toBe(`${INSTANCE}/ssot/semantic/models`);
    expect((calls[0].body as { dataspace?: string }).dataspace).toBe("default");
  });

  it("update() aliases PATCH /ssot/semantic/models/{id}", async () => {
    const { fn, calls } = mockFetch([{ body: { id: "0SM1" } }]);
    await makeClient(fn).semanticModels.update("Example_Model", { label: "Edited" } as never);
    expect(calls[0].method).toBe("PATCH");
    expect(calls[0].url).toBe(`${INSTANCE}/ssot/semantic/models/Example_Model`);
  });

  it("maps 404 to NotFoundError", async () => {
    const { fn } = mockFetch([{ status: 404, body: [{ errorCode: "NOT_FOUND", message: "nope" }] }]);
    await expect(makeClient(fn).semanticModels.get("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("Semantic query gateway", () => {
  it("query() and execute() POST the body to /semantic-engine/gateway", async () => {
    // Live-correct shape: top-level `semanticModelApiName` sibling (not an inline
    // `semanticModel`), per the SCHEMA_OVERRIDES correction to the v65 spec.
    const body = {
      semanticModelApiName: "Example_Model",
      dataspace: "default",
      structuredSemanticQuery: {
        fields: [{ expression: { table_field: { name: "Example Field", table_name: "Example_SDO" } } }],
        options: { limit_options: { limit: 10 } },
      },
    };

    const q = mockFetch([{ body: { data: [] } }]);
    await makeClient(q.fn).semanticQuery.query(body as never);
    expect(q.calls[0].method).toBe("POST");
    expect(q.calls[0].url).toBe(`${INSTANCE}/semantic-engine/gateway`);
    expect(q.calls[0].body).toEqual(body);

    const e = mockFetch([{ body: { data: [] } }]);
    await makeClient(e.fn).semanticQuery.execute(body as never);
    expect(e.calls[0].url).toBe(`${INSTANCE}/semantic-engine/gateway`);
    expect(e.calls[0].body).toEqual(body);
  });

  it("surfaces a 400 as BadRequestError", async () => {
    const { fn } = mockFetch([{ status: 400, body: [{ errorCode: "INVALID_INPUT", message: "bad" }] }]);
    await expect(
      makeClient(fn).semanticQuery.query({} as never),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
