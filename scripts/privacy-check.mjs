import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split(/\r?\n/u).filter(Boolean);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".html", ".css", ".md", ".yml", ".yaml", ".txt"]);
const allowed = ["demo@example.com", "existing@example.test", "13800000000"];
const checks = [
  ["Chinese mobile number", /\b1[3-9]\d{9}\b/gu],
  ["Chinese identity number", /\b\d{17}[\dXx]\b/gu],
  ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu],
  ["OpenAI-style API key", /\bsk-[A-Za-z0-9_-]{16,}\b/gu],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gu],
  ["AWS access key", /\bAKIA[A-Z0-9]{16}\b/gu],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu]
];
const findings = [];
for (const file of files) {
  if (!textExtensions.has(extname(file).toLowerCase()) || file === "scripts/privacy-check.mjs") continue;
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  const sanitized = allowed.reduce((text, value) => text.split(value).join(""), content);
  for (const [label, pattern] of checks) {
    pattern.lastIndex = 0;
    for (const match of sanitized.matchAll(pattern)) {
      const line = sanitized.slice(0, match.index).split(/\r?\n/u).length;
      findings.push(`${file}:${line} ${label}`);
    }
  }
}
if (findings.length) {
  console.error("Privacy check failed:\n" + findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Privacy check passed (${files.length} repository files inspected; no suspected secrets or personal data).`);
}