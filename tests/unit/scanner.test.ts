import { beforeEach, describe, expect, it } from "vitest";
import { scanDocument } from "../../extension/core/scanner/scan-form";

function setBody(html: string) { document.body.innerHTML = html; }

describe("DOM Scanner", () => {
  beforeEach(() => setBody(""));

  it("extracts label for and placeholder", () => {
    setBody('<label for="name">姓名</label><input id="name" name="fullName" placeholder="请输入姓名">');
    const [field] = scanDocument().fields;
    expect(field.context.labelTexts).toContain("姓名");
    expect(field.attributes.placeholder).toBe("请输入姓名");
  });

  it("extracts aria-label and aria-labelledby text", () => {
    setBody('<span id="email-label">联系邮箱</span><input name="email" aria-label="常用邮箱" aria-labelledby="email-label">');
    const [field] = scanDocument().fields;
    expect(field.attributes.ariaLabel).toBe("常用邮箱");
    expect(field.context.ariaLabelledByTexts).toEqual(["联系邮箱"]);
  });

  it("extracts select options", () => {
    setBody('<label>学历<select name="degree"><option value="b">本科</option><option value="m" disabled selected>硕士</option></select></label>');
    const [field] = scanDocument().fields;
    expect(field.kind).toBe("select");
    expect(field.options).toEqual([
      { value: "b", label: "本科", disabled: false, selected: false },
      { value: "m", label: "硕士", disabled: true, selected: true }
    ]);
  });

  it("returns one descriptor for a radio group", () => {
    setBody('<fieldset><legend>性别</legend><label><input type="radio" name="gender" value="male">男</label><label><input type="radio" name="gender" value="female" checked>女</label></fieldset>');
    const fields = scanDocument().fields;
    expect(fields).toHaveLength(1);
    expect(fields[0].group).toMatchObject({ type: "radio", name: "gender", memberCount: 2, scopeType: "fieldset" });
    expect(fields[0].group?.scopeIdentity).toContain("fieldset");
    expect(fields[0].context.legendText).toBe("性别");
    expect(fields[0].options.map(option => option.label)).toEqual(["男", "女"]);
    expect(fields[0].state.currentValue).toBe("female");
  });

  it("excludes hidden, password, submit, disabled and readOnly controls", () => {
    setBody('<input name="ok"><input type="hidden" name="hidden"><input type="password" name="password"><input type="submit"><input name="disabled" disabled><input name="readonly" readonly><input name="invisible" style="display:none">');
    expect(scanDocument().fields.map(field => field.attributes.name)).toEqual(["ok"]);
  });

  it("excludes captcha and privacy consent controls", () => {
    setBody('<label>验证码<input name="captcha"></label><label><input type="checkbox" name="consent">同意隐私授权</label><label>专业<input name="major"></label>');
    expect(scanDocument().fields.map(field => field.attributes.name)).toEqual(["major"]);
  });

  it("keeps nearby text local and bounded", () => {
    setBody(`<p>${"无关页面说明".repeat(100)}</p><form><div class="field"><label for="school">毕业院校</label><input id="school"></div><div class="field">另一字段<input name="other"></div></form>`);
    const [school] = scanDocument().fields;
    const nearby = school.context.nearbyText.join(" ");
    expect(nearby).toContain("毕业院校");
    expect(nearby).not.toContain("无关页面说明");
    expect(nearby.length).toBeLessThanOrEqual(400);
  });

  it("creates unique serializable ids and a separate element map", () => {
    setBody('<input name="one"><textarea name="two"></textarea>');
    const result = scanDocument();
    expect(new Set(result.fields.map(field => field.fieldId)).size).toBe(2);
    expect(result.elementMap.size).toBe(2);
    expect(() => JSON.stringify(result.fields)).not.toThrow();
    expect(JSON.stringify(result.fields)).not.toContain("HTMLInputElement");
  });
});