"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelectedCode = getSelectedCode;
exports.replaceSelectedCode = replaceSelectedCode;
const vscode = require("vscode");
function getSelectedCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return "";
    return editor.document.getText(editor.selection);
}
async function replaceSelectedCode(newCode) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    await editor.edit(editBuilder => {
        editBuilder.replace(editor.selection, newCode);
    });
}
//# sourceMappingURL=tools.js.map