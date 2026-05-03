import * as vscode from "vscode";

export function getSelectedCode(): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return "";
  return editor.document.getText(editor.selection);
}

export async function replaceSelectedCode(newCode: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  await editor.edit(editBuilder => {
    editBuilder.replace(editor.selection, newCode);
  });
}