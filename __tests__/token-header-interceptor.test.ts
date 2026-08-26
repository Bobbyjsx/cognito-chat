import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { authManager } from "../src/lib/auth-manager";

describe("Frontend Token Header Interceptor & Session Sync", () => {
  beforeEach(() => {
    authManager.clearBrowserSessionCache();
  });

  describe("Request Header Injection", () => {
    it("should inject Bearer access token and X-Refresh-Token to outgoing Axios requests", async () => {
      await authManager.updateTokens(
        "access_token_abc_123",
        "refresh_token_xyz_789",
      );

      const mockConfig: any = { headers: {} };
      await authManager.applyAuthTokenToReq(mockConfig);

      assert.equal(
        mockConfig.headers["Authorization"],
        "Bearer access_token_abc_123",
      );
      assert.equal(
        mockConfig.headers["X-Refresh-Token"],
        "refresh_token_xyz_789",
      );
    });

    it("should safely handle AxiosHeaders object with .set() method", async () => {
      await authManager.updateTokens(
        "access_bearer_token",
        "refresh_header_token",
      );

      const headersMap: Record<string, string> = {};
      const mockConfig: any = {
        headers: {
          set: (k: string, v: string) => {
            headersMap[k] = v;
          },
        },
      };

      await authManager.applyAuthTokenToReq(mockConfig);

      assert.equal(headersMap["Authorization"], "Bearer access_bearer_token");
      assert.equal(headersMap["X-Refresh-Token"], "refresh_header_token");
    });

    it("should omit auth headers when session is null/unauthenticated", async () => {
      authManager.clearBrowserSessionCache();

      const mockConfig: any = { headers: {} };
      await authManager.applyAuthTokenToReq(mockConfig);

      assert.equal(mockConfig.headers["Authorization"], undefined);
      assert.equal(mockConfig.headers["X-Refresh-Token"], undefined);
    });
  });

  describe("Response Header Interception & In-Memory Update", () => {
    it("should extract x-new-access-token and x-new-refresh-token from response headers", async () => {
      await authManager.updateTokens("initial_access", "initial_refresh");

      // Axios normalizes response headers to lowercase
      const responseHeaders: Record<string, string> = {
        "x-new-access-token": "fastapi_refreshed_access_token",
        "x-new-refresh-token": "fastapi_rotated_refresh_token",
      };

      const newAccessToken = responseHeaders["x-new-access-token"];
      const newRefreshToken = responseHeaders["x-new-refresh-token"];

      if (newAccessToken) {
        await authManager.updateTokens(newAccessToken, newRefreshToken);
      }

      const updatedConfig: any = { headers: {} };
      await authManager.applyAuthTokenToReq(updatedConfig);

      assert.equal(
        updatedConfig.headers["Authorization"],
        "Bearer fastapi_refreshed_access_token",
      );
      assert.equal(
        updatedConfig.headers["X-Refresh-Token"],
        "fastapi_rotated_refresh_token",
      );
    });

    it("should retain existing refresh token if FastAPI only returns updated access token", async () => {
      await authManager.updateTokens("old_access", "persistent_refresh_token");

      await authManager.updateTokens("brand_new_access");

      const updatedConfig: any = { headers: {} };
      await authManager.applyAuthTokenToReq(updatedConfig);

      assert.equal(
        updatedConfig.headers["Authorization"],
        "Bearer brand_new_access",
      );
      assert.equal(
        updatedConfig.headers["X-Refresh-Token"],
        "persistent_refresh_token",
      );
    });
  });

  describe("401 Error Handling (No Retry Loops)", () => {
    it("should clear session cache upon 401 unauthorized", async () => {
      await authManager.updateTokens("access_to_expire", "refresh_to_expire");

      // Simulate 401 received
      authManager.clearBrowserSessionCache();

      const config: any = { headers: {} };
      await authManager.applyAuthTokenToReq(config);

      assert.equal(config.headers["Authorization"], undefined);
      assert.equal(config.headers["X-Refresh-Token"], undefined);
    });
  });
});
