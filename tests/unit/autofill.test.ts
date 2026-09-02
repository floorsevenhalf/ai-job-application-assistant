import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFillRequests, fillMatchedFields } from "../../extension/core/autofill/fill-matched-fields";
import { fillForScanSession } from "../../extension/core/autofill/fill-session";
import { fillRadioGroup } from "../../extension/core/autofill/fill-radio";
import { fillSelectField } from "../../extension/core/autofill/fill-select";
import type { FillRequest } from "../../extension/core/autofill/types";
import type { MatchResult } from "../../extension/core/matcher/types";
import type { ProfileFieldPath } from "../../extension/profile/paths";
import type { UserProfile } from "../../extension/profile/schema";

const baseProfile: UserProfile = {
  schemaVersion: 2,
  id: "autofill-profile",
  profileName: "Autofill 测试",
  basic: { fullName: "张小明", gender: "male", phone: "13800000000", email: "demo@example.com", birthDate: "2002-01-02", city: "深圳", region: "广东" },
  educations: [{ id: "education", school: "示例大学", college: "计算机学院", degree: "硕士", major: "计算机科学", startDate: "2020-09", endDate: "2024-06", isHighest: true }],
  internships: [], projects: [], languages: [], familyMembers: [],
  jobPreferences: { directions: ["前端开发"], preferredCities: ["上海"] },
  metadata: { createdAt: "2026-01-01", updatedAt: "2026-01-01" }
};

function setBody(html: string) { document.body.innerHTML = html; }
function byId<T extends HTMLElement>(id: string): T { return document.getElementById(id) as T; }
function request(profilePath: ProfileFieldPath = "basic.fullName", fieldId = "field-1"): FillRequest { return { fieldId, profilePath }; }
function run(element: HTMLElement, profilePath: ProfileFieldPath = "basic.fullName", profile = baseProfile, overwrite = false) {
  return fillMatchedFields([request(profilePath)], profile, new Map([["field-1", element]]), { overwriteExistingValues: overwrite })[0];
}

describe("Autofill text fields", () => {
  beforeEach(() => setBody(""));

  it.each([
    ['<input id="target" type="text">', "basic.fullName", "张小明"],
    ['<input id="target" type="email">', "basic.email", "demo@example.com"],
    ['<input id="target" type="tel">', "basic.phone", "13800000000"],
    ['<textarea id="target"></textarea>', "educations.primary.school", "示例大学"]
  ] as const)("fills %s", (html, path, expected) => {
    setBody(html);
    const result = run(byId("target"), path);
    expect(result).toMatchObject({ status: "filled", previousValue: "", filledValue: expected });
    expect((byId("target") as HTMLInputElement).value).toBe(expected);
  });

  it("dispatches focus, input, change and blur with bubbling", () => {
    setBody('<div id="parent"><input id="target"></div>');
    const events: string[] = [];
    for (const name of ["focus", "input", "change", "blur"]) byId("parent").addEventListener(name, () => events.push(name));
    run(byId("target"));
    expect(events).toEqual(["focus", "input", "change", "blur"]);
  });

  it("does not overwrite an existing value by default", () => {
    setBody('<input id="target" value="网页已有值">');
    expect(run(byId("target"))).toMatchObject({ status: "skipped", reason: "existing_value", previousValue: "网页已有值" });
    expect(byId<HTMLInputElement>("target").value).toBe("网页已有值");
  });

  it("overwrites when explicitly enabled", () => {
    setBody('<input id="target" value="网页已有值">');
    expect(run(byId("target"), "basic.fullName", baseProfile, true).status).toBe("filled");
    expect(byId<HTMLInputElement>("target").value).toBe("张小明");
  });

  it("uses the native prototype setter", () => {
    setBody('<input id="target">');
    const setter = vi.spyOn(HTMLInputElement.prototype, "value", "set");
    run(byId("target"));
    expect(setter).toHaveBeenCalledWith("张小明");
    setter.mockRestore();
  });

  it("reports when an input listener resets the value", () => {
    setBody('<input id="target">');
    const element = byId<HTMLInputElement>("target");
    element.addEventListener("input", () => { element.value = ""; });
    expect(run(element)).toMatchObject({ status: "failed", reason: "value_reverted_on_input" });
  });

  it("focuses before writing so a controlled field cannot clear the new value on focus", () => {
    setBody('<input id="target">');
    const element = byId<HTMLInputElement>("target");
    element.addEventListener("focus", () => { element.value = ""; });
    expect(run(element)).toMatchObject({ status: "filled", filledValue: baseProfile.basic.fullName });
    expect(element.value).toBe(baseProfile.basic.fullName);
  });
});

