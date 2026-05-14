"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentStreaming = runAgentStreaming;
const openai_1 = require("openai");
const tools_1 = require("./tools");
const client = new openai_1.default({
    baseURL: "http://localhost:1234/v1",
    apiKey: "lm-studio"
});
const MODEL = "qwen/qwen3-4b-2507";
const SYSTEM_PROMPT = `You are a coding AI agent embedded in VS Code.

Rules:
- If the user asks to fix, refactor, or improve code → return only the corrected code block
- If the user asks a general question → explain clearly with examples
- Format code in fenced code blocks with the language specified`;
async function runAgentStreaming(userInput, onChunk) {
    const code = (0, tools_1.getSelectedCode)();
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
        await (0, tools_1.replaceSelectedCode)(codeMatch ? codeMatch[1].trim() : fullReply);
    }
}
//# sourceMappingURL=agent.js.map