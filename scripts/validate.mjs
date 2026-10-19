// 데이터 검증: 스키마·참조·검증 규칙·내부 문구·사진 라이선스·색 대비.
// 오류가 하나라도 있으면 종료 코드 1 (빌드 중단). 경고는 출력만 합니다.
import fs from "node:fs";
import path from "node:path";
import { loadData, APP_DIR } from "./lib/data.mjs";

const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
let D;
try { D = loadData(); } catch (e) { console.error("✗ " + e.message); process.exit(1); }

const isDate = (s) => typeof s === "string" && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(s) && (() => {
  const [y, m = "01", d = "01"] = s.split("-"); const t = new Date(`${y}-${m}-${d}T00:00:00Z`);
  return !isNaN(t) && t.getUTCMonth() + 1 === +m && t.getUTCDate() === +d;
})();
const VERIF = new Set(["verified", "unverified"]);
const REVIEW = new Set(["approved", "pending", "rejected", "legacy"]);
// 독자에게 보이면 안 되는 내부 작업 문구
const INTERNAL = [/조사 메모/, /검증 메모/, /1차 조사 종합/, /조사 인용/, /출시 검증 메모/, /분야별 경고자 조사/, /TODO/i, /FIXME/i];
const checkText = (where, s) => { if (typeof s !== "string") return; for (const r of INTERNAL) if (r.test(s)) err(`${where}: 내부 작업 문구 노출 (${r})`); };

// ---- sources ----
const srcIds = new Set();
const srcUrls = new Set();
for (const s of D.sources) {
  if (!s.id || srcIds.has(s.id)) err(`sources: id 누락/중복 ${s.id}`); srcIds.add(s.id);
  let u; try { u = new URL(s.url); } catch { err(`sources ${s.id}: URL 형식 오류 ${s.url}`); continue; }
  if (u.protocol !== "https:" && u.protocol !== "http:") err(`sources ${s.id}: http(s) URL이 아님`);
  if (u.protocol === "http:") warn(`sources ${s.id}: https가 아닌 URL ${s.url}`);
  if (u.hostname !== u.hostname.toLowerCase() || /\/\/[^/]*[A-Z]/.test(s.url)) err(`sources ${s.id}: 호스트에 대문자 ${s.url}`);
  if (srcUrls.has(s.url)) err(`sources: URL 중복 ${s.url}`); srcUrls.add(s.url);
  if (!s.publisher) err(`sources ${s.id}: publisher 누락`);
  if (!["primary", "secondary"].includes(s.kind)) err(`sources ${s.id}: kind는 primary|secondary`);
  if (/memo|메모/i.test(s.publisher + (s.title || ""))) err(`sources ${s.id}: 내부 메모는 출처로 쓸 수 없음`);
}
const used = new Set();
function checkSources(where, ids, verification) {
  if (!Array.isArray(ids)) { err(`${where}: source_ids 배열 필요`); return; }
  for (const id of ids) { if (!srcIds.has(id)) err(`${where}: 없는 출처 ${id}`); used.add(id); }
  if (!VERIF.has(verification)) err(`${where}: verification은 verified|unverified`);
  // 핵심 규칙: 검증됨이면 출처 URL이 1개 이상
  if (verification === "verified" && ids.length === 0) err(`${where}: '검증됨'인데 출처 URL이 없음`);
  if (verification === "verified") {
    const kinds = ids.map(id => D.sources.find(s => s.id === id)?.kind);
    const pubs = new Set(ids.map(id => D.sources.find(s => s.id === id)?.publisher));
    if (!kinds.includes("primary") && pubs.size < 2) warn(`${where}: 1차 자료가 없고 독립 2차 출처가 2개 미만`);
  }
}
const checkReview = (where, r) => { if (!r || !REVIEW.has(r.state)) err(`${where}: review.state 누락/오류`); };

// ---- camps ----
const campIds = new Set(D.camps.map(c => c.id));
for (const c of D.camps) for (const k of ["id", "label", "short", "badge", "color"]) if (!c[k]) err(`camps ${c.id}: ${k} 누락`);

