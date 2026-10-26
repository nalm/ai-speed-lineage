// 1회용 이전 스크립트: original/ 의 단일 HTML 데이터 + factcheck.json → app/data/*.json
// 실행: node tools/migrate-from-original.mjs   (이후 data/*.json 이 원본이 되며, 이 스크립트는 감사 기록용으로 남깁니다)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { PUBLISHERS, PRIMARY_HOSTS } from "./publishers.mjs";
import { CORRECTIONS } from "./corrections-2026-10-19.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(here, "..");
const ROOT = path.resolve(APP, "..");
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "original/page-data.raw.json"), "utf8"));
const ext = JSON.parse(fs.readFileSync(path.join(ROOT, "original/extracted.json"), "utf8"));
const fc = JSON.parse(fs.readFileSync(path.join(ROOT, "factcheck/factcheck.json"), "utf8"));
const FC = Object.fromEntries(fc.records.map(r => [r.id, r]));
const AS_OF = "2026-10-19";
const PENDING = { state: "pending", by: "nalm", at: null };

// ---------- sources ----------
const sources = new Map();
function normalizeUrl(u) { const x = new URL(u.trim()); x.hostname = x.hostname.toLowerCase(); return x.toString(); }
function src(u, extra = {}) {
  const url = normalizeUrl(u);
  if (sources.has(url)) { Object.assign(sources.get(url), extra); return sources.get(url).id; }
  const host = new URL(url).hostname;
  const id = "src-" + host.replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + "-" + crypto.createHash("sha1").update(url).digest("hex").slice(0, 6);
  sources.set(url, { id, url, publisher: PUBLISHERS[host] || host.replace(/^www\./, ""), title: null, kind: PRIMARY_HOSTS.has(host) ? "primary" : "secondary", accessed_at: AS_OF, checked_in: "factcheck-2026-10-19", ...extra });
  return id;
}
// 공개 앱 출처로 부적합하다고 팩트체크가 밝힌 URL(저작권 문제 소지가 있는 사본)
const EXCLUDE_URLS = new Set(["https://ia800501.us.archive.org/5/items/superintelligence-paths-dangers-strategies-by-nick-bostrom/superintelligence-paths-dangers-strategies-by-nick-bostrom.pdf"]);
const fcSources = (id) => (FC[id]?.sources || []).filter(u => !EXCLUDE_URLS.has(u) && !u.startsWith("https://commons.wikimedia.org") && !u.startsWith("https://www.flickr.com")).map(u => src(u));

// ---------- camps ----------
const camps = [
  { id: "optimist", label: "기술 낙관·가속", short: "낙관", badge: "opt", color: "--optimist", description: "개발·배포·개방을 우선하는 입장" },
  { id: "safety", label: "안전·속도조절", short: "안전", badge: "safe", color: "--safety", description: "존재위험·감속·강한 감독을 강조하는 입장" },
  { id: "middle", label: "중간·스탠스 변화", short: "중간", badge: "mid", color: "--middle", description: "양쪽 논리를 병행하거나 최근 스탠스 변화가 큰 경우" },
  { id: "domain", label: "분야별 경고자", short: "분야별", badge: "domain", color: "--domain", description: "AI 개발을 본업으로 삼지 않고 자기 전문분야에서 사회적 영향을 경고한 인물" }
];
const CAMP_SHORT = { opt: "optimist", safe: "safety", mid: "middle" };

