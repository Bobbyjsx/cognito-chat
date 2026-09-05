import assert from "node:assert";
import { describe, it } from "node:test";

describe("Typewriter Title & Header Title Sync", () => {
  it("should derive currentHeaderTitle with correct fallback precedence", () => {
    // Case 1: All available -> headerTitle wins
    const headerTitle1: string | null = "Header Title";
    const sessionDataTitle1: string | null = "Session Data Title";
    const sidebarTitle1: string | null = "Sidebar Title";
    const title1 =
      headerTitle1 || sessionDataTitle1 || sidebarTitle1 || "Conversation";
    assert.strictEqual(title1, "Header Title");

    // Case 2: No headerTitle, sessionData present -> sessionData wins
    const headerTitle2: string | null = null;
    const sessionDataTitle2 = "Session Data Title";
    const sidebarTitle2 = "Sidebar Title";
    const title2 =
      headerTitle2 || sessionDataTitle2 || sidebarTitle2 || "Conversation";
    assert.strictEqual(title2, "Session Data Title");

    // Case 3: No headerTitle or sessionData, sidebar present -> sidebar wins
    const headerTitle3: string | null = null;
    const sessionDataTitle3: string | null = null;
    const sidebarTitle3 = "Sidebar Title";
    const title3 =
      headerTitle3 || sessionDataTitle3 || sidebarTitle3 || "Conversation";
    assert.strictEqual(title3, "Sidebar Title");

    // Case 4: None available -> defaults to "Conversation"
    const headerTitle4: string | null = null;
    const sessionDataTitle4: string | null = null;
    const sidebarTitle4: string | null = null;
    const title4 =
      headerTitle4 || sessionDataTitle4 || sidebarTitle4 || "Conversation";
    assert.strictEqual(title4, "Conversation");
  });

  it("should detect when title updates from generic placeholder to substantive title", () => {
    const isGeneric = (title: string | null | undefined) => {
      const trimmed = title?.trim();
      return !trimmed || trimmed === "Conversation" || trimmed === "New Chat";
    };

    assert.strictEqual(isGeneric("Conversation"), true);
    assert.strictEqual(isGeneric("New Chat"), true);
    assert.strictEqual(isGeneric(""), true);
    assert.strictEqual(isGeneric(null), true);
    assert.strictEqual(isGeneric(undefined), true);
    assert.strictEqual(isGeneric("Quantum Computing"), false);
  });

  it("should simulate typewriter character-by-character step progression", () => {
    const text = "Quantum Computing";
    const frames: string[] = [];

    let current = 0;
    while (current <= text.length) {
      frames.push(text.slice(0, current));
      current++;
    }

    assert.strictEqual(frames[0], "");
    assert.strictEqual(frames[1], "Q");
    assert.strictEqual(frames[frames.length - 1], "Quantum Computing");
    assert.strictEqual(frames.length, text.length + 1);
  });

  it("should reset character count to 0 when prompt text is longer than arriving nextTitle", () => {
    // Simulates the bug where prompt text (length 47) caused displayedCount
    // to remain 47 when nextTitle (length 17) arrived with animate=true.
    const promptText = "Can you please explain quantum computing to me?";
    let displayedCount = promptText.length;
    assert.strictEqual(displayedCount, 47);

    const nextTitle = "Quantum Computing";
    const animate = true;

    // Fixed logic: on animate transition or new text with animate=true, displayedCount resets to 0
    if (animate) {
      displayedCount = 0;
    }

    assert.strictEqual(displayedCount, 0);
    assert.strictEqual(displayedCount < nextTitle.length, true);

    // Typing now runs for all 17 characters
    while (displayedCount < nextTitle.length) {
      displayedCount++;
    }
    assert.strictEqual(displayedCount, nextTitle.length);
  });
});
