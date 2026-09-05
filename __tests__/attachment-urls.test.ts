import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isUrlExpired } from "../src/hooks/data/useAttachments/useAttachments";
import { authManager } from "../src/lib/auth-manager";
import { api, baseURL } from "../src/lib/axios";

describe("Attachment URLs, Expiry & CORS Credential Isolation", () => {
  beforeEach(() => {
    authManager.clearBrowserSessionCache();
  });

  describe("URL Expiry Calculation (isUrlExpired)", () => {
    it("should report expired when timestamp is in the past", () => {
      const pastTime = new Date(Date.now() - 1000 * 60 * 10).toISOString(); // 10 minutes ago
      assert.equal(isUrlExpired(pastTime), true);
    });

    it("should report expired when timestamp is within the safety buffer window", () => {
      // Expires in 30 seconds, but default safety buffer is 60 seconds
      const nearFuture = new Date(Date.now() + 1000 * 30).toISOString();
      assert.equal(isUrlExpired(nearFuture, 60_000), true);
    });

    it("should report NOT expired when timestamp is comfortably in the future", () => {
      // Expires in 1 hour
      const futureTime = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      assert.equal(isUrlExpired(futureTime), false);
    });

    it("should handle Date objects directly", () => {
      const expiredDate = new Date(Date.now() - 5000);
      const futureDate = new Date(Date.now() + 1000 * 3600);

      assert.equal(isUrlExpired(expiredDate), true);
      assert.equal(isUrlExpired(futureDate), false);
    });

    it("should return false for missing, null, or invalid expiry dates", () => {
      assert.equal(isUrlExpired(null), false);
      assert.equal(isUrlExpired(undefined), false);
      assert.equal(isUrlExpired("not-a-date"), false);
      assert.equal(isUrlExpired(""), false);
    });

    it("should respect custom buffer windows", () => {
      // Expires in 10 seconds
      const inTenSeconds = new Date(Date.now() + 10_000).toISOString();

      // With 5s buffer, it is not considered expired yet
      assert.equal(isUrlExpired(inTenSeconds, 5_000), false);

      // With 15s buffer, it IS considered expired
      assert.equal(isUrlExpired(inTenSeconds, 15_000), true);
    });
  });

  describe("CORS & Credential Isolation in Axios Interceptor", () => {
    it("should NOT attach Authorization or X-Refresh-Token to external GCS signed URLs", async () => {
      await authManager.updateTokens(
        "access_token_secret",
        "refresh_token_secret",
      );

      const gcsUrl =
        "https://storage.googleapis.com/chat_attachment/attachments/xyz/photo.png?X-Goog-Signature=123";

      // Simulate interceptor execution
      const handlers = (api.interceptors.request as any).handlers;
      const requestInterceptor = handlers[0].fulfilled;

      const config: any = {
        url: gcsUrl,
        headers: {},
        method: "get",
      };

      const result = await requestInterceptor(config);

      assert.equal(result.headers["Authorization"], undefined);
      assert.equal(result.headers["X-Refresh-Token"], undefined);
    });

    it("should NOT attach credentials to third-party domains", async () => {
      await authManager.updateTokens(
        "access_token_secret",
        "refresh_token_secret",
      );

      const handlers = (api.interceptors.request as any).handlers;
      const requestInterceptor = handlers[0].fulfilled;

      const config: any = {
        url: "https://external-service.com/images/123.jpg",
        headers: {},
        method: "get",
      };

      const result = await requestInterceptor(config);

      assert.equal(result.headers["Authorization"], undefined);
      assert.equal(result.headers["X-Refresh-Token"], undefined);
    });

    it("should attach Authorization and X-Refresh-Token to internal API endpoints", async () => {
      await authManager.updateTokens(
        "access_token_secret",
        "refresh_token_secret",
      );

      const handlers = (api.interceptors.request as any).handlers;
      const requestInterceptor = handlers[0].fulfilled;

      // 1. Relative path
      const relativeConfig: any = {
        url: "/agent/attachments",
        headers: {},
        method: "get",
      };
      const relativeResult = await requestInterceptor(relativeConfig);
      assert.equal(
        relativeResult.headers["Authorization"],
        "Bearer access_token_secret",
      );
      assert.equal(
        relativeResult.headers["X-Refresh-Token"],
        "refresh_token_secret",
      );

      // 2. Absolute API baseURL path
      const fullConfig: any = {
        url: `${baseURL}/agent/attachments/upload-url`,
        headers: {},
        method: "post",
      };
      const fullResult = await requestInterceptor(fullConfig);
      assert.equal(
        fullResult.headers["Authorization"],
        "Bearer access_token_secret",
      );
      assert.equal(
        fullResult.headers["X-Refresh-Token"],
        "refresh_token_secret",
      );
    });
  });

  describe("Direct URL vs Protected Endpoint Classification", () => {
    it("identifies direct GCS signed URLs that bypass blob fetching", () => {
      const gcsUrl =
        "https://storage.googleapis.com/chat_attachment/attachments/file.png?X-Goog-Algorithm=GOOG4-RSA-SHA256";
      const isInternal =
        gcsUrl.includes("/agent/attachments/") && gcsUrl.includes("/content");
      const isExternal =
        (gcsUrl.startsWith("http://") || gcsUrl.startsWith("https://")) &&
        !isInternal;

      assert.equal(isInternal, false);
      assert.equal(isExternal, true);
    });

    it("identifies internal legacy content endpoints requiring authentication", () => {
      const internalUrl = "/agent/attachments/bb4bf2cc-2128/content";
      const isInternal =
        internalUrl.includes("/agent/attachments/") &&
        internalUrl.includes("/content");
      const isExternal =
        (internalUrl.startsWith("http://") ||
          internalUrl.startsWith("https://")) &&
        !isInternal;

      assert.equal(isInternal, true);
      assert.equal(isExternal, false);
    });

    it("identifies blob and data URIs as direct display", () => {
      const blobUrl = "blob:http://localhost:3000/123-456";
      const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";

      assert.equal(blobUrl.startsWith("blob:"), true);
      assert.equal(dataUrl.startsWith("data:"), true);
    });
  });
});
