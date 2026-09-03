import { SEMANTIC_MATCHER_SYSTEM_PROMPT } from "./prompt";
import type { AIProvider, SemanticMatchInput } from "./types";

export type ProviderFailureCode = "invalid_api_key" | "rate_limited" | "provider_timeout" | "provider_unavailable" | "invalid_response" | "network_error";
export interface OpenAICompatibleConfig { apiKey: string; baseUrl: string; model: string; timeoutMs: number; }
type ConfigSource = OpenAICompatibleConfig | (() => OpenAICompatibleConfig | Promise<OpenAICompatibleConfig>);

export class AIProviderError extends Error {
  constructor(readonly code: ProviderFailureCode) { super(code); this.name = "AIProviderError"; }
}

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["status", "confidence", "reasonCodes", "candidatePaths"],
  properties: {
    status: { type: "string", enum: ["matched", "ambiguous", "unmatched"] },
    profilePath: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    reasonCodes: { type: "array", items: { type: "string" } },
    candidatePaths: { type: "array", items: { type: "object", additionalProperties: false, required: ["profilePath", "confidence"], properties: { profilePath: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 1 } } } }
  }
} as const;

function endpointFor(baseUrl: string): string {
  let url: URL;
  try { url = new URL(baseUrl); } catch { throw new AIProviderError("provider_unavailable"); }
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password || url.search || url.hash) throw new AIProviderError("provider_unavailable");
  return `${url.toString().replace(/\/$/, "")}/chat/completions`;
}

function requestBody(input: SemanticMatchInput, model: string, structured: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    temperature: 0,
    messages: [
      { role: "system", content: SEMANTIC_MATCHER_SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify({ field: input.field, candidates: input.candidates, availableProfilePaths: input.availableProfilePaths, sectionContext: input.sectionContext ?? [] }) }
    ]
  };
  if (structured) {
    const pathSchema = { type: "string", enum: input.availableProfilePaths };
    const schema = { ...RESULT_SCHEMA, properties: { ...RESULT_SCHEMA.properties, profilePath: pathSchema, candidatePaths: { ...RESULT_SCHEMA.properties.candidatePaths, items: { ...RESULT_SCHEMA.properties.candidatePaths.items, properties: { ...RESULT_SCHEMA.properties.candidatePaths.items.properties, profilePath: pathSchema } } } } };
    body.response_format = { type: "json_schema", json_schema: { name: "semantic_match_result", strict: true, schema } };
  }
  return body;
}

function httpFailure(status: number): ProviderFailureCode {
  if (status === 401 || status === 403) return "invalid_api_key";
  if (status === 429) return "rate_limited";
  if (status === 408 || status === 504) return "provider_timeout";
  if (status >= 500) return "provider_unavailable";
  return "provider_unavailable";
}

async function responseContent(response: Response): Promise<unknown> {
  let envelope: unknown;
  try { envelope = await response.json(); } catch { throw new AIProviderError("invalid_response"); }
  const content = (envelope as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new AIProviderError("invalid_response");
  try { return JSON.parse(content); } catch { throw new AIProviderError("invalid_response"); }
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly id = "openai-compatible";
  constructor(private readonly source: ConfigSource, private readonly fetcher: typeof fetch = fetch) {}

  async infer(input: SemanticMatchInput): Promise<unknown> {
    const config = typeof this.source === "function" ? await this.source() : this.source;
    if (!config.apiKey.trim()) throw new AIProviderError("invalid_api_key");
    if (!config.model.trim()) throw new AIProviderError("provider_unavailable");
    const endpoint = endpointFor(config.baseUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1, config.timeoutMs));
    try {
      let response = await this.request(endpoint, config, input, controller.signal, true);
      if (response.status === 400) {
        const detail = await response.text();
        if (/response.?format|json.?schema|structured/i.test(detail)) response = await this.request(endpoint, config, input, controller.signal, false);
        else throw new AIProviderError(httpFailure(response.status));
      }
      if (!response.ok) throw new AIProviderError(httpFailure(response.status));
      return await responseContent(response);
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw new AIProviderError("provider_timeout");
      throw new AIProviderError("network_error");
    } finally { clearTimeout(timer); }
  }

  private request(endpoint: string, config: OpenAICompatibleConfig, input: SemanticMatchInput, signal: AbortSignal, structured: boolean): Promise<Response> {
    return this.fetcher(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` }, body: JSON.stringify(requestBody(input, config.model, structured)), signal });
  }
}

export function providerFailureMessage(code: ProviderFailureCode | "provider_error" | "timeout" | "provider_not_configured"): string {
  const messages: Record<string, string> = { invalid_api_key: "API Key 无效", rate_limited: "请求过于频繁，请稍后重试", provider_timeout: "Provider 请求超时", timeout: "AI 匹配超时", provider_unavailable: "Provider 暂不可用或配置无效", invalid_response: "Provider 返回格式无效", network_error: "网络连接失败", provider_error: "Provider 调用失败", provider_not_configured: "Provider 未配置" };
  return messages[code] ?? "AI 调用失败";
}