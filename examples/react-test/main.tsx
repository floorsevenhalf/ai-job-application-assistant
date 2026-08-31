import { FormEvent, useState } from "react";
import { createRoot } from "react-dom/client";

function Fixture() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("existing@example.test");
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [gender, setGender] = useState("");
  const [revision, setRevision] = useState(0);
  const [submits, setSubmits] = useState(0);
  function submit(event: FormEvent) { event.preventDefault(); setSubmits(value => value + 1); }
  return <main><h1>React controlled form</h1><form onSubmit={submit}>
    <label htmlFor="full-name">姓名</label><input key={revision} id="full-name" name="fullName" value={name} onInput={event => setName(event.currentTarget.value)} onChange={event => setName(event.currentTarget.value)} />
    <label htmlFor="email">邮箱</label><input id="email" name="email" type="email" value={email} onChange={event => setEmail(event.currentTarget.value)} />
    <label htmlFor="school">毕业院校</label><input id="school" name="school" value={school} onChange={event => setSchool(event.currentTarget.value)} />
    <label htmlFor="degree">最高学历</label><select id="degree" name="degree" value={degree} onChange={event => setDegree(event.currentTarget.value)}><option value="">请选择</option><option value="本科">本科</option><option value="硕士研究生">硕士研究生</option><option value="博士">博士</option></select>
    <fieldset><legend>性别</legend><label><input type="radio" name="gender" value="男" checked={gender === "男"} onInput={event => setGender(event.currentTarget.checked ? event.currentTarget.value : "")} onChange={event => setGender(event.currentTarget.value)} />男</label><label><input type="radio" name="gender" value="女" checked={gender === "女"} onInput={event => setGender(event.currentTarget.checked ? event.currentTarget.value : "")} onChange={event => setGender(event.currentTarget.value)} />女</label></fieldset>
    <button type="submit">提交申请</button>
  </form><button type="button" onClick={() => setRevision(value => value + 1)}>替换姓名字段</button>
  <output data-testid="name-state">{name}</output><output data-testid="email-state">{email}</output><output data-testid="school-state">{school}</output><output data-testid="degree-state">{degree}</output><output data-testid="gender-state">{gender}</output><output data-testid="submit-count">{submits}</output>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);