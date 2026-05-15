"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const agent_1 = require("./agent/agent");
const config_1 = require("./agent/config");
function activate(context) {
    const command = vscode.commands.registerCommand("ai-agent.openChat", () => {
        const panel = vscode.window.createWebviewPanel("aiChat", "AI Agent", vscode.ViewColumn.Beside, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")]
        });
        const cssUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "media", "webview.css"));
        const jsUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, "media", "webview.js"));
        panel.webview.html = getHtml(panel.webview.cspSource, cssUri, jsUri);
        // Pending permission requests keyed by id
        const pendingPermissions = new Map();
        panel.webview.onDidReceiveMessage(async (msg) => {
            // User responded to a permission prompt
            if (msg.command === "permission_response") {
                pendingPermissions.get(msg.id)?.(msg.approved);
                pendingPermissions.delete(msg.id);
                return;
            }
            if (msg.command === "ready") {
                try {
                    const { label, provider } = (0, config_1.getProviderConfig)();
                    panel.webview.postMessage({ command: "provider", label, provider });
                }
                catch {
                    panel.webview.postMessage({ command: "provider", label: "Not configured", provider: "lmstudio" });
                }
                return;
            }
            if (msg.command === "openSettings") {
                vscode.commands.executeCommand("workbench.action.openSettings", "aiAgent");
                return;
            }
            if (msg.command === "setProvider") {
                const cfg = vscode.workspace.getConfiguration("aiAgent");
                await cfg.update("provider", msg.provider, vscode.ConfigurationTarget.Global);
                try {
                    const { label, provider } = (0, config_1.getProviderConfig)();
                    panel.webview.postMessage({ command: "provider", label, provider });
                }
                catch (err) {
                    panel.webview.postMessage({
                        command: "error",
                        text: err instanceof Error ? err.message : "Provider configuration error."
                    });
                }
                return;
            }
            if (msg.command !== "ask")
                return;
            panel.webview.postMessage({ command: "thinking" });
            const requestPermission = (action, detail) => {
                const id = Math.random().toString(36).slice(2, 10);
                return new Promise((resolve) => {
                    pendingPermissions.set(id, resolve);
                    panel.webview.postMessage({ command: "permission", id, action, detail });
                });
            };
            try {
                await (0, agent_1.runAgentStreaming)(msg.text, (chunk) => panel.webview.postMessage({ command: "chunk", text: chunk }), requestPermission);
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
      <h1 class="header-title">AI Agent</h1>
    </div>
    <div class="header-actions">
      <div class="provider-picker" id="providerPicker">
        <button class="provider-current" id="providerBtn">
          <span id="providerLabel">Loading…</span>
          <span class="chevron">▾</span>
        </button>
        <div class="provider-dropdown" id="providerDropdown" hidden>
          <button class="provider-option" data-provider="lmstudio">🏠 LM Studio · Local</button>
          <button class="provider-option" data-provider="groq">⚡ Groq · Cloud</button>
        </div>
      </div>
      <button id="settingsBtn" class="icon-btn" title="Open settings">⚙</button>
      <button id="clearBtn" class="icon-btn">Clear</button>
    </div>
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