// ---------- people ----------
const slug = (s) => s.split("·")[0].trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SHORT_OVERRIDE = { "교황 레오 14세": "교황 레오 14세", "앤드류 응": "앤드류 응", "젠슨 황": "젠슨 황", "암바 칵": "암바 칵", "페이페이 리": "페이페이 리", "김대식": "김대식", "하정우": "하정우" };
const PHOTO = Object.fromEntries(ext.people_section.people.filter(p => p.photo).map(p => [p.en, p.photo]));
const people = raw.DATA.people.map((p, i) => {
  const fcId = "P" + String(i + 1).padStart(2, "0");
  const toks = p.ko.split(" ");
  const ph = PHOTO[p.en];
  const o = {
    id: slug(p.en), ko: p.ko, en: p.en.split("·")[0].trim(), short: SHORT_OVERRIDE[p.ko] || toks[toks.length - 1],
    aliases: p.en.includes("·") ? p.en.split("·").slice(1).map(s => s.trim()) : [],
    camp: p.camp, field: p.field || null, country: p.country || null,
    role: p.role, stance: p.stance, moment: p.moment,
    portrait: ph ? { path: ph.local_path, author: ph.author, license: ph.license, crop: ph.crop, commons_url: ph.commons_url } : null,
    verification: p.uncertain ? "unverified" : "verified",
    source_ids: fcSources(fcId), factcheck_ids: [fcId], review: { ...PENDING }
  };
  if (FC[fcId].item !== p.ko && !p.ko.includes(FC[fcId].item.split(" ")[0])) throw new Error("factcheck id mismatch " + fcId + " " + p.ko + " " + FC[fcId].item);
  return o;
});
const personByFc = Object.fromEntries(people.map(p => [p.factcheck_ids[0], p]));

// ---------- events ----------
const EVENT_IDS = ["2014-superintelligence","2023-03-pause-letter","2024-06-ssi-founded","2025-10-karpathy-agents","2026-02-pro-worker-ai","2026-05-19-karpathy-anthropic","2026-05-25-magnifica-humanitas","2026-06-18-medicare-access","2026-07-hugging-face-swarm","2026-07-13-we-must-act-now","2026-08-anthropic-bio-filter","2026-09-claude-percolation","2026-09-openai-training-pause","2026-09-09-christiano-board","2026-09-11-fields-medalists","2026-09-12-pace-the-frontier","2026-09-13-ceo-split","2026-09-15-ressa-oslo","2026-09-17-huang-cbs","2026-09-17-ng-bloomberg","2026-09-23-un-security-council","2026-09-28-casp-paper","2026-09-29-s5576","2026-09-gpt-6","2026-10-02-robinson-resigns","2026-10-05-harari-london","2026-10-05-nyc-council-hearing","2026-10-06-openai-math","2026-10-06-math-backlash","2026-10-07-cantwell-framework","2026-10-08-italy-decree-179","2026-10-08-safety-two-actions","2026-10-09-tao-math-2","2026-10-11-gates-abc","2026-10-12-brad-smith-bbc","2026-10-12-uk-aisi-access","2026-10-12-lecun-seoul","2026-10-12-pasquale-cnn","2026-10-13-uk-bist-hearing","2026-10-13-ressa-fight-back"];
function parseDate(label) {
  // "2026.09.17—20", "2025.10—2026.01", "2026.09—10", "2014"
  const [a, b] = label.split("—");
  const A = a.split(".");
  const start = A.join("-");
  let end = null;
  if (b) { const B = b.split("."); if (B[0].length === 4) end = B.join("-"); else { const base = A.slice(0, A.length - B.length); end = [...base, ...B].join("-"); } }
  return { date_start: start, date_end: end, date_label: label };
}
const INTERNAL = /현재 조사 메모|조사 메모|검증 메모|1차 조사 종합|조사 인용|추가 검증 메모/;
const events = raw.DATA.timeline.map((t, i) => {
  const fcId = "T" + String(i + 1).padStart(2, "0");
  const d = raw.TIMELINE_DETAILS[t.title];
  return {
    id: EVENT_IDS[i], ...parseDate(t.date), title: t.title, summary: t.text, camp: CAMP_SHORT[t.camp],
    people_ids: [], background: d.background, confirmed: d.confirmed, unknown: INTERNAL.test(d.unknown) ? "" : d.unknown,
    verification: d.status, source_ids: fcSources(fcId), factcheck_ids: [fcId], review: { ...PENDING }
  };
});
const eventByFc = Object.fromEntries(events.map(e => [e.factcheck_ids[0], e]));

