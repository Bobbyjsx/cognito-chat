/**
 * Normalizes LaTeX / MathJax notations from LLM streams into standard Markdown math syntax:
 * - Block math: \[ ... \] -> \n$$\n...\n$$\n
 * - Inline math: \( ... \) -> $...$
 * - Negative / prefixed math: -$...$ -> - $...$
 * Preserves code blocks (``` ... ```) and inline code (`...`).
 */
export function preprocessMathAndLatex(text: string): string {
  if (typeof text !== "string" || !text) return text;

  // Split content by code blocks and inline code to preserve them intact
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/g);

  return parts
    .map((part, index) => {
      // Odd indices are code blocks or inline code - return unchanged
      if (index % 2 === 1) return part;

      let processed = part;

      // 1. Replace block math delimiters \[ ... \] with $$ ... $$
      processed = processed.replace(
        /\\\[([\s\S]*?)\\\]/g,
        (_, equation) => `\n$$\n${equation.trim()}\n$$\n`,
      );

      // 2. Replace inline math delimiters \( ... \) with $ ... $
      processed = processed.replace(
        /\\\(([\s\S]*?)\\\)/g,
        (_, equation) => `$${equation.trim()}$`,
      );

      // 3. Fix negative sign immediately touching inline math (e.g. -$400...$ -> - $400...$)
      processed = processed.replace(/([^\w\\]|^)-(\$[^\$\n]+\$)/g, "$1- $2");

      return processed;
    })
    .join("");
}
