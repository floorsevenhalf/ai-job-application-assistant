import type { FieldRule } from "../matcher/types";

export const FIELD_RULES: FieldRule[] = [
  {
    id: "basic.full-name",
    profilePath: "basic.fullName",
    positiveTerms: ["姓名", "真实姓名", "中文姓名", "name", "full name", "fullname", "candidate name"],
    negativeTerms: ["紧急联系人", "联系人", "推荐人", "证明人", "supervisor", "recommender"],
    allowedKinds: ["text"]
  },
  {
    id: "basic.gender",
    profilePath: "basic.gender",
    positiveTerms: ["性别", "gender", "sex"],
    allowedKinds: ["radio", "select", "text"],
    optionAliases: [["男", "男性", "male", "m"], ["女", "女性", "female", "f"]]
  },
  {
    id: "basic.phone",
    profilePath: "basic.phone",
    positiveTerms: ["手机", "手机号", "手机号码", "联系电话", "mobile", "phone", "telephone"],
    negativeTerms: ["紧急联系人", "推荐人", "公司电话", "固定电话", "office phone"],
    allowedKinds: ["tel", "text", "number"]
  },
  {
    id: "basic.email",
    profilePath: "basic.email",
    positiveTerms: ["邮箱", "电子邮箱", "邮件地址", "email", "e-mail"],
    negativeTerms: ["推荐人", "紧急联系人", "公司邮箱"],
    allowedKinds: ["email", "text"]
  },
  {
    id: "basic.birth-date",
    profilePath: "basic.birthDate",
    positiveTerms: ["出生日期", "出生年月", "生日", "birth date", "birthday", "date of birth", "dob"],
    allowedKinds: ["date", "month", "text", "select"]
  },
  {
    id: "basic.current-city",
    profilePath: "basic.city",
    positiveTerms: ["所在城市", "当前城市", "居住城市", "居住地", "current city", "city of residence", "city"],
    negativeTerms: ["期望城市", "工作城市", "学校所在地", "户籍城市", "preferred city", "job city", "school location"],
    allowedKinds: ["text", "select"]
  },
  {
    id: "basic.region",
    profilePath: "basic.region",
    positiveTerms: ["所在地区", "现居地区", "居住地区", "省市区", "region", "province", "state region"],
    negativeTerms: ["学校所在地", "户籍所在地", "期望地区", "school location", "preferred region"],
    allowedKinds: ["text", "select"]
  },
  {
    id: "education.school",
    profilePath: "educations.primary.school",
    positiveTerms: ["学校", "院校", "毕业院校", "就读院校", "学校名称", "university", "college", "school"],
    negativeTerms: ["学校所在地", "学院", "院系", "department", "school location"],
    allowedKinds: ["text", "select"]
  },
  {
    id: "education.college",
    profilePath: "educations.primary.college",
    positiveTerms: ["学院", "院系", "系", "college", "department", "faculty"],
    negativeTerms: ["学校名称", "毕业院校", "就读院校", "university name", "school name"],
    allowedKinds: ["text", "select"]
  },
  {
    id: "education.degree",
    profilePath: "educations.primary.degree",
    positiveTerms: ["学历", "最高学历", "学位", "degree", "education level"],
    allowedKinds: ["text", "select", "radio"],
    optionAliases: [["本科", "学士", "bachelor"], ["硕士", "master"], ["博士", "phd", "doctor"]]
  },
  {
    id: "education.major",
    profilePath: "educations.primary.major",
    positiveTerms: ["专业", "所学专业", "专业名称", "major", "field of study"],
    allowedKinds: ["text", "select"]
  },
  {
    id: "education.start-date",
    profilePath: "educations.primary.startDate",
    positiveTerms: ["入学时间", "入学日期", "开始时间", "start date", "enrollment date"],
    negativeTerms: ["实习", "项目", "工作经历", "internship", "project", "work experience"],
    allowedKinds: ["date", "month", "text", "select"]
  },
  {
    id: "education.end-date",
    profilePath: "educations.primary.endDate",
    positiveTerms: ["毕业时间", "毕业日期", "预计毕业", "graduation date", "end date"],
    negativeTerms: ["实习", "项目", "工作经历", "internship", "project", "work experience"],
    allowedKinds: ["date", "month", "text", "select"]
  },
  {
    id: "job.directions",
    profilePath: "jobPreferences.directions",
    positiveTerms: ["求职方向", "意向岗位", "职位方向", "应聘职位", "job direction", "career direction", "desired position"],
    allowedKinds: ["text", "select", "checkbox"]
  },
  {
    id: "job.preferred-cities",
    profilePath: "jobPreferences.preferredCities",
    positiveTerms: ["期望城市", "工作城市", "期望工作地点", "意向城市", "preferred city", "job city", "work location", "city"],
    negativeTerms: ["所在城市", "当前城市", "居住城市", "学校所在地", "current city", "city of residence", "school location"],
    allowedKinds: ["text", "select", "checkbox"]
  }
];