export interface ValueAliasGroup {
  canonical: string;
  aliases: string[];
}

export const VALUE_ALIAS_GROUPS: ValueAliasGroup[] = [
  { canonical: "male", aliases: ["male", "男", "男性", "m"] },
  { canonical: "female", aliases: ["female", "女", "女性", "f"] },
  { canonical: "other", aliases: ["other", "其他", "其它"] },
  { canonical: "bachelor", aliases: ["本科", "学士", "bachelor", "bachelor's", "undergraduate"] },
  { canonical: "master", aliases: ["硕士", "硕士研究生", "master", "master's", "postgraduate"] },
  { canonical: "phd", aliases: ["博士", "博士研究生", "phd", "doctorate", "doctoral"] }
];