import * as vscode from "vscode";
import OpenAI from "openai";

export type Provider = "lmstudio" | "groq";

export interface ProviderConfig {
  client: OpenAI;
  model: string;
  provider: Provider;
  label: string;
}

export function getProviderConfig(): ProviderConfig {
  const cfg      = vscode.workspace.getConfiguration("aiAgent");
  const provider = cfg.get<Provider>("provider", "lmstudio");
  return getProviderConfigFor(provider);
}

export function getProviderConfigFor(provider: Provider): ProviderConfig {
  const cfg = vscode.workspace.getConfiguration("aiAgent");

  if (provider === "groq") {
    const apiKey = cfg.get<string>("groqApiKey", "");
    const model  = cfg.get<string>("groqModel",  "llama-3.3-70b-versatile");

    const keyIsValid = apiKey && !apiKey.startsWith("${");
    if (!keyIsValid) {
      throw new Error(
        "Groq API key is missing. Open Settings (⚙ button) → search 'aiAgent.groqApiKey' → paste your key from console.groq.com/keys"
      );
    }

    return {
      client: new OpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey }),
      model,
      provider: "groq",
      label: "Groq · Cloud"
    };
  }

  const baseURL = cfg.get<string>("lmStudioUrl",   "http://localhost:1234/v1");
  const model   = cfg.get<string>("lmStudioModel", "qwen/qwen3-4b-2507");

  return {
    client: new OpenAI({ baseURL, apiKey: "lm-studio" }),
    model,
    provider: "lmstudio",
    label: "LM Studio · Local"
  };
}
