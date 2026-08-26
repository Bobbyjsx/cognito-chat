/**
 * Utility functions for formatting and displaying AI model identifiers
 * in human-readable presentation format (replacing kebab-case).
 */

export function formatModelDisplayName(id?: string): string {
  if (!id) return "Auto";
  const trimmed = id.trim();
  const lower = trimmed.toLowerCase();

  switch (lower) {
    case "auto":
    case "smart":
      return "Auto";
    case "gemini-3.6-flash":
      return "Gemini 3.6 Flash";
    case "gemini-3.5-flash":
      return "Gemini 3.5 Flash";
    case "gemini-3.5-flash-lite":
      return "Gemini 3.5 Flash Lite";
    case "gemini-3.1-pro-preview":
      return "Gemini 3.1 Pro Preview";
    case "gemini-3.1-flash-lite":
      return "Gemini 3.1 Flash Lite";
    case "gemini-3-flash-preview":
      return "Gemini 3 Flash Preview";
    case "gemini-2.5-pro":
      return "Gemini 2.5 Pro";
    case "gemini-2.0-flash":
      return "Gemini 2.0 Flash";
    case "gemini-2.0-flash-lite":
      return "Gemini 2.0 Flash Lite";
    case "gpt-4o":
      return "GPT-4o";
    case "gpt-4o-mini":
      return "GPT-4o Mini";
    case "claude-3-5-sonnet":
      return "Claude 3.5 Sonnet";
    case "claude-3-7-sonnet":
      return "Claude 3.7 Sonnet";
    case "deepseek-r1":
      return "DeepSeek R1";
    case "deepseek-v3":
      return "DeepSeek V3";
    default:
      return trimmed
        .split(/[-_]/)
        .map((word) => {
          if (/^v?\d+(\.\d+)*$/i.test(word)) return word;
          if (word.toLowerCase() === "gpt") return "GPT";
          if (word.toLowerCase() === "ai") return "AI";
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
  }
}
