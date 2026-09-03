import assert from "node:assert";
import { describe, it } from "node:test";
import { preprocessMathAndLatex } from "../src/lib/math";

describe("LaTeX, MathJax and Math Preprocessing", () => {
  it("should normalize LaTeX block delimiters \\[ ... \\] to $$ ... $$", () => {
    const input =
      "\\[400\\text{ mg} \\div 180\\text{ mg per tablespoon} \\approx \\mathbf{2.2\\text{ tablespoons}}\\]";
    const expected =
      "\n$$\n400\\text{ mg} \\div 180\\text{ mg per tablespoon} \\approx \\mathbf{2.2\\text{ tablespoons}}\n$$\n";
    assert.strictEqual(preprocessMathAndLatex(input), expected);
  });

  it("should normalize LaTeX inline delimiters \\( ... \\) to $ ... $", () => {
    const input =
      "The result is \\(400\\text{ mg} \\div 180\\text{ mg per tablespoon} \\approx \\mathbf{2.2\\text{ tablespoons}}\\).";
    const expected =
      "The result is $400\\text{ mg} \\div 180\\text{ mg per tablespoon} \\approx \\mathbf{2.2\\text{ tablespoons}}$.";
    assert.strictEqual(preprocessMathAndLatex(input), expected);
  });

  it("should handle negative prefixed single-dollar math cleanly", () => {
    const input =
      "-$400\\text{ mg} \\div 180\\text{ mg per tablespoon} \\approx \\mathbf{2.2\\text{ tablespoons}}$";
    const expected =
      "- $400\\text{ mg} \\div 180\\text{ mg per tablespoon} \\approx \\mathbf{2.2\\text{ tablespoons}}$";
    assert.strictEqual(preprocessMathAndLatex(input), expected);
  });

  it("should not modify LaTeX delimiters inside code blocks or inline code", () => {
    const input =
      "Here is code:\n```python\n# \\[x + y\\]\n```\nand inline `\\(a + b\\)`";
    assert.strictEqual(preprocessMathAndLatex(input), input);
  });
});