describe("Autofill select fields", () => {
  beforeEach(() => setBody(""));
  function select(html: string) { setBody(`<select id="target"><option value="">请选择</option>${html}</select>`); return byId<HTMLSelectElement>("target"); }

  it("matches exact option value", () => expect(fillSelectField(select('<option value="male">未知标签</option>'), "male").filledValue).toBe("male"));
  it("matches normalized option value", () => expect(fillSelectField(select('<option value="MALE">未知标签</option>'), "male").filledValue).toBe("MALE"));
  it("matches exact option label", () => expect(fillSelectField(select('<option value="1">硕士</option>'), "硕士").filledValue).toBe("1"));
  it("matches normalized option label", () => expect(fillSelectField(select('<option value="1">Master</option>'), "master").filledValue).toBe("1"));
  it("matches aliases without changing profile values", () => {
    const element = select('<option value="2">硕士研究生</option>');
    expect(run(element, "educations.primary.degree")).toMatchObject({ status: "filled", filledValue: "2" });
    expect(baseProfile.educations[0].degree).toBe("硕士");
  });
  it("does not choose an unrelated option", () => {
    const element = select('<option value="1">本科</option>');
    expect(fillSelectField(element, "博士")).toMatchObject({ status: "failed", reason: "no_matching_option" });
    expect(element.value).toBe("");
  });
  it("does not choose a disabled matching option", () => {
    const element = select('<option value="master" disabled>硕士</option>');
    expect(fillSelectField(element, "硕士")).toMatchObject({ status: "failed", reason: "no_matching_option" });
  });
  it("does not overwrite an existing selection by default", () => {
    const element = select('<option value="bachelor" selected>本科</option><option value="master">硕士</option>');
    expect(fillSelectField(element, "硕士")).toMatchObject({ status: "skipped", reason: "existing_value" });
  });
});

describe("Autofill radio groups", () => {
  beforeEach(() => setBody(""));

  it("matches Chinese male/female labels", () => {
    setBody('<fieldset><label><input id="first" type="radio" name="gender" value="1">男</label><label><input id="female" type="radio" name="gender" value="2">女</label></fieldset>');
    expect(fillRadioGroup(byId("first"), "female").status).toBe("filled");
    expect(byId<HTMLInputElement>("female").checked).toBe(true);
  });
  it("matches English labels", () => {
    setBody('<form><label><input id="first" type="radio" name="gender" value="1">Male</label><label><input id="female" type="radio" name="gender" value="2">Female</label></form>');
    fillRadioGroup(byId("first"), "female");
    expect(byId<HTMLInputElement>("female").checked).toBe(true);
  });
  it("matches aliases in option values", () => {
    setBody('<form><input id="first" aria-label="男人" type="radio" name="gender" value="m"><input id="female" aria-label="女人" type="radio" name="gender" value="f"></form>');
    fillRadioGroup(byId("first"), "male");
    expect(byId<HTMLInputElement>("first").checked).toBe(true);
  });
  it("does not cross forms with the same name", () => {
    setBody('<form id="one"><label><input id="first" type="radio" name="gender" value="male">Male</label></form><form><label><input id="outside" type="radio" name="gender" value="female">Female</label></form>');
    expect(fillRadioGroup(byId("first"), "female")).toMatchObject({ status: "failed", reason: "no_matching_option" });
    expect(byId<HTMLInputElement>("outside").checked).toBe(false);
  });
  it("keeps browser radio exclusivity", () => {
    setBody('<form><label><input id="first" type="radio" name="gender" value="male" checked>Male</label><label><input id="female" type="radio" name="gender" value="female">Female</label></form>');
    fillRadioGroup(byId("first"), "female", true);
    expect(byId<HTMLInputElement>("first").checked).toBe(false);
    expect(byId<HTMLInputElement>("female").checked).toBe(true);
  });
  it("does not overwrite an existing checked option by default", () => {
    setBody('<form><input id="first" type="radio" name="gender" value="male" checked><input type="radio" name="gender" value="female"></form>');
    expect(fillRadioGroup(byId("first"), "female")).toMatchObject({ status: "skipped", reason: "existing_value" });
  });
});