// ---------- lineage ----------
const P = (en) => people.find(p => p.en === en).id;
const lanes = [
  { id: "intellectual-origins", order: 1, title: "지적 원조" },
  { id: "openai-split", order: 2, title: "OpenAI 분파" },
  { id: "deep-learning", order: 3, title: "딥러닝 학맥" },
  { id: "ai-consciousness", order: 4, title: "AI 의식 논쟁" },
  { id: "evaluation-critique", order: 5, title: "평가·구조 비판" },
  { id: "acceleration", order: 6, title: "가속 인프라" }
];
const nodes = [];
const N = (lane, person_en, label, sub, extra = {}) => {
  const pid = person_en ? P(person_en) : null;
  let id = extra.id || ("n-" + pid);
  if (nodes.some(n => n.id === id)) id = id + "-" + lane;
  nodes.push({ id, lane, order: nodes.filter(n => n.lane === lane).length + 1, person_id: pid, label, sub, ...(pid ? {} : { camp: extra.camp }) });
  return id;
};
N("intellectual-origins", "Eliezer Yudkowsky", "유드코우스키", "정렬 개념");
N("intellectual-origins", "Nick Bostrom", "보스트롬", "학계 정식화");
N("intellectual-origins", null, "EA 커뮤니티", "사상 전파", { id: "n-ea-community", camp: "middle" });
N("intellectual-origins", null, "OpenAI · Anthropic 창업자 계열", "프론티어 랩으로 확산", { id: "n-frontier-founders", camp: "middle" });
N("openai-split", "Sam Altman", "올트먼", "사실상 가속");
N("openai-split", "Dario Amodei", "아모데이", "Anthropic · 감속");
N("openai-split", "Ilya Sutskever", "수츠케버", "SSI · 안전 우선");
N("openai-split", "David Robinson", "로빈슨", "사임 · 외부 비판");
N("openai-split", "Paul Christiano", "크리스티아노", "이사회 · 내부 개혁");
N("deep-learning", "Geoffrey Hinton", "힌턴", "안전으로 선회");
N("deep-learning", "Ilya Sutskever", "수츠케버", "제자 · SSI");
N("deep-learning", "Yoshua Bengio", "벤지오", "안전으로 선회");
N("deep-learning", "Yann LeCun", "르쿤", "낙관 유지");
N("ai-consciousness", "Chris Olah", "크리스토퍼 올라", "도덕적 지위 논의");
N("ai-consciousness", "Pope Leo XIV", "교황 레오 14세", "AI 의식 부정");
N("ai-consciousness", "Mustafa Suleyman", "술레이만", "“AI는 의식이 없다”");
N("evaluation-critique", "Andrej Karpathy", "안드레이 카파시", "과대예측 경계·현장 검증");
N("evaluation-critique", "Terence Tao", "테렌스 타오", "이해·설명 중심 재정렬");
N("evaluation-critique", "Amba Kak", "암바 칵", "독점·권력 집중 비판");
N("evaluation-critique", "Rumman Chowdhury", "루만 초우더리", "독립 평가 인프라");
N("acceleration", "Marc Andreessen", "앤드리슨", "테크노 낙관 이념");
N("acceleration", "Guillaume Verdon", "Beff Jezos", "e/acc 창시");
N("acceleration", "Jensen Huang", "젠슨 황", "AI 팩토리");
N("acceleration", "Liu Shengyu", "류성위", "중국 오픈소스 가속");

const E = (fcId, from, to, type, label, note) => ({ id: "e-" + fcId.toLowerCase(), from, to, type, label, note,
  verification: (FC[fcId].status === "확인 불가") ? "unverified" : "verified", source_ids: fcSources(fcId), factcheck_ids: [fcId], review: { ...PENDING } });
