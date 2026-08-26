import assert from "node:assert";
import { describe, it } from "node:test";
import { formatModelDisplayName } from "../src/lib/models";

describe("Model Presentation Formatting", () => {
  it("should format auto to Auto", () => {
    assert.strictEqual(formatModelDisplayName("auto"), "Auto");
    assert.strictEqual(formatModelDisplayName("Auto"), "Auto");
    assert.strictEqual(formatModelDisplayName(undefined), "Auto");
    assert.strictEqual(formatModelDisplayName(""), "Auto");
  });

  it("should format gemini models to human readable names without kebab-case", () => {
    assert.strictEqual(
      formatModelDisplayName("gemini-3.6-flash"),
      "Gemini 3.6 Flash",
    );
    assert.strictEqual(
      formatModelDisplayName("gemini-3.5-flash"),
      "Gemini 3.5 Flash",
    );
    assert.strictEqual(
      formatModelDisplayName("gemini-3.5-flash-lite"),
      "Gemini 3.5 Flash Lite",
    );
    assert.strictEqual(
      formatModelDisplayName("gemini-3.1-pro-preview"),
      "Gemini 3.1 Pro Preview",
    );
    assert.strictEqual(
      formatModelDisplayName("gemini-3.1-flash-lite"),
      "Gemini 3.1 Flash Lite",
    );
    assert.strictEqual(
      formatModelDisplayName("gemini-3-flash-preview"),
      "Gemini 3 Flash Preview",
    );
  });

  it("should format arbitrary kebab-case models cleanly", () => {
    assert.strictEqual(formatModelDisplayName("gpt-4o"), "GPT-4o");
    assert.strictEqual(
      formatModelDisplayName("claude-3-5-sonnet"),
      "Claude 3.5 Sonnet",
    );
    assert.strictEqual(formatModelDisplayName("deepseek-r1"), "DeepSeek R1");
    assert.strictEqual(
      formatModelDisplayName("custom-ai-model"),
      "Custom AI Model",
    );
  });
});
