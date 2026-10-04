import type {
  AuthConfig,
  StaticTokenAuth,
  RefreshableTokenAuth,
  OAuth2Auth,
} from "./types.js";

export interface TokenProvider {
  getToken(): Promise<string>;
}

class StaticTokenProvider implements TokenProvider {
  private readonly token: string;

  constructor(config: StaticTokenAuth) {
    this.token = config.accessToken;
  }

  async getToken(): Promise<string> {
    return this.token;
  }
}

class RefreshableTokenProvider implements TokenProvider {
  private accessToken: string;
  private refreshToken: string;
  private readonly refreshFn: RefreshableTokenAuth["refreshFn"];
  private expiresAt: number | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(config: RefreshableTokenAuth) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.refreshFn = config.refreshFn;
  }

  async getToken(): Promise<string> {
    // If we don't know expiry yet, or token hasn't expired, return current
    if (this.expiresAt === null || Date.now() < this.expiresAt - 30_000) {
      return this.accessToken;
    }
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.doRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<string> {
    const result = await this.refreshFn(this.refreshToken);
    this.accessToken = result.accessToken;
    if (result.refreshToken) {
      this.refreshToken = result.refreshToken;
    }
    this.expiresAt = result.expiresIn
      ? Date.now() + result.expiresIn * 1000
      : null;
    return this.accessToken;
  }
}

class OAuth2TokenProvider implements TokenProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tokenUrl: string;
  private accessToken: string | null = null;
  private expiresAt = 0;
  private tokenPromise: Promise<string> | null = null;
  private fetchFn: typeof globalThis.fetch;

  constructor(config: OAuth2Auth, fetchFn?: typeof globalThis.fetch) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.tokenUrl = config.tokenUrl;
    this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt - 30_000) {
      return this.accessToken;
    }
    if (this.tokenPromise) {
      return this.tokenPromise;
    }
    this.tokenPromise = this.fetchToken();
    try {
      return await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }
  }

  private async fetchToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await this.fetchFn(this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(
        `OAuth2 token request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in?: number;
    };
    this.accessToken = data.access_token;
    if (data.expires_in) {
      this.expiresAt = Date.now() + data.expires_in * 1000;
    }
    return this.accessToken;
  }
}

export function createTokenProvider(
  config: AuthConfig,
  fetchFn?: typeof globalThis.fetch,
): TokenProvider {
  switch (config.type) {
    case "static":
      return new StaticTokenProvider(config);
    case "refresh":
      return new RefreshableTokenProvider(config);
    case "oauth2":
      return new OAuth2TokenProvider(config, fetchFn);
  }
}
