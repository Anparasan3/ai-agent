import * as vscode from "vscode";

export function getSelectedCode(): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return "";
  return editor.document.getText(editor.selection);
}

export function getCurrentFilePath(): string {
  return vscode.window.activeTextEditor?.document.fileName ?? "";
}

export function getCurrentFileContent(): string {
  return vscode.window.activeTextEditor?.document.getText() ?? "";
}

export async function replaceSelectedCode(newCode: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  await editor.edit(b => b.replace(editor.selection, newCode));
}

export async function readWorkspaceFile(filePath: string): Promise<string> {
  const root = workspaceRoot();
  const uri = vscode.Uri.joinPath(root, filePath);
  const bytes = await vscode.workspace.fs.readFile(uri);
  return new TextDecoder().decode(bytes);
}

export async function writeWorkspaceFile(filePath: string, content: string): Promise<void> {
  const root = workspaceRoot();
  const uri = vscode.Uri.joinPath(root, filePath);
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
}

export async function listWorkspaceFiles(): Promise<string[]> {
  const files = await vscode.workspace.findFiles(
    "**/*.{ts,js,json,md,css,html,py,go,rs,tsx,jsx}",
    "**/node_modules/**"
  );
  const root = workspaceRoot().fsPath;
  return files.map(f => f.fsPath.replace(root + "/", "")).sort();
}

export function getWorkspaceRootPath(): string {
  const folders = vscode.workspace.workspaceFolders;
  return folders?.[0]?.uri.fsPath ?? "";
}

function workspaceRoot(): vscode.Uri {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) throw new Error("No workspace folder open.");
  return folders[0].uri;
}
