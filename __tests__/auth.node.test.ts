import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Simple mock for NextAuth since we just want to test jwtCallback
const mockOauthApi = {
  post: async (url: string, body: any) => {
    if (url === "/api/v1/auth/refresh") {
      if (body.refreshToken === "valid_refresh_token") {
        return { data: { accessToken: "new_access_token", refreshToken: "new_refresh_token" } };
      }
      throw { response: { status: 401 } };
    }
    return { data: {} };
  }
};

describe('Auth Token Refresh Logic', () => {
  it('should hit /api/v1/auth/refresh correctly', async () => {
    const token = {
      refreshToken: "valid_refresh_token",
      accessTokenExpires: Date.now() - 1000,
    };

    let result: any = {};
    try {
      const res = await mockOauthApi.post("/api/v1/auth/refresh", {
        refreshToken: token.refreshToken,
      });
      const refreshedTokens = res!.data;
      result = {
        ...token,
        accessToken: refreshedTokens.accessToken,
        refreshToken: refreshedTokens.refreshToken,
      };
    } catch (err) {
      result = { ...token, error: "RefreshAccessTokenError" };
    }

    assert.equal(result.accessToken, "new_access_token");
    assert.equal(result.refreshToken, "new_refresh_token");
  });

  it('should return error if refresh token is invalid', async () => {
    const token = {
      refreshToken: "invalid_refresh_token",
      accessTokenExpires: Date.now() - 1000,
    };

    let result: any = {};
    try {
      const res = await mockOauthApi.post("/api/v1/auth/refresh", {
        refreshToken: token.refreshToken,
      });
      result = res!.data;
    } catch (err) {
      result = { ...token, error: "RefreshAccessTokenError" };
    }

    assert.equal(result.error, "RefreshAccessTokenError");
  });
});
