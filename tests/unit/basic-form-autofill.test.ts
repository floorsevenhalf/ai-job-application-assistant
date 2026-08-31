import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFillRequests } from "../../extension/core/autofill/fill-matched-fields";
import { fillForScanSession } from "../../extension/core/autofill/fill-session";
import { matchFields } from "../../extension/core/matcher/match-fields";
import { FIELD_RULES } from "../../extension/core/rules/field-rules";
import { scanDocument } from "../../extension/core/scanner/scan-form";
import type { UserProfile } from "../../extension/profile/schema";

const profile: UserProfile = {
  schemaVersion: 1,
  id: "integration-autofill",
  profileName: "集成测试资料",
  basic: { fullName: "张小明", gender: "male", phone: "13800000000", email: "demo@example.com", birthDate: "2002-01-01", city: "示例市", region: "示例省" },
  educations: [{ id: "education", school: "示例大学", college: "计算机学院", degree: "硕士", major: "计算机科学与技术", startDate: "2020-09", endDate: "2024-06", isHighest: true }],
  jobPreferences: { directions: ["前端开发"], preferredCities: ["示例市"] },
  metadata: { createdAt: "2026-01-01", updatedAt: "2026-01-01" }
};

describe("basic-form full local pipeline", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("fills only seven matched fields and never touches unsafe or unmatched controls", () => {
    const html = readFileSync(resolve(process.cwd(), "examples/forms/basic-form.html"), "utf8");
    document.open(); document.write(html); document.close();
    let submitClicks = 0;
    document.querySelector('button[type="submit"]')!.addEventListener("click", () => { submitClicks += 1; });

    const scan = scanDocument();
    const matches = matchFields(scan.fields, profile, FIELD_RULES);
    const selected = new Set(matches.filter(match => match.status === "matched").map(match => match.fieldId));
    const requests = createFillRequests(matches, selected);
    const results = fillForScanSession(scan.scanSessionId, scan.scanSessionId, requests, profile, scan.elementMap);

    expect(requests).toHaveLength(7);
    expect(results).toHaveLength(7);
    expect(results.every(result => result.status === "filled")).toBe(true);
    expect((document.querySelector('[name="fullName"]') as HTMLInputElement).value).toBe("张小明");
    expect((document.querySelector('[name="phone"]') as HTMLInputElement).value).toBe("13800000000");
    expect((document.querySelector('[name="email"]') as HTMLInputElement).value).toBe("demo@example.com");
    expect((document.querySelector('[name="school"]') as HTMLInputElement).value).toBe("示例大学");
    expect((document.querySelector('[name="major"]') as HTMLInputElement).value).toBe("计算机科学与技术");
    expect((document.querySelector('[name="degree"]') as HTMLSelectElement).value).toBe("master");
    expect((document.querySelector('[name="gender"][value="male"]') as HTMLInputElement).checked).toBe(true);

    expect((document.querySelector('#password') as HTMLInputElement).value).toBe("");
    expect((document.querySelector('#captcha') as HTMLInputElement).value).toBe("");
    expect((document.querySelector('[name="privacyConsent"]') as HTMLInputElement).checked).toBe(false);
    expect((document.querySelector('[name="acceptTransfer"]') as HTMLInputElement).checked).toBe(false);
    expect(submitClicks).toBe(0);
  });
});