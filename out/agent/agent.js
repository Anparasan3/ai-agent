"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentStreaming = runAgentStreaming;
const config_1 = require("./config");
const tools_1 = require("./tools");
const SYSTEM_PROMPT = `You are a coding AI agent embedded in VS Code.

Every message includes a <context> block with live workspace data.
The values in <context> are REAL and ACCURATE — never say you don't have access to them.

Tools available for file operations:
  - list_files   → list all source files
  - read_file    → read a specific file's content
  - write_file   → write or overwrite a file

Rules:
- Answer questions about the workspace using the <context> values directly.
- Use tools only when you need to READ or WRITE file contents.
- For fix/refactor requests return corrected code in fenced code blocks.
- For general questions explain clearly.`;
const TOOLS = [
    {
        type: "function",
        function: {
            name: "list_files",
            description: "List all source files in the workspace.",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read the contents of a workspace file.",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "File path relative to workspace root." }
                },
                required: ["path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Write or overwrite a file in the workspace.",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string", description: "File path relative to workspace root." },
                    content: { type: "string", description: "Full content to write." }
                },
                required: ["path", "content"]
            }
        }
    }
];
async function executeTool(name, args) {
    try {
        if (name === "list_files") {
            const files = await (0, tools_1.listWorkspaceFiles)();
            return files.length ? files.join("\n") : "No files found.";
        }
        if (name === "read_file")
            return await (0, tools_1.readWorkspaceFile)(args.path);
        if (name === "write_file") {
            await (0, tools_1.writeWorkspaceFile)(args.path, args.content);
            return `Written: ${args.path}`;
        }
        return `Unknown tool: ${name}`;
    }
    catch (err) {
        return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
}
async function runAgentStreaming(userInput, onChunk, onPermission) {
    const selectedCode = (0, tools_1.getSelectedCode)();
    const filePath = (0, tools_1.getCurrentFilePath)();
    const workspacePath = (0, tools_1.getWorkspaceRootPath)();
    const workspaceFiles = await (0, tools_1.listWorkspaceFiles)();
    const { client, model } = (0, config_1.getProviderConfig)();
    const contextLines = [];
    if (workspacePath)
        contextLines.push(`current_working_directory: ${workspacePath}`);
    if (filePath)
        contextLines.push(`active_file: ${filePath}`);
    if (workspaceFiles.length)
        contextLines.push(`workspace_files:\n  ${workspaceFiles.join("\n  ")}`);
    if (selectedCode)
        contextLines.push(`selected_code:\n\`\`\`\n${selectedCode}\n\`\`\``);
    const contextBlock = contextLines.length
        ? `<context>\n${contextLines.join("\n")}\n</context>\n\n`
        : "";
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${contextBlock}${userInput}` }
    ];
    // Agentic loop — keep calling until no more tool calls
    while (true) {
        const response = await client.chat.completions.create({
            model,
            messages,
            tools: TOOLS,
            tool_choice: "auto"
        });
        const message = response.choices[0].message;
        messages.push(message);
        if (!message.tool_calls?.length) {
            const reply = message.content ?? "";
            onChunk(reply);
            if (selectedCode && (reply.includes("function") || reply.includes("const") || reply.includes("class"))) {
                const match = reply.match(/```(?:\w+)?\n([\s\S]*?)```/);
                if (match)
                    await (0, tools_1.replaceSelectedCode)(match[1].trim());
            }
            break;
        }
        // Execute each tool call and feed results back
        for (const call of message.tool_calls) {
            const args = JSON.parse(call.function.arguments);
            // Ask permission for anything that touches files
            if (call.function.name !== "list_files") {
                const detail = args.path ?? "workspace";
                const allowed = await onPermission(call.function.name, detail);
                if (!allowed) {
                    messages.push({ role: "tool", tool_call_id: call.id, content: "Permission denied by user." });
                    continue;
                }
            }
            onChunk(`\n> 🔧 ${call.function.name}(${summariseArgs(call.function.arguments)})\n`);
            const result = await executeTool(call.function.name, args);
            messages.push({ role: "tool", tool_call_id: call.id, content: result });
        }
    }
}
function summariseArgs(raw) {
    try {
        const obj = JSON.parse(raw);
        const first = Object.values(obj)[0] ?? "";
        return first.length > 40 ? first.slice(0, 40) + "…" : first;
    }
    catch {
        return "";
    }
}
//# sourceMappingURL=agent.js.map