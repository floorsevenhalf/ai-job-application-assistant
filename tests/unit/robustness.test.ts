import { describe, expect, it, vi } from "vitest";
import { SiteAdapterRegistry } from "../../extension/core/adapters/registry";
import { fillMatchedFieldsVerified } from "../../extension/core/autofill/verify-fill";
import { highlightFilledElement } from "../../extension/core/autofill/highlight";
import { restoreFilledFields } from "../../extension/core/autofill/restore-fields";
import type { FillResult } from "../../extension/core/autofill/types";
import { matchFieldsWithStats } from "../../extension/core/matcher/match-fields";
import { FIELD_RULES } from "../../extension/core/rules/field-rules";
import { scanDocument } from "../../extension/core/scanner/scan-form";
import { observeScannedElements } from "../../extension/content/session-observer";
import { fillReasonMessage } from "../../extension/popup/fill-reason-messages";
import type { UserProfile } from "../../extension/profile/schema";

const profile: UserProfile = {
  schemaVersion: 2, id: "robust", profileName: "测试",
  basic: { fullName: "张小明", gender: "male", phone: "13800000000", email: "demo@example.com", birthDate: "2002-01-01", city: "深圳", region: "广东" },
  educations: [{ id: "education", school: "示例大学", college: "计算机学院", degree: "硕士", major: "计算机", startDate: "2020-09", endDate: "2024-06", isHighest: true }],
  internships: [], projects: [], languages: [], familyMembers: [], jobPreferences: { directions: ["前端开发"], preferredCities: ["上海"] }, metadata: { createdAt: "2026", updatedAt: "2026" }
};

function input(id = "field"): HTMLInputElement { document.body.innerHTML = `<input id="${id}">`; return document.getElementById(id) as HTMLInputElement; }
function record(overrides: Partial<FillResult> = {}): FillResult {
  return { fieldId: "field-1", profilePath: "basic.fullName", status: "filled", previousValue: "", filledValue: "张小明", ...overrides };
}

describe("Undo restore", () => {
  it("restores a text field when its value is unchanged after fill", () => {
    const element = input(); element.value = "张小明";
    expect(restoreFilledFields([record()], new Map([["field-1", element]]))[0]).toMatchObject({ status: "restored", restoredValue: "" });
    expect(element.value).toBe("");
  });
  it("does not overwrite a user edit made after Autofill", () => {
    const element = input(); element.value = "用户手动修改";
    expect(restoreFilledFields([record()], new Map([["field-1", element]]))[0]).toMatchObject({ status: "skipped", reason: "value_changed_after_fill" });
    expect(element.value).toBe("用户手动修改");
  });
  it("ignores records that were not filled", () => expect(restoreFilledFields([record({ status: "skipped" })], new Map())).toEqual([]));
  it("restores a select value", () => {
    document.body.innerHTML = '<select id="field"><option value="bachelor">本科</option><option value="master" selected>硕士</option></select>';
    const element = document.getElementById("field") as HTMLSelectElement;
    expect(restoreFilledFields([record({ profilePath: "educations.primary.degree", previousValue: "bachelor", filledValue: "master" })], new Map([["field-1", element]]))[0].status).toBe("restored");
    expect(element.value).toBe("bachelor");
  });
  it("restores the previously checked radio", () => {
    document.body.innerHTML = '<fieldset><input id="first" type="radio" name="gender" value="male"><input id="female" type="radio" name="gender" value="female" checked></fieldset>';
    const first = document.getElementById("first") as HTMLInputElement;
    expect(restoreFilledFields([record({ profilePath: "basic.gender", previousValue: "male", filledValue: "female" })], new Map([["field-1", first]]))[0].status).toBe("restored");
    expect(first.checked).toBe(true);
  });
  it("restores a previously empty radio group", () => {
    document.body.innerHTML = '<fieldset><input id="first" type="radio" name="gender" value="male" checked><input type="radio" name="gender" value="female"></fieldset>';
    const first = document.getElementById("first") as HTMLInputElement;
    restoreFilledFields([record({ profilePath: "basic.gender", previousValue: "", filledValue: "male" })], new Map([["field-1", first]]));
    expect(first.checked).toBe(false);
  });
});

