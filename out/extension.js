"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const agent_1 = require("./agent/agent");
function activate(context) {
    const command = vscode.commands.registerCommand("ai-agent.openChat", () => {
        const panel = vscode.window.createWebviewPanel("aiChat", "AI Agent", vscode.ViewColumn.Beside, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")]
        });
        const cssUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "media", "webview.css"));
        const jsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "media", "webview.js"));
        panel.webview.html = getHtml(panel.webview.cspSource, cssUri, jsUri);
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command !== "ask")
                return;
            panel.webview.postMessage({ command: "thinking" });
            try {
                await (0, agent_1.runAgentStreaming)(msg.text, (chunk) => {
                    panel.webview.postMessage({ command: "chunk", text: chunk });
                });
                panel.webview.postMessage({ command: "done" });
            }
            catch (err) {
                panel.webview.postMessage({
                    command: "error",
                    text: err instanceof Error ? err.message : "An unexpected error occurred."
                });
            }
        });
    });
    context.subscriptions.push(command);
}
function getHtml(cspSource, cssUri, jsUri) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${cspSource}; script-src ${cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${cssUri}">
  <title>AI Agent</title>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="header-logo">🤖</div>
      <div class="header-info">
        <h1>AI Agent</h1>
        <p><span class="status-dot"></span>LM Studio · Local</p>
      </div>
    </div>
    <button id="clearBtn" class="icon-btn">Clear</button>
  </div>

  <div id="chat">
    <div class="welcome" id="welcome">
      <div class="welcome-logo">🤖</div>
      <h2>AI Coding Assistant</h2>
      <p>Select code in your editor and ask me to fix, refactor, or explain it.</p>
      <div class="suggestions">
        <button class="suggestion-chip" data-text="Explain this code">Explain this code</button>
        <button class="suggestion-chip" data-text="Refactor for readability">Refactor for readability</button>
        <button class="suggestion-chip" data-text="Find bugs in this code">Find bugs</button>
        <button class="suggestion-chip" data-text="Add TypeScript types">Add TypeScript types</button>
      </div>
    </div>
  </div>

  <div class="input-area">
    <div class="input-box">
      <textarea id="input" rows="1" placeholder="Ask anything or select code to analyze…"></textarea>
      <button id="sendBtn" class="send-btn" title="Send (Enter)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
    <div class="input-hint">Enter to send &nbsp;·&nbsp; Shift+Enter for new line</div>
  </div>

  <script src="${jsUri}"></script>
</body>
</html>`;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map