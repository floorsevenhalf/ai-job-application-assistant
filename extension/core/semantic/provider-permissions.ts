import type { OpenAICompatibleConfig } from "./openai-compatible-provider";

export function providerOriginPattern(baseUrl: string): string {
  const url = new URL(baseUrl);
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp) throw new Error("provider_unavailable");
  return `${url.origin}/*`;
}
export async function requestProviderPermission(config: Pick<OpenAICompatibleConfig, "baseUrl">): Promise<boolean> {
  const origins = [providerOriginPattern(config.baseUrl)];
  if (typeof chrome === "undefined" || !chrome.permissions) return true;
  return chrome.permissions.request({ origins });
}