describe("Delayed verification and highlighting", () => {
  it("keeps a value that persists after the delay", async () => {
    const element = input();
    const batch = await fillMatchedFieldsVerified([{ fieldId: "field-1", profilePath: "basic.fullName" }], profile, new Map([["field-1", element]]), { verificationDelayMs: 5, highlightFilledFields: false });
    expect(batch.results[0].status).toBe("filled");
    expect(batch.stats).toMatchObject({ requestedCount: 1, filledCount: 1, failedCount: 0 });
  });
  it("detects a framework reverting the value asynchronously", async () => {
    const element = input();
    setTimeout(() => { element.value = ""; }, 5);
    const batch = await fillMatchedFieldsVerified([{ fieldId: "field-1", profilePath: "basic.fullName" }], profile, new Map([["field-1", element]]), { verificationDelayMs: 20, highlightFilledFields: false });
    expect(batch.results[0]).toMatchObject({ status: "failed", reason: "value_reverted_after_fill" });
  });
  it("restores original inline highlight styles", () => {
    vi.useFakeTimers();
    const element = input(); element.style.outline = "1px dashed red"; element.style.transition = "opacity 1s";
    highlightFilledElement(element, 100);
    expect(element.dataset.aiJobAssistantFilled).toBe("true");
    expect(element.style.outline).toContain("#3157d5");
    vi.advanceTimersByTime(100);
    expect(element.style.outline).toBe("1px dashed red");
    expect(element.style.transition).toBe("opacity 1s");
    expect(element.dataset.aiJobAssistantFilled).toBeUndefined();
    vi.useRealTimers();
  });
});

describe("DOM session invalidation", () => {
  it("does not invalidate for unrelated DOM updates", async () => {
    document.body.innerHTML = '<div id="container"><input id="field"></div><div id="other"></div>';
    const callback = vi.fn(); const observer = observeScannedElements([document.getElementById("field")!], callback);
    document.getElementById("other")!.append(document.createElement("span"));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(callback).not.toHaveBeenCalled(); observer.disconnect();
  });
  it("invalidates when a scanned field is removed", async () => {
    const element = input(); const callback = vi.fn(); observeScannedElements([element], callback); element.remove();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(callback).toHaveBeenCalledOnce();
  });
  it("invalidates when a framework replaces a scanned field", async () => {
    document.body.innerHTML = '<div id="root"><input id="field"></div>';
    const old = document.getElementById("field")!; const callback = vi.fn(); observeScannedElements([old], callback);
    document.getElementById("root")!.innerHTML = '<input id="field">';
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(callback).toHaveBeenCalledOnce();
  });
});

describe("Group identity and adapter registry", () => {
  it("assigns different identities to same-name groups in different fieldsets", () => {
    document.body.innerHTML = '<fieldset id="a"><input type="radio" name="choice" value="1"><input type="radio" name="choice" value="2"></fieldset><fieldset id="b"><input type="radio" name="choice" value="1"><input type="radio" name="choice" value="2"></fieldset>';
    const groups = scanDocument().fields;
    expect(groups).toHaveLength(2);
    expect(groups[0].group?.scopeType).toBe("fieldset");
    expect(groups[0].group?.scopeIdentity).not.toBe(groups[1].group?.scopeIdentity);
  });
  it("registers and resolves matching adapters without domain logic in core", () => {
    const registry = new SiteAdapterRegistry();
    registry.register({ id: "example", matches: url => url.hostname === "example.test" });
    expect(registry.matching(new URL("https://example.test/jobs"))).toHaveLength(1);
    expect(registry.matching(new URL("https://other.test"))).toHaveLength(0);
    expect(registry.unregister("example")).toBe(true);
  });
  it("rejects duplicate adapter ids", () => {
    const registry = new SiteAdapterRegistry(); const adapter = { id: "same", matches: () => true };
    registry.register(adapter);
    expect(() => registry.register(adapter)).toThrow("Duplicate site adapter");
  });
});

describe("Local-only performance stats and reason messages", () => {
  it("reports scan counts without field values", () => {
    document.body.innerHTML = '<input name="name"><input type="password"><input disabled>';
    const scan = scanDocument();
    expect(scan.stats).toMatchObject({ scannedElementCount: 3, usableFieldCount: 1, excludedFieldCount: 2 });
    expect(JSON.stringify(scan.stats)).not.toContain("name");
  });
  it("reports match counts", () => {
    document.body.innerHTML = '<label>姓名<input name="fullName"></label><label>未知<input name="unknown"></label>';
    const scan = scanDocument(); const batch = matchFieldsWithStats(scan.fields, profile, FIELD_RULES);
    expect(batch.stats.matchedCount).toBe(1);
    expect(batch.stats.unmatchedCount).toBe(1);
    expect(batch.stats.durationMs).toBeGreaterThanOrEqual(0);
  });
  it("maps stable reason codes only in the UI layer", () => {
    expect(fillReasonMessage("existing_value")).toBe("网页中已有内容，已跳过");
    expect(fillReasonMessage("stale_scan_session")).toBe("页面已发生变化，请重新扫描");
    expect(fillReasonMessage("value_reverted_after_fill")).toBe("网页重新渲染后覆盖了填写结果");
  });
});
