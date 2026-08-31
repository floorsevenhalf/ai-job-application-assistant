import type { ScanPerformanceStats } from "../performance/types";

export type FieldKind =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "month"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "unknown";

export interface FieldOption {
  value: string;
  label: string;
  disabled: boolean;
  selected?: boolean;
  checked?: boolean;
}

export interface FieldDescriptor {
  fieldId: string;
  kind: FieldKind;
  attributes: {
    type?: string;
    name?: string;
    id?: string;
    placeholder?: string;
    ariaLabel?: string;
    autocomplete?: string;
    role?: string;
  };
  context: {
    labelTexts: string[];
    ariaLabelledByTexts: string[];
    legendText?: string;
    sectionTexts?: string[];
    nearbyText: string[];
    parentText?: string;
  };
  options: FieldOption[];
  state: {
    currentValue: string | boolean | string[];
    required: boolean;
    disabled: boolean;
    readOnly: boolean;
    visible: boolean;
  };
  group?: {
    type: "radio" | "checkbox";
    name?: string;
    memberCount: number;
    scopeType: "fieldset" | "form" | "document";
    scopeIdentity?: string;
  };
  safety: {
    excluded: boolean;
    excludedReason?: string;
  };
}

export interface ScanResult {
  scanSessionId: string;
  fields: FieldDescriptor[];
  elementMap: Map<string, HTMLElement>;
  stats: ScanPerformanceStats;
}