// Approximate token count: 1 token ≈ 4 chars for English/code content.
const CHARS_PER_TOKEN = 4;

export function countTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function fitToTokenBudget(text: string, budget: number): string {
  const maxChars = budget * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}
