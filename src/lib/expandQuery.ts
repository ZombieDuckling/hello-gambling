import Anthropic from "@anthropic-ai/sdk";

export async function expandQuery(query: string): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return query.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 2);
  }

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `You are a search assistant for a South African gambling complaints and community forum.

The user searched for: "${query}"

Return 6–10 specific keywords and short phrases that would appear in forum threads related to this topic.
Include SA-specific gambling terms where relevant (e.g. "payout", "FICA", "NGB", "licence", "Betway", "Hollywoodbets", etc.).
Cover synonyms and related concepts — e.g. "can't withdraw" → ["withdrawal", "payout", "funds", "transfer", "bank", "declined"].

Respond with ONLY a valid JSON array of lowercase strings. No explanation, no markdown.`,
        },
      ],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((t) => typeof t === "string").slice(0, 10);
  } catch {
    // fall through to basic tokenisation
  }
  return query.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 2);
}
