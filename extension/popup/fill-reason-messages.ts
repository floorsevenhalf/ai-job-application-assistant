const FILL_REASON_MESSAGES: Record<string, string> = {
  existing_value: "网页中已有内容，已跳过",
  field_not_found: "页面字段已不存在，请重新扫描",
  stale_scan_session: "页面已发生变化，请重新扫描",
  no_matching_option: "未找到可靠的下拉选项",
  value_not_persisted: "网页未保留填写结果",
  value_reverted_after_fill: "网页重新渲染后覆盖了填写结果",
  value_changed_after_fill: "字段已被手动修改，未撤销",
  element_not_in_document: "页面字段已被替换，请重新扫描",
  "read-only": "字段为只读，已跳过",
  disabled: "字段不可用，已跳过",
  "not-visible": "字段当前不可见，已跳过",
  checkbox_without_boolean_profile_mapping: "当前资料没有安全的布尔字段映射",
  unsafe_date_conversion: "日期格式无法安全转换",
  empty_profile_value: "个人资料中尚未填写该值"
};

export function fillReasonMessage(reason?: string): string {
  if (!reason) return "";
  return FILL_REASON_MESSAGES[reason] ?? `未完成：${reason}`;
}