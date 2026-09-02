import { describe, expect, it } from "vitest";
import { matchField, matchFields } from "../../extension/core/matcher/match-fields";
import { scoreFieldAgainstRule } from "../../extension/core/matcher/score-rule";
import { FIELD_RULES } from "../../extension/core/rules/field-rules";
import type { FieldDescriptor, FieldKind } from "../../extension/core/scanner/types";
import { matchesTerm, normalizeText } from "../../extension/core/normalization/normalize-text";
import { getPrimaryEducation, resolveProfileValue } from "../../extension/profile/resolver";
import type { UserProfile } from "../../extension/profile/schema";

const profile: UserProfile = {
  schemaVersion: 2,
  id: "test-profile",
  profileName: "测试资料",
  basic: { fullName: "张小明", gender: "male", phone: "13800000000", email: "demo@example.com", birthDate: "2002-01-01", city: "深圳", region: "广东" },
  educations: [{ id: "education", school: "示例大学", college: "计算机学院", degree: "本科", major: "计算机科学", startDate: "2020-09", endDate: "2024-06", isHighest: true }],
  internships: [], projects: [], languages: [], familyMembers: [],
  jobPreferences: { directions: ["前端开发"], preferredCities: ["上海"] },
  metadata: { createdAt: "2026-01-01", updatedAt: "2026-01-01" }
};

let fieldCounter = 0;
function field(label: string, kind: FieldKind = "text", extra: Partial<FieldDescriptor> = {}): FieldDescriptor {
  fieldCounter += 1;
  return {
    fieldId: `field-${fieldCounter}`,
    kind,
    attributes: { type: kind, ...extra.attributes },
    context: {
      labelTexts: label ? [label] : [],
      visualLabelTexts: [],
      ariaLabelledByTexts: [],
      nearbyText: [],
      ...extra.context
    },
    options: extra.options ?? [],
    state: { currentValue: "", required: false, disabled: false, readOnly: false, visible: true, ...extra.state },
    group: extra.group,
    safety: extra.safety ?? { excluded: false }
  };
}

function expectMatch(descriptor: FieldDescriptor, path: string) {
  const result = matchField(descriptor, profile, FIELD_RULES);
  expect(result.status).toBe("matched");
  expect(result.profilePath).toBe(path);
  expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  expect(result.confidence).toBeLessThanOrEqual(1);
}

const genderOptions = [
  { value: "male", label: "男", disabled: false },
  { value: "female", label: "女", disabled: false }
];
const degreeOptions = [
  { value: "bachelor", label: "本科", disabled: false },
  { value: "master", label: "硕士", disabled: false },
  { value: "phd", label: "博士", disabled: false }
];

describe("Rule Matcher correct matches", () => {
  it("matches full name", () => expectMatch(field("真实姓名"), "basic.fullName"));
  it("matches phone with tel type", () => expectMatch(field("手机号", "tel"), "basic.phone"));
  it("matches email with email type", () => expectMatch(field("电子邮箱", "email"), "basic.email"));
  it("matches gender using legend and options", () => expectMatch(field("", "radio", { context: { labelTexts: [], visualLabelTexts: [], ariaLabelledByTexts: [], nearbyText: [], legendText: "性别" }, options: genderOptions, group: { type: "radio", name: "gender", memberCount: 2, scopeType: "fieldset", scopeIdentity: "id:test-gender" } }), "basic.gender"));
  it("matches birth date", () => expectMatch(field("出生日期", "date"), "basic.birthDate"));
  it("matches school", () => expectMatch(field("毕业院校"), "educations.primary.school"));
  it("matches college", () => expectMatch(field("学院"), "educations.primary.college"));
  it("matches degree with options", () => expectMatch(field("最高学历", "select", { options: degreeOptions }), "educations.primary.degree"));
  it("matches major", () => expectMatch(field("所学专业"), "educations.primary.major"));
  it("matches enrollment date", () => expectMatch(field("入学时间", "month"), "educations.primary.startDate"));
  it("matches graduation date", () => expectMatch(field("预计毕业", "month"), "educations.primary.endDate"));
  it("matches current city", () => expectMatch(field("所在城市"), "basic.city"));
  it("matches region", () => expectMatch(field("所在地区"), "basic.region"));
  it("matches job direction", () => expectMatch(field("求职方向"), "jobPreferences.directions"));
  it("matches preferred cities", () => expectMatch(field("期望城市"), "jobPreferences.preferredCities"));
});

describe("Strong negative evidence", () => {
  it.each([
    ["紧急联系人姓名", "basic.fullName"],
    ["推荐人手机号", "basic.phone"],
    ["推荐人邮箱", "basic.email"],
    ["学校所在地", "educations.primary.school"],
    ["期望城市", "basic.city"],
    ["实习开始时间", "educations.primary.startDate"]
  ])("vetoes %s for %s", (label, blockedPath) => {
    const rule = FIELD_RULES.find(item => item.profilePath === blockedPath)!;
    const blocked = scoreFieldAgainstRule(field(label), rule);
    expect(blocked.confidence).toBe(0);
    expect(blocked.vetoed).toBe(true);
  });

  it("returns explainable veto evidence", () => {
    const rule = FIELD_RULES.find(item => item.profilePath === "basic.fullName")!;
    const score = scoreFieldAgainstRule(field("紧急联系人姓名"), rule);
    expect(score.vetoed).toBe(true);
    expect(score.negativeEvidence.some(evidence => evidence.veto && evidence.matchedTerm === "紧急联系人")).toBe(true);
    expect(score.confidence).toBe(0);
  });
});

