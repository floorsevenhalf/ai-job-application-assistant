import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { chromium } from "@playwright/test";
import { resolve } from "node:path";

async function launchExtension(): Promise<{ context: BrowserContext; extensionId: string }> {
  const extensionPath = resolve(process.cwd(), "dist");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  const workers = context.serviceWorkers();
  const worker = workers[0] ?? await context.waitForEvent("serviceworker");
  return { context, extensionId: new URL(worker.url()).host };
}

async function saveProfile(context: BrowserContext, extensionId: string): Promise<void> {
  const page = await context.newPage();
  const consoleMessages: string[] = [];
  page.on("console", message => consoleMessages.push(message.text()));
  await page.goto(`chrome-extension://${extensionId}/extension/options/index.html`);
  await page.getByLabel("姓名").fill("示例姓名");
  await page.getByLabel("性别").selectOption("female");
  await page.getByLabel("手机号").fill("13800000000");
  await page.getByLabel("邮箱").fill("demo@example.com");
  await page.locator(".card summary").first().click();
  await page.getByLabel("学校名称").fill("示例大学");
  await page.getByLabel("学历", { exact: true }).fill("硕士");
  await page.getByLabel("专业").fill("示例专业");
  await page.getByRole("button", { name: "保存到浏览器" }).click();
  await expect(page.getByRole("status")).toContainText("资料与 AI 设置已保存在当前浏览器本地");
  expect(consoleMessages.join("\n")).not.toContain("cross-world extension resource mismatch");
  await page.close();
}

async function openFixtureAndPopup(context: BrowserContext, extensionId: string): Promise<{ form: Page; popup: Page }> {
  const form = await context.newPage();
  await form.goto("http://127.0.0.1:5173/examples/react-test/");
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/extension/popup/index.html`);
  await form.bringToFront();
  return { form, popup };
}

async function clickPopup(popup: Page, label: string): Promise<void> {
  await popup.getByRole("button", { name: label }).evaluate((button: HTMLButtonElement) => button.click());
}

test("Options → Scan → Matcher → Autofill updates controlled React state safely", async () => {
  const { context, extensionId } = await launchExtension();
  try {
    await saveProfile(context, extensionId);
    const { form, popup } = await openFixtureAndPopup(context, extensionId);
    await clickPopup(popup, "扫描当前页面");
    await expect(popup.getByRole("status")).toContainText("已确认");
    await clickPopup(popup, "填充已确认字段");
    await expect(popup.getByRole("status")).toContainText("填充完成");
    await expect(form.getByTestId("name-state")).toHaveText("示例姓名");
    await expect(form.getByTestId("email-state")).toHaveText("existing@example.test");
    await expect(form.getByTestId("school-state")).toHaveText("示例大学");
    await expect(form.getByTestId("degree-state")).toHaveText("硕士研究生");
    await expect(form.getByTestId("gender-state")).toHaveText("女");
    await expect(form.getByTestId("submit-count")).toHaveText("0");
  } finally { await context.close(); }
});

test("replacing a scanned control invalidates the scan session", async () => {
  const { context, extensionId } = await launchExtension();
  try {
    await saveProfile(context, extensionId);
    const { form, popup } = await openFixtureAndPopup(context, extensionId);
    await clickPopup(popup, "扫描当前页面");
    await expect(popup.getByRole("status")).toContainText("已确认");
    await form.getByRole("button", { name: "替换姓名字段" }).click();
    await clickPopup(popup, "填充已确认字段");
    await expect(form.getByTestId("name-state")).toHaveText("");
    await expect(form.getByTestId("submit-count")).toHaveText("0");
  } finally { await context.close(); }
});

test("Undo restores values only while they still equal the autofilled value", async () => {
  const { context, extensionId } = await launchExtension();
  try {
    await saveProfile(context, extensionId);
    const { form, popup } = await openFixtureAndPopup(context, extensionId);
    await clickPopup(popup, "扫描当前页面");
    await expect(popup.getByRole("status")).toContainText("已确认");
    await clickPopup(popup, "填充已确认字段");
    await expect(form.getByTestId("name-state")).toHaveText("示例姓名");
    await expect(popup.getByRole("status")).toContainText("填充完成");
    await clickPopup(popup, "撤销本次填充");
    await expect(popup.getByRole("status")).toContainText("撤销完成");
    await expect(form.getByTestId("name-state")).toHaveText("");
    await expect(form.getByTestId("school-state")).toHaveText("");
    await expect(form.getByTestId("degree-state")).toHaveText("");
    await expect(form.getByTestId("gender-state")).toHaveText("");
  } finally { await context.close(); }
});
