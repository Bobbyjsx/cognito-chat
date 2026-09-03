import assert from "node:assert";
import { describe, it } from "node:test";
import {
  isNotificationSupported,
  getNotificationPermission,
  isWindowAway,
  truncateNotificationBody,
} from "../src/lib/push-notifications";

describe("Push & In-App Notifications Utilities", () => {
  it("should safely return false/unsupported in non-browser environment without throwing", () => {
    assert.strictEqual(isNotificationSupported(), false);
    assert.strictEqual(getNotificationPermission(), "unsupported");
    assert.strictEqual(isWindowAway(), false);
  });

  it("should format and truncate response text cleanly for notification bodies", () => {
    assert.strictEqual(truncateNotificationBody(null), "Response ready");
    assert.strictEqual(truncateNotificationBody(""), "Response ready");

    // Collapses markdown and newlines
    const raw =
      "**Hello world!**\n\nHere is a code snippet:\n```ts\nconsole.log(1);\n```\nAll done!";
    const formatted = truncateNotificationBody(raw);
    assert.strictEqual(
      formatted,
      "Hello world! Here is a code snippet: [Code] All done!",
    );

    // Truncates long text with ellipsis
    const longText = "a".repeat(200);
    const truncated = truncateNotificationBody(longText, 50);
    assert.strictEqual(truncated, "a".repeat(50) + "...");
  });
});
