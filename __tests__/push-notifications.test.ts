import assert from "node:assert";
import { describe, it } from "node:test";
import {
  isNotificationSupported,
  getNotificationPermission,
  isWindowAway,
} from "../src/lib/push-notifications";

describe("Push & In-App Notifications Utilities", () => {
  it("should safely return false/unsupported in non-browser environment without throwing", () => {
    assert.strictEqual(isNotificationSupported(), false);
    assert.strictEqual(getNotificationPermission(), "unsupported");
    assert.strictEqual(isWindowAway(), false);
  });
});