// ---- people ----
const pIds = new Set();
for (const p of D.people) {
  const w = `people ${p.id}`;
  if (!/^[a-z0-9-]+$/.test(p.id || "")) err(`${w}: id 형식`); if (pIds.has(p.id)) err(`${w}: id 중복`); pIds.add(p.id);
  for (const k of ["ko", "en", "short", "role", "stance", "moment"]) { if (!p[k]) err(`${w}: ${k} 누락`); checkText(`${w}.${k}`, p[k]); }
  if (!campIds.has(p.camp)) err(`${w}: 알 수 없는 진영 ${p.camp}`);
  checkSources(w, p.source_ids, p.verification);
  if (p.verification === "unverified" && !p.unverified_note) err(`${w}: 미확인 사유(unverified_note) 필요`);
  if (p.verification === "verified" && p.unverified_note) warn(`${w}: 검증됨인데 unverified_note가 남아 있음`);
  checkText(`${w}.unverified_note`, p.unverified_note);
  checkReview(w, p.review);
  if (p.portrait) {
    const f = path.join(APP_DIR, p.portrait.path);
    if (!fs.existsSync(f)) err(`${w}: 사진 파일 없음 ${p.portrait.path}`);
    if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.portrait.commons_url || "")) err(`${w}: 사진은 Wikimedia Commons 원본 링크 필요`);
    if (!/^(CC BY(-SA)? \d\.\d|CC0|Public domain)$/.test(p.portrait.license || "")) err(`${w}: 자유 라이선스가 아님 (${p.portrait.license})`);
    if (!p.portrait.author) err(`${w}: 사진 작성자 누락`);
  }
}
// ---- events ----
const eIds = new Set();
let prev = "";
for (const e of D.events) {
  const w = `events ${e.id}`;
  if (!/^\d{4}(-\d{2})?(-\d{2})?-[a-z0-9-]+$/.test(e.id || "")) err(`${w}: id 형식(날짜-슬러그)`); if (eIds.has(e.id)) err(`${w}: id 중복`); eIds.add(e.id);
  if (!isDate(e.date_start)) err(`${w}: date_start가 유효한 날짜(YYYY, YYYY-MM, YYYY-MM-DD)가 아님`);
  if (e.date_end != null && (!isDate(e.date_end) || e.date_end < e.date_start)) err(`${w}: date_end 오류`);
  if (!e.date_label) err(`${w}: date_label 누락`);
  if (e.date_start < prev.slice(0, e.date_start.length)) warn(`${w}: 연표 순서가 날짜순이 아님`);
  prev = e.date_start;
  for (const k of ["title", "summary", "background", "confirmed"]) { if (!e[k]) err(`${w}: ${k} 누락`); checkText(`${w}.${k}`, e[k]); }
  checkText(`${w}.unknown`, e.unknown);
  if (!campIds.has(e.camp)) err(`${w}: 알 수 없는 진영 ${e.camp}`);
  for (const pid of e.people_ids || []) if (!pIds.has(pid)) err(`${w}: 없는 인물 ${pid}`);
  checkSources(w, e.source_ids, e.verification);
  if (e.verification === "unverified" && !e.unknown) err(`${w}: 미확인 사건은 미확인 사항(unknown)을 적어야 함`);
  checkReview(w, e.review);
}
// ---- lineage ----
const L = D.lineage;
const laneIds = new Set(L.lanes.map(l => l.id));
const nIds = new Map();
for (const l of L.lanes) if (!l.title || typeof l.order !== "number") err(`lineage lane ${l.id}: title/order 필요`);
for (const n of L.nodes) {
  const w = `lineage node ${n.id}`;
  if (nIds.has(n.id)) err(`${w}: id 중복`); nIds.set(n.id, n);
  if (!laneIds.has(n.lane)) err(`${w}: 없는 lane ${n.lane}`);
  if (n.person_id && !pIds.has(n.person_id)) err(`${w}: 없는 인물 ${n.person_id}`);
  if (!n.person_id && !campIds.has(n.camp)) err(`${w}: 인물이 아닌 노드는 camp 필요`);
  if (!n.label) err(`${w}: label 필요`);
}
for (const l of L.lanes) {
  const orders = L.nodes.filter(n => n.lane === l.id).map(n => n.order).sort((a, b) => a - b);
  if (new Set(orders).size !== orders.length) err(`lineage lane ${l.id}: 노드 order 중복`);
}
const eKeys = new Set();
for (const e of L.edges) {
  const w = `lineage edge ${e.id}`;
  const a = nIds.get(e.from), b = nIds.get(e.to);
  if (!a || !b) { err(`${w}: from/to 노드 없음`); continue; }
  if (e.from === e.to) err(`${w}: 자기 자신으로 가는 선`);
  if (a.lane !== b.lane) err(`${w}: 서로 다른 줄의 노드를 잇는 선은 지원하지 않음`);
  else if (Math.abs(a.order - b.order) !== 1) warn(`${w}: 이웃하지 않은 노드 연결(곡선으로 그림)`);
  if (!["flow", "opposition", "agreement"].includes(e.type)) err(`${w}: type은 flow|opposition|agreement`);
  const key = [e.from, e.to].sort().join("|"); if (eKeys.has(key)) err(`${w}: 같은 두 노드 사이에 선이 둘 이상`); eKeys.add(key);
  if (!e.note) err(`${w}: 근거 설명(note) 필요`); checkText(`${w}.note`, e.note);
  checkSources(w, e.source_ids, e.verification);
  checkReview(w, e.review);
}
// ---- changelog ----
const cIds = new Set();
for (const c of D.changelog) {
  const w = `changelog ${c.id}`;
  if (cIds.has(c.id)) err(`${w}: id 중복`); cIds.add(c.id);
  if (!c.headline || !Array.isArray(c.items) || !c.items.length) err(`${w}: headline/items 필요`);
  checkReview(w, c.review);
  for (const it of c.items || []) { checkText(w, it.title); checkText(w, it.text); for (const s of it.source_ids || []) { if (!srcIds.has(s)) err(`${w}: 없는 출처 ${s}`); used.add(s); } }
}
// ---- domain groups ----
for (const g of D.domainGroups) {
  const members = D.people.filter(p => p.camp === "domain" && g.fields.includes(p.field));
  if (!members.length) err(`domain-groups ${g.id}: 해당 분야 인물이 없음`);
}
const grouped = new Set(D.domainGroups.flatMap(g => g.fields));
for (const p of D.people.filter(p => p.camp === "domain")) if (!grouped.has(p.field)) warn(`people ${p.id}: 분야(${p.field})가 어떤 분야 그룹에도 속하지 않음`);
// ---- meta ----
if (!isDate(D.meta.data_as_of) || D.meta.data_as_of.length !== 10) err("meta.data_as_of는 YYYY-MM-DD");
for (const id of D.meta.footer_source_ids || []) { if (!srcIds.has(id)) err(`meta.footer_source_ids: 없는 출처 ${id}`); used.add(id); }
for (const [k, v] of Object.entries(D.meta.sections || {})) checkText(`meta.sections.${k}`, v);
for (const s of D.sources) if (!used.has(s.id)) warn(`sources ${s.id}: 어디에서도 쓰이지 않음`);

