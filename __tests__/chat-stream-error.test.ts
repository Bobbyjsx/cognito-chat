import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAT_ERROR_AUTH_FAILED,
  CHAT_ERROR_MODEL_NOT_FOUND,
  SAFE_UNAVAILABLE_MESSAGE,
  sanitizeStreamErrorText,
} from "../src/lib/chat-stream";

describe("Chat Stream Error Sanitization", () => {
  it("sanitizes AWS Bedrock expired bearer token error", () => {
    const rawError =
      "AWS Bedrock authentication failed: Error code: 403 - {'Message': 'Bearer Token has expired'}. Please verify AWS_BEARER_TOKEN_BEDROCK or IAM credentials.";
    const result = sanitizeStreamErrorText(rawError, CHAT_ERROR_AUTH_FAILED);
    assert.equal(result, SAFE_UNAVAILABLE_MESSAGE);
    assert.equal(result.includes("AWS"), false);
    assert.equal(result.includes("Bearer Token"), false);
    assert.equal(result.includes("credentials"), false);
  });

  it("sanitizes AWS Bedrock error even when code is omitted", () => {
    const rawError =
      "AWS Bedrock authentication failed: Error code: 403 - {'Message': 'Bearer Token has expired'}.";
    const result = sanitizeStreamErrorText(rawError);
    assert.equal(result, SAFE_UNAVAILABLE_MESSAGE);
  });

  it("sanitizes model not found errors", () => {
    const rawError =
      "models/gemini-old is not found for API version v1beta, or is not supported for generateContent.";
    const result = sanitizeStreamErrorText(
      rawError,
      CHAT_ERROR_MODEL_NOT_FOUND,
    );
    assert.equal(
      result,
      "This model is no longer available. Please pick a different model and try again.",
    );
  });

  it("sanitizes API key and secret leakage", () => {
    const rawError = "Failed request with api_key=AIzaSy... secret_key=xyz";
    const result = sanitizeStreamErrorText(rawError);
    assert.equal(result, SAFE_UNAVAILABLE_MESSAGE);
  });

  it("sanitizes stack traces or excessively long backend errors", () => {
    const traceback =
      'Traceback (most recent call last):\n  File "app/main.py", line 42, in foo\nException: boom';
    const result = sanitizeStreamErrorText(traceback);
    assert.equal(result, SAFE_UNAVAILABLE_MESSAGE);

    const longError = "x".repeat(301);
    const longResult = sanitizeStreamErrorText(longError);
    assert.equal(
      longResult,
      "An error occurred while generating the response. Please try again.",
    );
  });

  it("preserves safe generic client messages", () => {
    const safeMessage = "Rate limit exceeded. Please wait a moment.";
    const result = sanitizeStreamErrorText(safeMessage);
    assert.equal(result, safeMessage);
  });
});
