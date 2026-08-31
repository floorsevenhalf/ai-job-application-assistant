import type { FillRequest, FillResult } from "../autofill/types";
import type { FieldDescriptor } from "../scanner/types";

export interface CustomFillContext {
  request: FillRequest;
  value: unknown;
  descriptor: FieldDescriptor;
  element: HTMLElement;
}

export interface SiteAdapter {
  id: string;
  matches(url: URL): boolean;
  enhanceFieldDescriptor?(descriptor: FieldDescriptor, element: HTMLElement): FieldDescriptor;
  resolveCustomField?(descriptor: FieldDescriptor, root: ParentNode): HTMLElement | null;
  fillCustomField?(context: CustomFillContext): Promise<FillResult | null> | FillResult | null;
}