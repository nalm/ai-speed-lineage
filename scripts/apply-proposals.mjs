// 매일 수집된 제안 파일(proposals/YYYY-MM-DD.json) 중 nalm이 승인한 항목만 data/*.json 에 병합합니다.
// 사용: npm run proposals:apply -- proposals/2026-10-20.json [--dry-run]
// - review.state === "approved" 인 항목만 반영. pending은 그대로 두고, rejected는 proposals/rejected.json 에 기록.
// - 새로 추가되는 인물·사건·관계선은 verification을 명시하지 않으면 기본값 "unverified"(미확인).
// - 반영 후 validate 를 실행해 규칙(검증됨 ⇒ 출처 URL 등)을 어기면 아무 파일도 쓰지 않습니다.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { DATA_DIR, APP_DIR } from "./lib/data.mjs";

const [file, ...flags] = process.argv.slice(2);
if (!file) { console.error("사용법: npm run proposals:apply -- proposals/YYYY-MM-DD.json [--dry-run]"); process.exit(2); }
const dry = flags.includes("--dry-run");
const prop = JSON.parse(fs.readFileSync(path.resolve(APP_DIR, file), "utf8"));
const TARGETS = { people: "people.json", events: "events.json", sources: "sources.json", "lineage.edges": "lineage.json", "lineage.nodes": "lineage.json" };
const data = {};
const load = (f) => (data[f] ??= JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8")));
const list = (target) => { const d = load(TARGETS[target]); return target.startsWith("lineage.") ? d[target.split(".")[1]] : d; };

const applied = [], skipped = [], rejected = [];
for (const it of prop.items || []) {
  const state = it.review?.state;
  if (state === "rejected") { rejected.push(it); continue; }
  if (state !== "approved") { skipped.push(it.id); continue; }
  if (!TARGETS[it.target]) throw new Error(`알 수 없는 target: ${it.target}`);
  const arr = list(it.target);
  const review = { state: "approved", by: it.review.by || "nalm", at: it.review.at || new Date().toISOString().slice(0, 10) };
  if (it.op === "add") {
    if (arr.some(x => x.id === it.after.id)) throw new Error(`${it.id}: 이미 있는 id ${it.after.id}`);
    const obj = { ...it.after, review };
    if (it.target !== "sources" && it.target !== "lineage.nodes") obj.verification ??= "unverified";
    if (it.source_ids && "source_ids" in obj === false) obj.source_ids = it.source_ids;
    arr.push(obj);
  } else if (it.op === "update") {
    const obj = arr.find(x => x.id === it.target_id);
    if (!obj) throw new Error(`${it.id}: 대상 없음 ${it.target_id}`);
    for (const [k, v] of Object.entries(it.before || {})) if (JSON.stringify(obj[k]) !== JSON.stringify(v)) throw new Error(`${it.id}: ${k}의 현재 값이 제안의 before와 다릅니다(다른 변경과 충돌)`);
    Object.assign(obj, it.after, { review });
    if (it.source_ids) obj.source_ids = [...new Set([...(obj.source_ids || []), ...it.source_ids])];
  } else throw new Error(`${it.id}: op는 add|update`);
  applied.push(it.id);
}
console.log(`승인 반영 ${applied.length}건 · 대기 ${skipped.length}건 · 거절 ${rejected.length}건`);
if (dry || !applied.length) { console.log(dry ? "(--dry-run: 파일을 쓰지 않았습니다)" : "반영할 승인 항목이 없습니다."); process.exit(0); }

// 임시 디렉터리에 써서 검증 → 통과하면 실제 data/ 에 반영
const tmp = fs.mkdtempSync(path.join(APP_DIR, ".tmp-data-"));
try {
  for (const f of fs.readdirSync(DATA_DIR)) fs.copyFileSync(path.join(DATA_DIR, f), path.join(tmp, f));
  for (const [f, d] of Object.entries(data)) fs.writeFileSync(path.join(tmp, f), JSON.stringify(d, null, 2) + "\n");
  execFileSync(process.execPath, [path.join(APP_DIR, "scripts/validate.mjs")], { stdio: "inherit", env: { ...process.env, DATA_DIR_OVERRIDE: tmp } });
  for (const [f, d] of Object.entries(data)) fs.writeFileSync(path.join(DATA_DIR, f), JSON.stringify(d, null, 2) + "\n");
  if (rejected.length) {
    const rp = path.join(APP_DIR, "proposals/rejected.json");
    const prev = fs.existsSync(rp) ? JSON.parse(fs.readFileSync(rp, "utf8")) : [];
    fs.writeFileSync(rp, JSON.stringify([...prev, ...rejected.map(r => ({ ...r, from: path.basename(file) }))], null, 2) + "\n");
  }
  console.log("✓ data/ 에 반영했습니다. 변경 기록(changelog.json)에 이번 회차 요약을 추가하고 npm run build 로 확인하세요.");
} catch (e) {
  console.error("✗ 검증 실패 — data/ 는 바뀌지 않았습니다."); process.exitCode = 1;
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