let edges = [
  E("L01", "n-eliezer-yudkowsky", "n-nick-bostrom", "flow", "", "『Superintelligence』(2014) 감사의 글에서 유드코우스키와의 토론에 감사하고 ‘seed AI’ 용어를 그에게 귀속했습니다. 보스트롬의 실존위험 연구(2002~)는 독자적 출발점도 있어 영향이 일방적이지는 않습니다."),
  E("L02", "n-nick-bostrom", "n-ea-community", "flow", "", "널리 언급되는 관계(FHI와 옥스퍼드 EA의 근접성)이지만, 이번 재검증에서 이를 직접 서술한 출처를 확보하지 못해 미확인으로 표시합니다."),
  E("L03", "n-ea-community", "n-frontier-founders", "flow", "", "2017년 Open Philanthropy의 OpenAI 3천만 달러 지원·이사직과 Anthropic 창업자들과의 관계가 보도됐습니다. ‘창업자 계열’ 전체가 EA의 영향을 받았다는 뜻은 아닙니다."),
  E("L04", "n-sam-altman", "n-dario-amodei", "opposition", "", "Axios는 2026년 10월 3일 올트먼의 발언을 Anthropic(아모데이)에 대한 간접 비판으로 보도했습니다."),
  E("L05", "n-dario-amodei", "n-ilya-sutskever", "flow", "", ""),
  E("L06", "n-david-robinson", "n-paul-christiano", "opposition", "", ""),
  E("L07", "n-geoffrey-hinton", "n-ilya-sutskever-deep-learning", "flow", "제자", "수츠케버는 토론토대에서 힌턴의 지도로 박사학위(2013)를 받았습니다."),
  E("L08", "n-yoshua-bengio", "n-yann-lecun", "opposition", "", "두 사람은 2023년 Munk 토론과 온라인 공개 논쟁에서 반대편에 섰습니다."),
  E("L09", "n-chris-olah", "n-pope-leo-xiv", "opposition", "", "Anthropic(올라)은 불확실성을 전제로 모델 복지를 검토하고, 교황 회칙 『Magnifica Humanitas』는 AI의 경험·양심을 부정합니다. 두 사람의 직접 공방이 아니라 구조적 입장 차이입니다."),
  E("L10", "n-pope-leo-xiv", "n-mustafa-suleyman", "opposition", "", ""),
  E("L11", "n-marc-andreessen", "n-guillaume-verdon", "flow", "", ""),
  E("L12", "n-guillaume-verdon", "n-jensen-huang", "flow", "", ""),
  E("L13", "n-jensen-huang", "n-liu-shengyu", "flow", "", "")
];
const lineage = { lanes, nodes, edges };

