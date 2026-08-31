import { cleanText, textWithoutControls, uniqueTexts } from "./text";

const LOCAL_CONTAINER_SELECTOR = ["label", ".form-item", ".form-group", ".field", ".control-group", ".ant-form-item", ".el-form-item", "td", "li"].join(",");
export type LabelIndex = Map<string, string[]>;

export function buildLabelIndex(root: ParentNode): LabelIndex {
  const index: LabelIndex = new Map();
  root.querySelectorAll<HTMLLabelElement>("label[for]").forEach(label => {
    if (!label.htmlFor) return;
    const values = index.get(label.htmlFor) ?? [];
    values.push(cleanText(label.textContent, 100));
    index.set(label.htmlFor, values);
  });
  return index;
}

export function getLabelTexts(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, labelIndex?: LabelIndex): string[] {
  const labels = labelIndex && element.id
    ? [...(labelIndex.get(element.id) ?? [])]
    : (element.labels ? Array.from(element.labels, label => cleanText(label.textContent, 100)) : []);
  const parentLabel = element.closest("label");
  if (parentLabel) labels.push(cleanText(parentLabel.textContent, 100));
  return uniqueTexts(labels);
}

export function getAriaLabelledByTexts(element: HTMLElement): string[] {
  const ids = element.getAttribute("aria-labelledby")?.split(/\s+/).filter(Boolean) ?? [];
  return uniqueTexts(ids.map(id => element.ownerDocument.getElementById(id)?.textContent));
}
export function getLegendText(element: HTMLElement): string | undefined {
  const legend = element.closest("fieldset")?.querySelector(":scope > legend");
  return cleanText(legend?.textContent, 100) || undefined;
}
export function getParentText(element: HTMLElement): string | undefined {
  const text = textWithoutControls(element.closest(LOCAL_CONTAINER_SELECTOR));
  return text || undefined;
}
export function getNearbyText(element: HTMLElement): string[] {
  const texts: string[] = [];
  const container = element.closest(LOCAL_CONTAINER_SELECTOR);
  if (container && container.querySelectorAll("input, textarea, select").length <= 3) texts.push(textWithoutControls(container));
  const parent = element.parentElement;
  if (parent && !parent.matches("body, form")) {
    texts.push(textWithoutControls(element.previousElementSibling));
    texts.push(textWithoutControls(element.nextElementSibling));
  }
  return uniqueTexts(texts).slice(0, 4);
}
export function getSectionTexts(element: HTMLElement): string[] {
  const texts: string[] = [];
  const fieldsetLegend = getLegendText(element);
  if (fieldsetLegend) texts.push(fieldsetLegend);
  const group = element.closest<HTMLElement>('section, [role="group"], [aria-labelledby], .section, .form-section');
  if (group && !group.matches("body, form")) {
    const labelledBy = group.getAttribute("aria-labelledby");
    if (labelledBy) labelledBy.split(/\s+/).forEach(id => texts.push(cleanText(element.ownerDocument.getElementById(id)?.textContent, 100)));
    const heading = Array.from(group.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"))
      .find(candidate => candidate.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (heading) texts.push(cleanText(heading.textContent, 100));
  }
  return uniqueTexts(texts).slice(0, 2);
}