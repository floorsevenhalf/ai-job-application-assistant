import { getAriaLabelledByTexts, getLabelTexts, getLegendText, getNearbyText, getParentText } from "../scanner/context";
import { exclusionReason } from "../scanner/safety";

export type FillableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function revalidateElement(element: HTMLElement): string | undefined {
  if (!element.isConnected || !element.ownerDocument.documentElement.contains(element)) return "element_not_in_document";
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return "unsupported_element";
  const context = [
    ...getLabelTexts(element),
    ...getAriaLabelledByTexts(element),
    getLegendText(element),
    ...getNearbyText(element),
    getParentText(element),
    element.getAttribute("aria-label"),
    element instanceof HTMLSelectElement ? "" : element.placeholder,
    element.name,
    element.id
  ].filter(Boolean).join(" ");
  return exclusionReason(element, context);
}