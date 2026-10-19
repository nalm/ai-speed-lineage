// 빌드 결과 검사: 숫자 일관성, 팩트체크 정정 반영표(수정 필요 → 반영 위치), 내부 문구·잘못된 datetime 부재.
// 결과: ../preview/correction-checklist.md, ../preview/verify-report.json  (실패 시 종료 코드 1)
import fs from "node:fs";
import path from "node:path";
import { loadData, computeStats, APP_DIR, DIST_DIR } from "./lib/data.mjs";
import { CORRECTIONS } from "../tools/corrections-2026-10-19.mjs";

const OUT = path.resolve(APP_DIR, "../preview");
fs.mkdirSync(OUT, { recursive: true });
const D = loadData();
const S = computeStats(D);
const html = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");
const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const problems = [];

// 1) 숫자: HTML에 보이는 값 = 데이터에서 계산한 값
const stat = [...html.matchAll(/<div class="stat">.*?<strong>(\d+)<\/strong><span>(.*?)<\/span>/g)].map(m => [m[2], +m[1]]);
const want = { "인물": S.people, "관점": S.perspectives, "주요 사건": S.events };
for (const [k, v] of stat) if (want[k] !== v) problems.push(`히어로 통계 ${k}=${v}, 데이터=${want[k]}`);
if (stat.length !== 3) problems.push("히어로 통계 3개를 찾지 못함");
const count = (re) => (html.match(re) || []).length;
const cardCount = count(/<article class="person"/g), eventCount = count(/<li class="(opt|safe|mid|domain)" id="event-/g);
if (cardCount !== S.people) problems.push(`인물 카드 ${cardCount} ≠ ${S.people}`);
if (eventCount !== S.events) problems.push(`연표 ${eventCount} ≠ ${S.events}`);
if (!html.includes(`<h2 id="people-title">인물 ${S.people}명</h2>`)) problems.push("인물 섹션 제목 숫자 불일치");
for (const c of D.camps) if (!html.includes(`data-filter="${c.id}" aria-pressed="false">${c.short} ${S.byCamp[c.id]}</button>`)) problems.push(`필터 숫자 불일치: ${c.id}`);
if (count(/class="edge (flow|opposition|agreement)/g) !== S.edges) problems.push("계보 관계선 수 불일치");
if (count(/<rect class="node /g) !== S.nodes) problems.push("계보 노드 수 불일치");
if (!html.includes(`데이터 기준일 ${D.meta.data_as_of}`)) problems.push("기준일 표시 없음");

// 2) datetime 속성 형식
const bad = [...html.matchAll(/datetime="([^"]*)"/g)].map(m => m[1]).filter(v => !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(v));
if (bad.length) problems.push("잘못된 datetime: " + bad.join(", "));
// 3) 내부 작업 문구
for (const w of ["조사 메모", "검증 메모", "1차 조사 종합", "조사 인용", "분야별 경고자 조사"]) if (text.includes(w)) problems.push(`내부 문구 노출: ${w}`);
// 4) 점선(대립)에 화살촉 없음: CSS 규칙 확인
const css = fs.readFileSync(path.join(DIST_DIR, "assets/styles.css"), "utf8");
if (!/\.edge\.opposition path \{[^}]*stroke-dasharray[^}]*marker: none/.test(css)) problems.push("대립선 CSS에 화살촉 제거 규칙 없음");
// 5) 검증됨 ⇒ 출처 1개 이상 (빌드 결과 기준)
for (const p of D.people) if (p.verification === "verified" && !p.source_ids.length) problems.push(`검증됨인데 출처 없음: ${p.id}`);
for (const e of D.events) if (e.verification === "verified" && !e.source_ids.length) problems.push(`검증됨인데 출처 없음: ${e.id}`);

// 6) 정정 반영표
const where = (needle) => {
  const hits = [];
  const walk = (file, arr, idKey = "id") => arr.forEach(o => Object.entries(o).forEach(([k, v]) => { if (typeof v === "string" && v.includes(needle)) hits.push(`${file}#${o[idKey] ?? o.title}.${k}`); }));
  walk("people.json", D.people); walk("events.json", D.events); walk("lineage.json", D.lineage.edges);
  D.changelog.forEach(c => walk(`changelog.json#${c.id}`, c.items, "title"));
  return hits;
};
const rows = CORRECTIONS.map(c => {
  const fails = [];
  for (const s of c.expect.include || []) if (!text.includes(s)) fails.push(`없음: “${s}”`);
  for (const s of c.expect.exclude || []) if (text.includes(s)) fails.push(`남아 있음: “${s}”`);
  for (const s of c.expectRaw?.include || []) if (!html.includes(s)) fails.push(`HTML에 없음: ${s}`);
  for (const s of c.expectRaw?.exclude || []) if (html.includes(s)) fails.push(`HTML에 남아 있음: ${s}`);
  if (c.expect.data && !c.expect.data(D)) fails.push("데이터 조건 불충족");
  const loc = [...new Set((c.expect.include || []).flatMap(where))];
  return { id: c.id, where: c.where, summary: c.summary, applied: fails.length === 0, located_in: loc, fails };
});
const fc = JSON.parse(fs.readFileSync(path.resolve(APP_DIR, "../factcheck/factcheck.json"), "utf8"));
const needed = fc.records.filter(r => r.status === "수정 필요").map(r => r.id);
const missing = needed.filter(id => !rows.some(r => r.id === id));
if (missing.length) problems.push("정정표에 없는 '수정 필요' 항목: " + missing.join(", "));
const unv = fc.records.filter(r => r.status === "확인 불가").map(r => r.id);
const unvRows = unv.map(id => {
  const p = D.people.find(x => x.factcheck_ids.includes(id)), e = D.lineage.edges.find(x => x.factcheck_ids.includes(id));
  const o = p || e;
  // 이후 회차에서 출처를 확보해 nalm이 승인한 경우(review.state=approved, 출처 1개 이상)는 '해소'로 인정
  const resolved = o.verification === "verified" && o.review?.state === "approved" && (o.source_ids || []).length > 0;
  return { id, target: p ? `people.json#${p.id}` : `lineage.json#${e.id}`, verification: o.verification, resolved, resolved_at: resolved ? o.review.at : null, ok: o.verification === "unverified" || resolved };
});
for (const r of unvRows) if (!r.ok) problems.push(`확인 불가 ${r.id}가 미확인으로 표시되지 않음(또는 승인·출처 없이 검증됨으로 바뀜)`);
const applied = rows.filter(r => r.applied).length;
if (applied !== rows.length) problems.push(`정정 미반영 ${rows.length - applied}건`);

const md = [
  `# 팩트체크 정정 반영표 (2026-10-19 재검증)`, ``,
  `- 빌드: \`app/dist/index.html\` · 데이터 기준일 ${D.meta.data_as_of}`,
  `- '수정 필요' ${needed.length}건 중 **${applied}건 반영 확인** (검사: 빌드된 HTML에 정정 문구가 있고 틀린 문구가 없는지 + 데이터 조건)`,
  `- '확인 불가' ${unv.length}건: ${unvRows.map(r => `${r.id} → ${r.target} = ${r.verification === "unverified" ? "미확인" : r.resolved ? `검증됨(${r.resolved_at} 승인으로 해소)` : r.verification}`).join(" / ")}`, ``,
  `| ID | 반영 | 반영 위치 | 정정 내용 | 데이터상 위치(자동 탐지) |`, `|---|---|---|---|---|`,
  ...rows.map(r => `| ${r.id} | ${r.applied ? "✅" : "❌ " + r.fails.join("; ")} | ${r.where} | ${r.summary.replace(/\|/g, "/")} | ${r.located_in.join("<br>") || "(삭제·구조 변경 — 데이터 조건으로 검사)"} |`),
  ``, `## 빌드 결과 수치`, ``,
  `- 인물 ${S.people}명 (낙관 ${S.byCamp.optimist} · 안전 ${S.byCamp.safety} · 중간 ${S.byCamp.middle} · 분야별 ${S.byCamp.domain} · 한국 태그 ${S.korea}) · 미확인 인물 ${S.peopleUnverified}`,
  `- 관점 ${S.perspectives} · 사건 ${S.events} (검증됨 ${S.eventsVerified} · 미확인 ${S.eventsUnverified})`,
  `- 계보 ${S.lanes}갈래 · 노드 ${S.nodes} · 관계선 ${S.edges} (흐름 ${S.edgeTypes.flow} · 대립 ${S.edgeTypes.opposition} · 인용·입장 일치 ${S.edgeTypes.agreement}, 그중 미확인 ${S.edgesUnverified})`,
  `- 출처 ${S.sources}건 · 사진 ${S.portraits}건`, ``,
  `## 기타 검사`, ``, problems.length ? problems.map(p => `- ❌ ${p}`).join("\n") : "- ✅ 숫자 일관성, datetime 형식, 내부 문구 부재, 대립선 화살촉 제거, 검증됨⇒출처 규칙 모두 통과"
].join("\n");
fs.writeFileSync(path.join(OUT, "correction-checklist.md"), md + "\n");
fs.writeFileSync(path.join(OUT, "verify-report.json"), JSON.stringify({ stats: S, corrections: rows, unverifiable: unvRows, problems }, null, 2));
console.log(md);
if (problems.length) process.exit(1);
