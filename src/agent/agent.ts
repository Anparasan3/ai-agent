import OpenAI from "openai";
import { getSelectedCode, replaceSelectedCode } from "./tools";

const client = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  apiKey: "lm-studio"
});

const MODEL = "qwen/qwen3-4b-2507";

const SYSTEM_PROMPT = `You are a coding AI agent embedded in VS Code.

Rules:
- If the user asks to fix, refactor, or improve code → return only the corrected code block
- If the user asks a general question → explain clearly with examples
- Format code in fenced code blocks with the language specified`;

export async function runAgentStreaming(
  userInput: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const code = getSelectedCode();

  const userContent = code
    ? `${userInput}\n\n\`\`\`\n${code}\n\`\`\``
    : userInput;

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent }
    ],
    stream: true
  });

  let fullReply = "";

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullReply += delta;
      onChunk(delta);
    }
  }

  if (code && (fullReply.includes("function") || fullReply.includes("const") || fullReply.includes("class"))) {
    const codeMatch = fullReply.match(/```(?:\w+)?\n([\s\S]*?)```/);
    await replaceSelectedCode(codeMatch ? codeMatch[1].trim() : fullReply);
  }
}