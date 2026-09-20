import assert from "node:assert";
import { describe, it } from "node:test";
import {
  extractActiveMention,
  formatPromptTag,
  parsePromptTags,
  tokenizePromptText,
  type PromptItem,
} from "../src/lib/prompt-library";

const prompt = (id: string, title: string, body: string): PromptItem => ({
  id,
  title,
  description: `${title} description`,
  category: "product",
  prompt: body,
});

describe("inline prompt mentions", () => {
  it("preserves prompt positions when tokenizing a message", () => {
    const first = formatPromptTag(
      prompt("feedback", "User Feedback", "Analyze feedback"),
    );
    const second = formatPromptTag(
      prompt("rewrite", "Rewrite", "Rewrite clearly"),
    );
    const input = `Use ${first} on this, then ${second} the summary.`;
    const parts = tokenizePromptText(input);

    assert.deepStrictEqual(
      parts.map((part) =>
        part.type === "text" ? part.text : `@${part.tag.title}`,
      ),
      [
        "Use ",
        "@User Feedback",
        " on this, then ",
        "@Rewrite",
        " the summary.",
      ],
    );
    assert.strictEqual(parsePromptTags(input).tags.length, 2);
  });

  it("keeps filtering text active after @, including spaces", () => {
    const input = "Use @user Feedback";
    assert.deepStrictEqual(extractActiveMention(input, input.length), {
      query: "user Feedback",
      startIndex: 4,
      endIndex: input.length,
    });
  });

  it("finds a later mention after an existing serialized prompt", () => {
    const tag = formatPromptTag(
      prompt("feedback", "User Feedback", "Analyze feedback"),
    );
    const input = `${tag} compare with @rewrite`;
    assert.deepStrictEqual(extractActiveMention(input, input.length), {
      query: "rewrite",
      startIndex: input.lastIndexOf("@"),
      endIndex: input.length,
    });
  });
});
