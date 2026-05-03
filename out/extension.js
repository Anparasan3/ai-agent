"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const agent_1 = require("./agent/agent");
function activate(context) {
    const command = vscode.commands.registerCommand("ai-agent.openChat", () => {
        const panel = vscode.window.createWebviewPanel("aiChat", "AI Agent", vscode.ViewColumn.Beside, { enableScripts: true });
        panel.webview.html = getHtml();
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === "ask") {
                const result = await (0, agent_1.runAgent)(msg.text);
                panel.webview.postMessage({
                    command: "response",
                    text: result
                });
            }
        });
    });
    context.subscriptions.push(command);
}
function getHtml() {
    return `
  <!DOCTYPE html>
  <html>
  <body>
    <h2>AI Agent</h2>

    <div id="chat" style="height:300px; overflow:auto; border:1px solid #ccc;"></div>

    <input id="input" style="width:80%" placeholder="Ask something..." />
    <button onclick="send()">Send</button>

    <script>
      const vscode = acquireVsCodeApi();

      function send() {
        const input = document.getElementById("input");
        const text = input.value;

        append("You: " + text);

        vscode.postMessage({
          command: "ask",
          text
        });

        input.value = "";
      }

      window.addEventListener("message", event => {
        const msg = event.data;
        if (msg.command === "response") {
          append("AI: " + msg.text);
        }
      });

      function append(text) {
        const div = document.createElement("div");
        div.textContent = text;
        document.getElementById("chat").appendChild(div);
      }
    </script>
  </body>
  </html>
  `;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map