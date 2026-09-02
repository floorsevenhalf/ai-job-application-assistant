import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { matchFields } from "../../extension/core/matcher/match-fields";
import { FIELD_RULES } from "../../extension/core/rules/field-rules";
import { scanDocument } from "../../extension/core/scanner/scan-form";
import type { UserProfile } from "../../extension/profile/schema";

const profile: UserProfile = {
  schemaVersion: 2,
  id: "integration-profile",
  profileName: "集成测试资料",
  basic: { fullName: "张小明", gender: "male", phone: "13800000000", email: "demo@example.com", birthDate: "2002-01-01", city: "示例市", region: "示例省" },
  educations: [{ id: "education", school: "示例大学", college: "计算机学院", degree: "本科", major: "计算机科学", startDate: "2020-09", endDate: "2024-06", isHighest: true }],
  internships: [], projects: [], languages: [], familyMembers: [],
  jobPreferences: { directions: ["前端开发"], preferredCities: ["示例市"] },
  metadata: { createdAt: "2026-01-01", updatedAt: "2026-01-01" }
};

describe("basic-form scanner and matcher integration", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("scans 9 safe fields and returns the expected matches", () => {
    const html = readFileSync(resolve(process.cwd(), "examples/forms/basic-form.html"), "utf8");
    document.open();
    document.write(html);
    document.close();
    const fields = scanDocument().fields;
    const matches = matchFields(fields, profile, FIELD_RULES);
    const byName = Object.fromEntries(fields.map((field, index) => [field.attributes.name, matches[index]]));

    expect(fields).toHaveLength(9);
    expect(byName.fullName).toMatchObject({ status: "matched", profilePath: "basic.fullName", confidence: 1 });
    expect(byName.phone).toMatchObject({ status: "matched", profilePath: "basic.phone", confidence: 1 });
    expect(byName.email).toMatchObject({ status: "matched", profilePath: "basic.email", confidence: 1 });
    expect(byName.school).toMatchObject({ status: "matched", profilePath: "educations.primary.school", confidence: 1 });
    expect(byName.major).toMatchObject({ status: "matched", profilePath: "educations.primary.major", confidence: 1 });
    expect(byName.degree).toMatchObject({ status: "matched", profilePath: "educations.primary.degree", confidence: 1 });
    expect(byName.gender).toMatchObject({ status: "matched", profilePath: "basic.gender", confidence: 1 });
    expect(byName.acceptTransfer).toMatchObject({ status: "unmatched", confidence: 0.25 });
    expect(byName.summary).toMatchObject({ status: "unmatched", confidence: 0 });
  });
});