// ---------- changelog ----------
const U = ext.update_section.items;
const changelog = [
  {
    id: "2026-10-19-recheck", review: { ...PENDING }, approved_at: null, period: "2026-10-14 공개본 재검증 (점검일 2026-10-19)",
    headline: "이번 재검증에서 달라진 점",
    note: "공개본의 사실 137건을 원문과 다시 대조했습니다. 28건을 고쳤고, 출처를 확보하지 못한 3건은 ‘미확인’으로 표시했습니다.",
    items: [
      { title: "모든 항목에 원문 링크", text: "인물·사건·관계선마다 원문 링크를 달았습니다. ‘검증됨’ 표시는 열어 볼 수 있는 출처가 있는 항목에만 붙입니다.", refs: [] },
      { title: "근거 없는 관계선 정리", text: "직접 영향의 근거가 없는 화살표 3개(아모데이→수츠케버, Beff Jezos→젠슨 황, 젠슨 황→류성위)를 지웠습니다. 로빈슨–크리스티아노는 ‘경고 인용’, 교황 레오 14세–술레이만은 ‘입장 일치’로 고쳤고, 앤드리슨과 e/acc의 방향을 바로잡았습니다.", refs: ["L05","L12","L13","L06","L10","L11"] },
      { title: "사건 내용 정정", text: "Hugging Face 사태의 1,200개는 샌드박스 탈출이 아니라 메시지 보드 사용 수였고, Anthropic 필터 오류는 인간 피드백 벤더 트래픽에 한정됐습니다. 퍼컬레이션 추측은 ‘증명 제시’로 고쳤고(독립 검토 진행 중), GPT-6의 ‘Instant’는 별도 모델이 아니라 사고 수준 이름입니다.", refs: ["T09","T11","T12","T24"] },
      { title: "날짜·직함·명칭 정정", text: "앤드류 응의 Bloomberg TV 출연은 9월 17일(미국 시간), 나델라의 ‘비상 브레이크’ 발언은 10월 10일, AMI Labs 설립은 2025년 12월입니다. MI5의 McCallum은 ‘사무총장’이며 발언은 청문회가 아닌 별도 브리핑에서 나왔습니다. 레사가 발언한 행사는 ‘Nobel Peace Conference 2026’입니다.", refs: ["T20","P04","P05","P01","T39","T18","T11"] },
      { title: "인용을 원문에 맞춤", text: "빌 게이츠의 발언은 원문(“it's clear we're not doing enough”)에 맞게 다시 옮겼고, 수학자 단체 성명은 직역(‘학문의 증명이 아니라 권력의 과시’)으로, OpenAI의 철회 사유는 ‘부호 오류’로 바로잡았습니다. 의역한 인용에는 ‘의역’ 표시를 붙였습니다.", refs: ["T34","P24","T29"] },
      { title: "정책·인물 설명 정정", text: "캔트웰 프레임워크를 공식 6대 원칙으로 다시 정리했습니다. Anthropic이 바꾼 문서는 ‘이용 정책(Usage Policy)’이고, 술레이만의 반박은 9월 16일에 나왔습니다. 크리스토퍼 올라와 다리오 아모데이의 대표 장면도 확인된 보도로 바꿨습니다.", refs: ["T30","U2","T32","P19","P31","P32"] },
      { title: "검증 상태 조정", text: "호주 Medicare 사건(OpenAI 공식 발표)과 칼라 오르티스의 상원 증언(2023년 7월 12일)은 ‘검증됨’으로 올렸습니다. 섀넌 밸러·케이트 크로퍼드의 약력과 보스트롬→EA 관계는 출처를 확보할 때까지 ‘미확인’으로 둡니다.", refs: ["T08","P46","P42","P50","L02"] }
    ],
    source_ids: []
  },
  {
    id: "2026-10-14-update", review: { state: "legacy", by: null, at: null }, approved_at: null, period: "2026년 10월 6~13일 보도 반영 (2026-10-14 공개본)",
    headline: "2026-10-14 공개본에서 달라진 점",
    note: "2026년 10월 6~13일 보도를 반영해 수학계의 검증 논쟁과 미국·이탈리아·영국의 AI 거버넌스 움직임을 연표에 보강했습니다.",
    items: U.map((u, i) => ({ fc: "U" + (i + 1), title: u.title, text: u.text, refs: ["U" + (i + 1)], source_ids: fcSources("U" + (i + 1)) })),
    source_ids: []
  }
];

// ---------- domain groups ----------
const domainGroups = ext.domain_warnings.groups.map((g, i) => ({
  id: ["economy-labor", "law-history-philosophy", "media-art-medicine-env"][i], title: g.title,
  fields: [["경제·노동"], ["법·역사·철학·사회"], ["언론", "예술", "의학", "과학기술학·환경"]][i],
  text: g.text, factcheck_ids: ["W" + (i + 1)]
}));

