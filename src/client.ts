import type { ClientConfig } from "./core/types.js";
import { HttpClient } from "./core/http-client.js";
import { SemanticModelsService } from "./resources/semantic-models.js";
import { SemanticQueryService } from "./resources/semantic-query.js";

/**
 * Entry point for the Salesforce Tableau Semantics Layer REST API.
 *
 * Covers two surfaces, both at API version v65:
 *   - semantic model authoring/administration (`/ssot/semantic/models`)
 *   - semantic queries (`/semantic-engine/gateway`)
 *
 * Construct with an `instanceUrl` that includes the API version (v65):
 *
 *   const client = new TableauSemanticsClient({
 *     instanceUrl: "https://my.salesforce.com/services/data/v65.0",
 *     auth: { type: "static", accessToken: process.env.SF_ACCESS_TOKEN! },
 *   });
 */
export class TableauSemanticsClient {
  /** Shared HTTP client — passed to every service. Exposed for advanced usage. */
  public readonly httpClient: HttpClient;

  public readonly semanticModels: SemanticModelsService;
  public readonly semanticQuery: SemanticQueryService;

  constructor(config: ClientConfig) {
    this.httpClient = new HttpClient(config);

    this.semanticModels = new SemanticModelsService(this.httpClient);
    this.semanticQuery = new SemanticQueryService(this.httpClient);
  }
}
