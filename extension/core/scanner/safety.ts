import { cleanText } from "./text";

const EXCLUDED_INPUT_TYPES = new Set(["hidden", "password", "submit", "button", "reset", "file", "image"]);
const UNSAFE_TEXT = /验证码|短信码|校验码|captcha|verification\s*code|同意.{0,8}(协议|条款)|隐私.{0,8}(授权|同意)|privacy\s*(consent|agreement)/i;

export function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.closest("[hidden], [aria-hidden='true']")) return false;
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) return false;
  const checkVisibility = (element as HTMLElement & { checkVisibility?: (options?: { checkOpacity?: boolean; checkVisibilityCSS?: boolean }) => boolean }).checkVisibility;
  return checkVisibility ? checkVisibility.call(element, { checkOpacity: true, checkVisibilityCSS: true }) : true;
}

export function exclusionReason(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  contextText: string,
  visible = isVisible(element)
): string | undefined {
  const type = element instanceof HTMLInputElement ? element.type.toLowerCase() : "";
  if (EXCLUDED_INPUT_TYPES.has(type)) return `unsupported-input-type:${type}`;
  if (element.disabled) return "disabled";
  if (!(element instanceof HTMLSelectElement) && element.readOnly) return "read-only";
  if (!visible) return "not-visible";
  if (UNSAFE_TEXT.test(cleanText(contextText, 500))) return "sensitive-or-consent-field";
  return undefined;
}