// ---------- meta ----------
const footerLinks = ext.footer.sources.links.map((l, i) => src(l.url, { title: l.label, footer: true, footer_order: i + 1 }));
const meta = {
  page_title: "AI 속도 논쟁의 인물 계보",
  h1_lines: ["AI 속도 논쟁의", "인물 계보"],
  description: "“더 빨리”와 “멈춰야 한다” 사이. AI 개발 속도를 둘러싼 인물들의 이력·스탠스·관계를 출처 링크와 함께 정리한 계보입니다.",
  hero_copy: ext.hero.hero_copy,
  data_as_of: AS_OF,
  news_through: "2026-10-13",
  last_approved_at: null,
  factcheck: { checked_at: "2026-10-19", totals: fc.totals.all },
  footer_source_ids: footerLinks,
  sections: {
    timeline_note: ext.timeline.note,
    domains_note: ext.domain_warnings.note,
    people_note: ext.people_section.note,
    classification: "‘낙관’은 개발·배포·개방을 우선하는 입장, ‘안전’은 존재위험·감속·강한 감독을 강조하는 입장, ‘중간’은 양쪽 논리를 병행하거나 최근 스탠스 변화가 큰 경우입니다. ‘분야별 경고자’는 AI 개발을 본업으로 삼지 않고 자기 전문분야에서 선언·저서·강연·정책 제언·증언으로 사회적 영향을 경고한 인물입니다. AI를 직접 연구한 마커스와 벤더는 안전 진영에 놓았습니다. ‘한국’은 진영이 아니라 국적 태그이며, 김대식은 안전·신중, 하정우는 낙관·가속에 배치했습니다. 분류는 {news_through} 보도까지의 공개 행보를 요약한 것이며 {data_as_of}에 다시 검증했습니다. ‘미확인’은 열어 볼 수 있는 출처를 아직 확보하지 못했거나 해석·단서가 남은 항목입니다.",
    sources_text: "인물 카드·사건·관계선마다 원문 링크를 달았습니다. 아래는 약력과 주요 원문을 확인할 수 있는 대표 자료이고, 전체 목록은 그 아래에서 펼쳐 볼 수 있습니다.",
    corrections_text: "공개된 사실을 고칠 때는 위 ‘이전 변경 기록’에 날짜와 내용을 남깁니다. 새로 수집된 항목은 편집자가 출처를 확인해 승인하기 전까지 공개되지 않으며, 승인 뒤에도 출처가 부족하면 ‘미확인’으로 표시합니다."
  }
};

// ---------- ctx & corrections ----------
const ctx = {
  person: (id) => personByFc[id], event: (id) => eventByFc[id],
  edge: (id) => lineage.edges.find(e => e.factcheck_ids.includes(id)),
  removeEdge: (id) => { lineage.edges = lineage.edges.filter(e => !e.factcheck_ids.includes(id)); },
  reorderLane: (lane, ids) => ids.forEach((nid, i) => { lineage.nodes.find(n => n.id === nid && n.lane === lane).order = i + 1; }),
  changelogItem: (fcId) => changelog[1].items.find(i => i.fc === fcId),
  dropSource: (obj, url) => { const id = src(url); obj.source_ids = obj.source_ids.filter(s => s !== id); },
  normalizeUrl
};
for (const c of CORRECTIONS) {
  c.apply(ctx);
  // 정정 기록을 대상 항목에 남깁니다
}

// 이번 정정 항목별 근거 출처(삭제된 관계선의 반증 자료 포함)를 변경 기록에 남깁니다
for (const it of changelog[0].items) it.source_ids = [...new Set(it.refs.flatMap(r => fcSources(r)))];

// ---------- 팩트체크 '확인 불가' 3건 → 미확인 ----------
const EXTRA = [];
for (const id of ["P42", "P50"]) {
  const p = personByFc[id]; p.verification = "unverified";
  p.unverified_note = "약력·저서를 확인할 수 있는 출처를 이번 재검증에서 확보하지 못했습니다. 출처를 확인할 때까지 미확인으로 둡니다.";
  EXTRA.push(`${id} ${p.ko}: 확인 불가 → 미확인 표시 + 사유 문구`);
}
EXTRA.push("L02 보스트롬→EA: 확인 불가 → 관계선 미확인 표시(흐린 선) + 사유 문구");