// ---- 색 대비 (보조 텍스트 4.5:1 이상) ----
const css = fs.readFileSync(path.join(APP_DIR, "src/styles.css"), "utf8");
const block = (re) => Object.fromEntries([...(css.match(re)?.[1] || "").matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1], m[2]]));
const light = block(/:root\s*\{([^}]*)\}/), dark = { ...light, ...block(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/) };
const lum = (h) => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAIRS = [
  ["--muted", "--bg"], ["--muted", "--surface"], ["--muted", "--surface-2"], ["--faint", "--bg"], ["--faint", "--surface"], ["--faint", "--surface-2"],
  ["--muted", "--optimist-soft"], ["--muted", "--safety-soft"], ["--muted", "--middle-soft"], ["--muted", "--korea-soft"],
  ["--optimist", "--optimist-soft"], ["--safety-text", "--safety-soft"], ["--middle", "--middle-soft"], ["--korea", "--korea-soft"], ["--domain", "--domain-soft"], ["--warn", "--warn-soft"],
  ["--optimist", "--bg"], ["--safety-text", "--bg"], ["--middle", "--bg"], ["--domain", "--bg"], ["--korea", "--surface"], ["--domain", "--surface"]
];
const contrast = [];
for (const [mode, t] of [["light", light], ["dark", dark]]) for (const [fg, bg] of PAIRS) {
  if (!t[fg] || !t[bg]) { err(`색 대비: ${mode} ${fg}/${bg} 변수 없음`); continue; }
  const r = ratio(t[fg], t[bg]); contrast.push([mode, fg, bg, r]);
  if (r < 4.5) err(`색 대비 부족: ${mode} ${fg}(${t[fg]}) / ${bg}(${t[bg]}) = ${r.toFixed(2)}:1 (< 4.5)`);
}

// ---- 결과 ----
for (const w of warnings) console.warn("⚠ " + w);
if (errors.length) { for (const e of errors) console.error("✗ " + e); console.error(`\n검증 실패: 오류 ${errors.length}건, 경고 ${warnings.length}건`); process.exit(1); }
const minC = Math.min(...contrast.map(c => c[3]));
console.log(`✓ 검증 통과 — 인물 ${D.people.length} · 사건 ${D.events.length} · 계보 노드 ${L.nodes.length}/관계선 ${L.edges.length} · 출처 ${D.sources.length} · 경고 ${warnings.length}건 · 최소 대비 ${minC.toFixed(2)}:1`);
