export function scalarProfileValue(value: unknown): { value?: string; reason?: string } {
  if (Array.isArray(value)) {
    const nonEmpty = value.map(item => String(item).trim()).filter(Boolean);
    if (nonEmpty.length === 1) return { value: nonEmpty[0] };
    return { reason: nonEmpty.length ? "multiple_values_not_supported" : "empty_profile_value" };
  }
  if (typeof value === "string") return value.trim() ? { value: value.trim() } : { reason: "empty_profile_value" };
  if (typeof value === "number" && Number.isFinite(value)) return { value: String(value) };
  return { reason: "unsupported_profile_value" };
}

export function normalizeDateForInput(value: string, type: string): { value?: string; reason?: string } {
  if (type === "date") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) && isValidDate(value)) return { value };
    return { reason: "unsafe_date_conversion" };
  }
  if (type === "month") {
    if (/^\d{4}-\d{2}$/.test(value) && validMonth(value)) return { value };
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) && isValidDate(value)) return { value: value.slice(0, 7) };
    return { reason: "unsafe_date_conversion" };
  }
  return { value };
}

function validMonth(value: string): boolean {
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

function isValidDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateNumberValue(element: HTMLInputElement, value: string): { value?: string; reason?: string } {
  if (!value.trim() || !Number.isFinite(Number(value))) return { reason: "invalid_number" };
  const numeric = Number(value);
  if (element.min !== "" && numeric < Number(element.min)) return { reason: "number_out_of_range" };
  if (element.max !== "" && numeric > Number(element.max)) return { reason: "number_out_of_range" };
  if (element.step && element.step !== "any") {
    const step = Number(element.step);
    const base = element.min === "" ? 0 : Number(element.min);
    if (!Number.isFinite(step) || step <= 0) return { reason: "invalid_number_step" };
    const quotient = (numeric - base) / step;
    if (Math.abs(quotient - Math.round(quotient)) > 1e-9) return { reason: "number_step_mismatch" };
  }
  return { value: String(numeric) };
}