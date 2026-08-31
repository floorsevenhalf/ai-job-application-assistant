import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { matchFieldsWithStats } from "../../extension/core/matcher/match-fields";
import { FIELD_RULES } from "../../extension/core/rules/field-rules";
import { scanDocument } from "../../extension/core/scanner/scan-form";
import type { UserProfile } from "../../extension/profile/schema";

const profile: UserProfile = {
  schemaVersion: 1, id: "benchmark", profileName: "Benchmark",
  basic: { fullName: "示例姓名", gender: "male", phone: "13800000000", email: "demo@example.com", birthDate: "2002-01-01", city: "示例市", region: "示例省" },
  educations: [{ id: "e", school: "示例大学", college: "示例学院", degree: "本科", major: "示例专业", startDate: "2020-09", endDate: "2024-06", isHighest: true }],
  jobPreferences: { directions: ["开发"], preferredCities: ["示例市"] }, metadata: { createdAt: "2026", updatedAt: "2026" }
};

describe("large form benchmark", () => {
  it("scans and matches 325 controls without superlinear failure", () => {
    const html = readFileSync(resolve(process.cwd(), "examples/forms/large-form.html"), "utf8");
    document.open(); document.write(html); document.close();
    const totalStarted = performance.now();
    const scan = scanDocument();
    const match = matchFieldsWithStats(scan.fields, profile, FIELD_RULES);
    const totalDurationMs = performance.now() - totalStarted;
    console.info(`[benchmark] controls=${scan.stats.scannedElementCount} fields=${scan.stats.usableFieldCount} scan=${scan.stats.durationMs.toFixed(1)}ms match=${match.stats.durationMs.toFixed(1)}ms total=${totalDurationMs.toFixed(1)}ms`);
    expect(scan.stats.scannedElementCount).toBe(325);
    expect(scan.stats.usableFieldCount).toBe(300);
    expect(match.results).toHaveLength(300);
    // Loose jsdom guard: catches exponential regressions without depending on host load.
    expect(totalDurationMs).toBeLessThan(15000);
  }, 20_000);
});