describe("Ambiguous fields", () => {
  it.each(["Name", "City", "College"])("does not mark a lone %s label as matched", label => {
    const result = matchField(field(label), profile, FIELD_RULES);
    expect(result.status).toBe("ambiguous");
    expect(result.confidence).toBeGreaterThanOrEqual(0.65);
  });
});

describe("Option evidence", () => {
  it("male/female options strengthen gender", () => {
    const rule = FIELD_RULES.find(item => item.profilePath === "basic.gender")!;
    const withoutOptions = scoreFieldAgainstRule(field("性别", "radio"), rule);
    const withOptions = scoreFieldAgainstRule(field("性别", "radio", { options: genderOptions }), rule);
    expect(withOptions.rawScore).toBeGreaterThan(withoutOptions.rawScore);
    expect(withOptions.optionEvidence).toHaveLength(1);
  });

  it("degree options strengthen education degree", () => {
    const rule = FIELD_RULES.find(item => item.profilePath === "educations.primary.degree")!;
    const withoutOptions = scoreFieldAgainstRule(field("学历", "select"), rule);
    const withOptions = scoreFieldAgainstRule(field("学历", "select", { options: degreeOptions }), rule);
    expect(withOptions.confidence).toBeGreaterThanOrEqual(withoutOptions.confidence);
    expect(withOptions.optionEvidence[0].source).toBe("options");
  });
});

describe("Text normalization and token boundaries", () => {
  it("normalizes full-width characters and punctuation", () => expect(normalizeText(" Ｆｕｌｌ　Ｎａｍｅ： ")).toBe("full name"));
  it("does not match name inside username", () => expect(matchesTerm("username", "name")).toBe(false));
  it("matches major as an English token", () => expect(matchesTerm("major field", "major")).toBe(true));
  it("matches e-mail after punctuation normalization", () => expect(matchesTerm("E-mail Address", "e-mail")).toBe(true));
});

describe("Profile resolution and result safety", () => {
  it("uses the highest education", () => {
    const second = { ...profile.educations[0], id: "highest", school: "最高学历学校", isHighest: true };
    const first = { ...profile.educations[0], id: "first", school: "第一所学校", isHighest: false };
    const changed = { ...profile, educations: [first, second] };
    expect(getPrimaryEducation(changed)?.id).toBe("highest");
    expect(resolveProfileValue(changed, "educations.primary.school")).toBe("最高学历学校");
  });

  it("falls back to educations[0]", () => {
    const changed = { ...profile, educations: [{ ...profile.educations[0], isHighest: false }] };
    expect(getPrimaryEducation(changed)?.id).toBe("education");
  });

  it("returns empty_profile_value after successful semantic recognition", () => {
    const empty = { ...profile, basic: { ...profile.basic, fullName: "" } };
    expect(matchField(field("真实姓名"), empty, FIELD_RULES).status).toBe("empty_profile_value");
  });

  it("returns excluded for excluded descriptors", () => {
    expect(matchField(field("姓名", "text", { safety: { excluded: true, excludedReason: "test" } }), profile, FIELD_RULES).status).toBe("excluded");
  });

  it("keeps every confidence in range and results serializable", () => {
    const results = matchFields([field("姓名"), field("City"), field("完全未知")], profile, FIELD_RULES);
    for (const result of results) expect(result.confidence).toBeGreaterThanOrEqual(0);
    for (const result of results) expect(result.confidence).toBeLessThanOrEqual(1);
    expect(() => JSON.stringify(results)).not.toThrow();
    expect(results.every(result => result.candidatePaths.length <= 3)).toBe(true);
  });
});

describe("Visual label and placeholder evidence", () => {
  it("uses visual-label at its configured weight", () => {
    const descriptor = field("", "text", { context: { labelTexts: [], visualLabelTexts: ["姓名"], ariaLabelledByTexts: [], nearbyText: [] } });
    const rule = FIELD_RULES.find(item => item.profilePath === "basic.fullName")!;
    const score = scoreFieldAgainstRule(descriptor, rule);
    expect(score.positiveEvidence.some(item => item.source === "visual-label")).toBe(true);
    expect(score.positiveEvidence.find(item => item.source === "visual-label")!.score).toBeLessThanOrEqual(0.9);
  });

  it("ignores an exact generic placeholder but keeps a semantic placeholder", () => {
    const rule = FIELD_RULES.find(item => item.profilePath === "basic.phone")!;
    const generic = scoreFieldAgainstRule(field("", "text", { attributes: { placeholder: "请输入" } }), rule);
    const semantic = scoreFieldAgainstRule(field("", "text", { attributes: { placeholder: "请输入手机号" } }), rule);
    expect(generic.positiveEvidence.some(item => item.source === "placeholder")).toBe(false);
    expect(semantic.positiveEvidence.some(item => item.source === "placeholder")).toBe(true);
  });
});