describe("Autofill date, month and number", () => {
  beforeEach(() => setBody(""));
  it("fills a valid date", () => { setBody('<input id="target" type="date">'); expect(run(byId("target"), "basic.birthDate").filledValue).toBe("2002-01-02"); });
  it("converts a full date to month", () => { setBody('<input id="target" type="month">'); expect(run(byId("target"), "basic.birthDate").filledValue).toBe("2002-01"); });
  it("fills an existing YYYY-MM month", () => { setBody('<input id="target" type="month">'); expect(run(byId("target"), "educations.primary.startDate").filledValue).toBe("2020-09"); });
  it("does not invent a day for a date input", () => { setBody('<input id="target" type="date">'); expect(run(byId("target"), "educations.primary.startDate")).toMatchObject({ status: "skipped", reason: "unsafe_date_conversion" }); });
  it("rejects an invalid calendar date", () => {
    setBody('<input id="target" type="date">');
    const changed = { ...baseProfile, basic: { ...baseProfile.basic, birthDate: "2023-02-31" } };
    expect(run(byId("target"), "basic.birthDate", changed)).toMatchObject({ status: "skipped", reason: "unsafe_date_conversion" });
  });
  it("fills a valid number", () => { setBody('<input id="target" type="number" min="1" max="20" step="1">'); const changed = { ...baseProfile, basic: { ...baseProfile.basic, phone: "12" } }; expect(run(byId("target"), "basic.phone", changed).status).toBe("filled"); });
  it("rejects NaN", () => { setBody('<input id="target" type="number">'); const changed = { ...baseProfile, basic: { ...baseProfile.basic, phone: "abc" } }; expect(run(byId("target"), "basic.phone", changed).reason).toBe("invalid_number"); });
  it("respects min and max", () => { setBody('<input id="target" type="number" max="10">'); const changed = { ...baseProfile, basic: { ...baseProfile.basic, phone: "12" } }; expect(run(byId("target"), "basic.phone", changed).reason).toBe("number_out_of_range"); });
  it("respects step", () => { setBody('<input id="target" type="number" step="2">'); const changed = { ...baseProfile, basic: { ...baseProfile.basic, phone: "3" } }; expect(run(byId("target"), "basic.phone", changed).reason).toBe("number_step_mismatch"); });
});

