"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgent = runAgent;
const openai_1 = require("openai");
const tools_1 = require("./tools");
const client = new openai_1.default({
    baseURL: "http://localhost:1234/v1",
    apiKey: "lm-studio"
});
const MODEL = 'qwen/qwen3-4b-2507'; // "qwen2.5-1.5b-instruct";
async function runAgent(userInput) {
    const code = (0, tools_1.getSelectedCode)();
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
        await (0, tools_1.replaceSelectedCode)(reply);
    }
    return reply;
}
//# sourceMappingURL=agent.js.map