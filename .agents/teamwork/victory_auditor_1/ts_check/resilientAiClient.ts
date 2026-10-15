export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAiResponse(messages: ChatMessage[], maxTokens = 250): Promise<string> {
  // 1. Primary: Groq Cloud Free (Llama 3.1 8B Instant - 14,400 RPD, ~500 tok/sec)
  if (process.env.GROQ_API_KEY) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.85,
          max_tokens: maxTokens,
        }),
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content.trim();
      }
      console.warn(`[AI Cascade] Groq HTTP ${groqRes.status}. Escalating to Google Gemini...`);
    } catch (err: any) {
      console.warn(`[AI Cascade] Groq error: ${err.message}. Escalating to Google Gemini...`);
    }
  }

  // 2. Secondary: Google Gemini Flash (1,500 RPD, 1M context window)
  if (process.env.GEMINI_API_KEY) {
    try {
      const promptText = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.85,
          },
        }),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
      console.warn(`[AI Cascade] Gemini HTTP ${geminiRes.status}. Escalating to OpenRouter Free...`);
    } catch (err: any) {
      console.warn(`[AI Cascade] Gemini error: ${err.message}. Escalating to OpenRouter Free...`);
    }
  }

  // 3. Tertiary: OpenRouter Free Endpoints
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages,
          max_tokens: maxTokens,
        }),
      });

      if (orRes.ok) {
        const data = await orRes.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content.trim();
      }
    } catch (err) {
      // Fall through to deterministic static fallback
    }
  }

  // 4. Quaternary: Deterministic Algorithmic Fallback (Zero downtime guarantee)
  const STATIC_ROASTS = [
    "Your wallet looks like a cemetery of 20-dollar panic sells. Stop jeeting and start slapping!",
    "Legend says if you stare at the pump.fun 1-minute chart long enough, a green candle appears.",
    "Paper hands sell at 10k MC. Diamond hands ride the curve to Raydium. Which one are you?",
    "You just got slapped by the Ancient Chad of Solana. Hold your bag or get rekt.",
    "Raydium migration is the promised land. Jeeting now is an act of economic self-harm.",
  ];
  return STATIC_ROASTS[Math.floor(Math.random() * STATIC_ROASTS.length)];
}