describe("Autofill safety and sessions", () => {
  beforeEach(() => setBody(""));
  it.each([
    ['<input id="target" disabled>', "disabled"],
    ['<input id="target" readonly>', "read-only"],
    ['<input id="target" style="display:none">', "not-visible"],
    ['<input id="target" type="password">', "unsupported-input-type:password"],
    ['<input id="target" type="submit">', "unsupported-input-type:submit"]
  ])("skips unsafe element %s", (html, reason) => { setBody(html); expect(run(byId("target"))).toMatchObject({ status: "skipped", reason }); });

  it("never checks a consent checkbox", () => {
    setBody('<label><input id="target" type="checkbox">我已阅读并同意隐私政策</label>');
    expect(run(byId("target"))).toMatchObject({ status: "skipped", reason: "sensitive-or-consent-field" });
    expect(byId<HTMLInputElement>("target").checked).toBe(false);
  });
  it("skips an ordinary checkbox without a boolean profile mapping", () => {
    setBody('<label><input id="target" type="checkbox">是否接受调剂</label>');
    expect(run(byId("target"))).toMatchObject({ status: "skipped", reason: "checkbox_without_boolean_profile_mapping" });
  });
  it("skips an element removed after scanning", () => {
    setBody('<input id="target">'); const element = byId("target"); element.remove();
    expect(run(element)).toMatchObject({ status: "skipped", reason: "element_not_in_document" });
  });
  it("fails when fieldId is absent", () => expect(fillMatchedFields([request()], baseProfile, new Map())[0]).toMatchObject({ status: "failed", reason: "field_not_found" }));
  it("rejects a stale scan session", () => {
    setBody('<input id="target">');
    expect(fillForScanSession("scan-old", "scan-new", [request()], baseProfile, new Map([["field-1", byId("target")]]))[0]).toMatchObject({ status: "failed", reason: "stale_scan_session" });
    expect(byId<HTMLInputElement>("target").value).toBe("");
  });
  it("allows the current scan session", () => {
    setBody('<input id="target">');
    expect(fillForScanSession("scan-1", "scan-1", [request()], baseProfile, new Map([["field-1", byId("target")]]))[0].status).toBe("filled");
  });
  it("returns JSON-serializable results", () => {
    setBody('<input id="target">'); const result = run(byId("target"));
    expect(() => JSON.stringify(result)).not.toThrow();
    expect(JSON.stringify(result)).not.toContain("HTMLInputElement");
  });
});

describe("Matched-only request creation", () => {
  it("creates requests only for selected matched results", () => {
    const matches: MatchResult[] = [
      { fieldId: "matched", status: "matched", profilePath: "basic.fullName", confidence: 1, evidence: [], candidatePaths: [] },
      { fieldId: "ambiguous", status: "ambiguous", profilePath: "basic.city", confidence: .7, evidence: [], candidatePaths: [] },
      { fieldId: "empty", status: "empty_profile_value", profilePath: "basic.email", confidence: 1, evidence: [], candidatePaths: [] },
      { fieldId: "unmatched", status: "unmatched", confidence: 0, evidence: [], candidatePaths: [] }
    ];
    const selections = new Map([
      ['matched', { profilePath: 'basic.fullName', source: 'rule_matched' }],
      ['ambiguous', { profilePath: 'basic.city', source: 'rule_matched' }],
      ['empty', { profilePath: 'basic.email', source: 'rule_matched' }],
      ['unmatched', { profilePath: 'basic.fullName', source: 'rule_matched' }]
    ] as const);
    expect(createFillRequests(matches, selections)).toEqual([{ fieldId: "matched", profilePath: "basic.fullName" }]);
  });

  it('requires explicit rule confirmation before creating an ambiguous request', () => {
    const match: MatchResult = { fieldId: 'name', status: 'ambiguous', profilePath: 'basic.fullName', confidence: .72, evidence: [], candidatePaths: [{ profilePath: 'basic.fullName', confidence: .72 }] };
    expect(createFillRequests([match], new Map())).toEqual([]);
    expect(createFillRequests([match], new Map([['name', { profilePath: 'basic.fullName', source: 'rule_confirmed' }]]))).toEqual([{ fieldId: 'name', profilePath: 'basic.fullName' }]);
  });

  it('records rule_confirmed separately and blocks a strong veto', () => {
    const match: MatchResult = { fieldId: 'contact', status: 'ambiguous', profilePath: 'basic.fullName', confidence: .72, evidence: [{ source: 'label', text: 'emergency contact', score: -1, kind: 'negative', veto: true }], candidatePaths: [] };
    const selection = { profilePath: 'basic.fullName' as const, source: 'rule_confirmed' as const };
    expect(selection.source).toBe('rule_confirmed');
    expect(createFillRequests([match], new Map([['contact', selection]]))).toEqual([]);
  });
});
