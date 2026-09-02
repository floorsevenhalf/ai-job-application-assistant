import { buildLabelIndex, getAriaLabelledByTexts, getLabelTexts, getLegendText, getNearbyText, getParentText, getSectionTexts, getVisualLabelTexts, type LabelIndex } from "./context";
import { exclusionReason, isVisible } from "./safety";
import { cleanText, uniqueTexts } from "./text";
import type { FieldDescriptor, FieldKind, FieldOption, ScanResult } from "./types";

type ScannableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type FieldContext = FieldDescriptor["context"];
interface ScanMetadata { context: FieldContext; visible: boolean; }
const scannerInstanceId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let scanSequence = 0;

function kindOf(element: ScannableElement): FieldKind {
  if (element instanceof HTMLTextAreaElement) return "textarea";
  if (element instanceof HTMLSelectElement) return "select";
  const known: Partial<Record<string, FieldKind>> = { text: "text", search: "text", url: "text", email: "email", tel: "tel", number: "number", date: "date", month: "month", radio: "radio", checkbox: "checkbox" };
  return known[element.type.toLowerCase()] ?? "unknown";
}
function contextFor(element: ScannableElement, labelIndex: LabelIndex): FieldContext {
  const labelTexts = getLabelTexts(element, labelIndex);
  const ariaLabelledByTexts = getAriaLabelledByTexts(element);
  const hasExplicitLabel = labelTexts.length > 0 || ariaLabelledByTexts.length > 0 || Boolean(element.getAttribute("aria-label"));
  return { labelTexts, visualLabelTexts: hasExplicitLabel ? [] : getVisualLabelTexts(element), ariaLabelledByTexts, legendText: getLegendText(element), sectionTexts: getSectionTexts(element), nearbyText: getNearbyText(element), parentText: getParentText(element) };
}
function contextText(element: ScannableElement, context: FieldContext): string {
  return [...context.labelTexts, ...context.visualLabelTexts, ...context.ariaLabelledByTexts, context.legendText, ...(context.sectionTexts ?? []), ...context.nearbyText, context.parentText, element.getAttribute("aria-label"), element instanceof HTMLSelectElement ? "" : element.placeholder, element.name, element.id].filter(Boolean).join(" ");
}
function attributesFor(element: ScannableElement): FieldDescriptor["attributes"] {
  return { type: element instanceof HTMLInputElement ? element.type : undefined, name: element.name || undefined, id: element.id || undefined, placeholder: element instanceof HTMLSelectElement ? undefined : (element.placeholder || undefined), ariaLabel: element.getAttribute("aria-label") || undefined, autocomplete: element.getAttribute("autocomplete") || undefined, role: element.getAttribute("role") || undefined };
}
function selectOptions(element: HTMLSelectElement): FieldOption[] {
  return Array.from(element.options, option => ({ value: option.value, label: cleanText(option.label || option.textContent), disabled: option.disabled, selected: option.selected }));
}
function baseDescriptor(element: ScannableElement, fieldId: string, metadata: ScanMetadata): FieldDescriptor {
  return {
    fieldId, kind: kindOf(element), attributes: attributesFor(element), context: metadata.context,
    options: element instanceof HTMLSelectElement ? selectOptions(element) : [],
    state: { currentValue: element.value, required: element.required, disabled: element.disabled, readOnly: element instanceof HTMLSelectElement ? false : element.readOnly, visible: metadata.visible },
    safety: { excluded: false }
  };
}
function scopeIdentity(element: ScannableElement, scopeIds: Map<Element, number>): string {
  const scope = element.closest("fieldset, form");
  if (!scope) return "document";
  if (!scopeIds.has(scope)) scopeIds.set(scope, scopeIds.size + 1);
  return `scope-${scopeIds.get(scope)}`;
}
function groupKey(element: HTMLInputElement, scopeIds: Map<Element, number>, index: number): string {
  const scope = scopeIdentity(element, scopeIds);
  if (element.name) return `${element.type}|${scope}|name:${element.name}`;
  if (element.closest("fieldset")) return `${element.type}|${scope}|fieldset`;
  return `${element.type}|${scope}|single:${index}`;
}
function choiceDescriptor(elements: HTMLInputElement[], fieldId: string, metadata: Map<ScannableElement, ScanMetadata>, labelIndex: LabelIndex): FieldDescriptor {
  const first = elements[0];
  const descriptor = baseDescriptor(first, fieldId, metadata.get(first)!);
  const checked = elements.filter(element => element.checked).map(element => element.value);
  descriptor.context = {
    ...descriptor.context,
    labelTexts: uniqueTexts(elements.flatMap(element => getLabelTexts(element, labelIndex))),
    visualLabelTexts: uniqueTexts(elements.flatMap(element => metadata.get(element)?.context.visualLabelTexts ?? [])),
    ariaLabelledByTexts: uniqueTexts(elements.flatMap(getAriaLabelledByTexts))
  };
  descriptor.options = elements.map(element => ({ value: element.value, label: getLabelTexts(element, labelIndex)[0] || element.getAttribute("aria-label") || element.value, disabled: element.disabled, checked: element.checked }));
  descriptor.state.currentValue = first.type === "radio" ? (checked[0] ?? "") : (elements.length === 1 ? first.checked : checked);
  descriptor.state.required = elements.some(element => element.required);
  descriptor.group = { type: first.type as "radio" | "checkbox", name: first.name || undefined, memberCount: elements.length, ...groupScope(first) };
  return descriptor;
}
function groupScope(element: HTMLInputElement): { scopeType: "fieldset" | "form" | "document"; scopeIdentity?: string } {
  const fieldset = element.closest("fieldset");
  if (fieldset) return { scopeType: "fieldset", scopeIdentity: stableElementIdentity(fieldset) };
  if (element.form) return { scopeType: "form", scopeIdentity: stableElementIdentity(element.form) };
  return { scopeType: "document", scopeIdentity: "document" };
}
function stableElementIdentity(element: Element): string {
  if (element.id) return `id:${element.id}`;
  if (element instanceof HTMLFormElement && element.name) return `name:${element.name}`;
  const segments: string[] = [];
  let current: Element | null = element;
  while (current && current !== current.ownerDocument.documentElement) {
    const siblings = current.parentElement ? Array.from(current.parentElement.children).filter(sibling => sibling.tagName === current!.tagName) : [];
    segments.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${Math.max(1, siblings.indexOf(current) + 1)})`);
    current = current.parentElement;
  }
  return `path:${segments.join(">")}`;
}

export function scanDocument(root: ParentNode = document): ScanResult {
  const started = globalThis.performance?.now?.() ?? Date.now();
  const scanSessionId = `scan-${scannerInstanceId}-${++scanSequence}`;
  const candidates = Array.from(root.querySelectorAll<ScannableElement>("input, textarea, select"));
  const labelIndex = buildLabelIndex(root);
  const metadata = new Map<ScannableElement, ScanMetadata>();
  const safeElements = candidates.filter(element => {
    const context = contextFor(element, labelIndex);
    const visible = isVisible(element);
    metadata.set(element, { context, visible });
    return !exclusionReason(element, contextText(element, context), visible);
  });
  const scopeIds = new Map<Element, number>();
  const choiceGroups = new Map<string, HTMLInputElement[]>();
  const ordered: Array<ScannableElement | string> = [];
  safeElements.forEach((element, index) => {
    if (element instanceof HTMLInputElement && (element.type === "radio" || element.type === "checkbox")) {
      const key = groupKey(element, scopeIds, index);
      if (!choiceGroups.has(key)) { choiceGroups.set(key, []); ordered.push(key); }
      choiceGroups.get(key)!.push(element);
    } else ordered.push(element);
  });
  const fields: FieldDescriptor[] = [];
  const elementMap = new Map<string, HTMLElement>();
  ordered.forEach((item, index) => {
    const fieldId = `${scanSessionId}-field-${index + 1}`;
    if (typeof item === "string") {
      const members = choiceGroups.get(item)!;
      fields.push(choiceDescriptor(members, fieldId, metadata, labelIndex));
      elementMap.set(fieldId, members[0]);
    } else {
      fields.push(baseDescriptor(item, fieldId, metadata.get(item)!));
      elementMap.set(fieldId, item);
    }
  });
  return {
    scanSessionId, fields, elementMap,
    stats: { scannedElementCount: candidates.length, usableFieldCount: fields.length, excludedFieldCount: candidates.length - safeElements.length, durationMs: (globalThis.performance?.now?.() ?? Date.now()) - started }
  };
}