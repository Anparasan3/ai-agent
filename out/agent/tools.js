"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSelectedCode = getSelectedCode;
exports.getCurrentFilePath = getCurrentFilePath;
exports.getCurrentFileContent = getCurrentFileContent;
exports.replaceSelectedCode = replaceSelectedCode;
exports.readWorkspaceFile = readWorkspaceFile;
exports.writeWorkspaceFile = writeWorkspaceFile;
exports.listWorkspaceFiles = listWorkspaceFiles;
exports.getWorkspaceRootPath = getWorkspaceRootPath;
const vscode = require("vscode");
function getSelectedCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return "";
    return editor.document.getText(editor.selection);
}
function getCurrentFilePath() {
    return vscode.window.activeTextEditor?.document.fileName ?? "";
}
function getCurrentFileContent() {
    return vscode.window.activeTextEditor?.document.getText() ?? "";
}
async function replaceSelectedCode(newCode) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    await editor.edit(b => b.replace(editor.selection, newCode));
}
async function readWorkspaceFile(filePath) {
    const root = workspaceRoot();
    const uri = vscode.Uri.joinPath(root, filePath);
    const bytes = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder().decode(bytes);
}
async function writeWorkspaceFile(filePath, content) {
    const root = workspaceRoot();
    const uri = vscode.Uri.joinPath(root, filePath);
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
}
async function listWorkspaceFiles() {
    const files = await vscode.workspace.findFiles("**/*.{ts,js,json,md,css,html,py,go,rs,tsx,jsx}", "**/node_modules/**");
    const root = workspaceRoot().fsPath;
    return files.map(f => f.fsPath.replace(root + "/", "")).sort();
}
function getWorkspaceRootPath() {
    const folders = vscode.workspace.workspaceFolders;
    return folders?.[0]?.uri.fsPath ?? "";
}
function workspaceRoot() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length)
        throw new Error("No workspace folder open.");
    return folders[0].uri;
}
//# sourceMappingURL=tools.js.map