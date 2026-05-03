import OpenAI from "openai";
import { getSelectedCode, replaceSelectedCode } from "./tools";

const client = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  apiKey: "lm-studio"
});

const MODEL ='qwen/qwen3-4b-2507' // "qwen2.5-1.5b-instruct";

export async function runAgent(userInput: string) {
  const code = getSelectedCode();

  const systemPrompt = `
You are a coding AI agent.

Rules:
- If user asks to fix/refactor → return only code
- If general question → explain clearly
`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `${userInput}\n\nCode:\n${code}`
      }
    ]
  });

  const reply = response.choices[0].message.content || "";

  // Auto apply if looks like code
  if (reply.includes("function") || reply.includes("const")) {
    await replaceSelectedCode(reply);
  }

  return reply;
}