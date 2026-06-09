// Vercel serverless function — keeps your Anthropic API key safe on the server.
// The website calls /api/claude; this forwards the request to Anthropic with your
// secret key attached. The key is NEVER sent to the browser.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Server not configured: ANTHROPIC_API_KEY is missing." });
    return;
  }

  try {
    const { system, messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Missing messages." });
      return;
    }

    // Light guardrails so a visitor can't run up huge bills:
    // keep only the last 12 turns and cap the length of each message.
    const safeMessages = messages.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 6000),
    }));

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // You can change this to any current model — see the README.
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: typeof system === "string" ? system.slice(0, 20000) : undefined,
        messages: safeMessages,
      }),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong reaching the AI service." });
  }
}