// ---------- 기존 '미확인' 인물의 사유 문구(리뷰 #5) ----------
personByFc.P11.unverified_note = "『Deep Utopia』(2024) 이후의 ‘논조 변화’는 편집진의 해석입니다.";
personByFc.P09.unverified_note = "Cohere 블로그 외에 Globe and Mail·Bloomberg TV(9월 14일) 보도로 교차 확인했으며, 편집 승인 전까지 미확인으로 둡니다.";
EXTRA.push("P11·P09: 미확인 사유 한 줄 추가(리뷰 #5)");
eventByFc.T17.unknown = "고메즈 발언은 Cohere 블로그 외에 Globe and Mail·Bloomberg TV(9월 14일) 보도로도 확인됐으며, 편집 승인 전까지 미확인으로 둡니다. 고메즈는 독립 검토 자체는 지지했고, 소수 랩의 공동 표준·반독점 면제에 반대했습니다.";
EXTRA.push("T17: 미확인 사유를 팩트체크 결과(복수 보도 확인)에 맞게 갱신, '블로그 1건' 문구 삭제");
eventByFc.T36.unknown = "동결의 정확한 시작·종료일(9월 24일·10월 11일)은 1차 자료로 확인하지 못했습니다(보도 기준 약 2주 반). " + eventByFc.T36.unknown;
EXTRA.push("T36: 동결 기간 날짜가 1차 자료 미확인임을 미확인 사항에 추가(T39 정정이 참조)");
personByFc.P26.moment = personByFc.P26.moment.replace("4단계 ‘four-tier funnel’로 설명", "4단계 깔때기(funnel)로 설명");
EXTRA.push("P26: 2차 매체의 명명 ‘four-tier funnel’을 카파시의 표현처럼 인용하던 따옴표 제거");

// ---------- 의역 인용 표시 ----------
const markPara = (s) => s.replace("‘우유 한 팩과 세탁기보다 AI 규제가 약하다’", "‘우유 한 팩과 세탁기보다 AI 규제가 약하다’(의역)");
personByFc.P25.stance = markPara(personByFc.P25.stance);
eventByFc.T35.background = markPara(eventByFc.T35.background);
eventByFc.T26.confirmed = eventByFc.T26.confirmed.replace("최악의 역사적 시나리오로 경고했습니다.", "최악의 역사적 시나리오로 경고했습니다(의역).");
eventByFc.T27.summary = eventByFc.T27.summary.replace("현재 AI 시스템을 통제하는 법을 모른다는 내부자 경고", "현재 AI 시스템을 통제하는 법을 모른다는(의역) 내부자 경고");
EXTRA.push("의역 표시: P25·T35 ‘우유 한 팩과 세탁기…’, T26 하라리 발언, T27 콕슨 발언(팩트체크가 의역으로 분류)");

// ---------- 사건 ↔ 인물 연결(본문에 이름이 나오는 경우만) ----------
const NO_SHORT = new Set(["응", "칵", "리", "황", "존슨", "벤더"]);
for (const e of events) {
  const hay = [e.title, e.summary, e.confirmed].join(" ");
  for (const p of people) {
    const keys = [p.ko, ...p.aliases];
    if (!NO_SHORT.has(p.short) && p.short.length >= 2) keys.push(p.short);
    if (p.ko === "사이먼 존슨") keys.push("·존슨", "존슨이");
    if (keys.some(k => hay.includes(k))) e.people_ids.push(p.id);
  }
}

// ---------- write ----------
const out = (name, obj) => fs.writeFileSync(path.join(APP, "data", name), JSON.stringify(obj, null, 2) + "\n");
out("meta.json", meta);
out("camps.json", camps);
out("people.json", people);
out("events.json", events);
out("lineage.json", lineage);
out("sources.json", [...sources.values()].sort((a, b) => a.id.localeCompare(b.id)));
out("changelog.json", changelog);
out("domain-groups.json", domainGroups);
fs.writeFileSync(path.join(APP, "tools", "migration-extra-edits.json"), JSON.stringify(EXTRA, null, 2) + "\n");
console.log(`people ${people.length}, events ${events.length}, nodes ${lineage.nodes.length}, edges ${lineage.edges.length}, sources ${sources.size}`);
