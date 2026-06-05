const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

exports.claudeProxy = onRequest(
  { secrets: [anthropicApiKey], cors: true },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { messages, systemPrompt } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array required" });
      return;
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey.value(),
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-opus-4-8",
          max_tokens: 1024,
          system: systemPrompt || "당신은 Terry 가족의 재무 어드바이저입니다. 간결하고 실용적인 조언을 한국어로 제공하세요.",
          messages,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        res.status(response.status).json({ error: err });
        return;
      }

      const data = await response.json();
      res.json({ reply: data.content[0].text });
    } catch (err) {
      console.error("claudeProxy error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
