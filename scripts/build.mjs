// data/*.json → dist/ 정적 사이트. JS 없이도 모든 내용이 보이도록 HTML을 미리 렌더링합니다.
import fs from "node:fs";
import path from "node:path";
import { loadData, computeStats, APP_DIR, DIST_DIR } from "./lib/data.mjs";
import { esc, txt } from "./lib/html.mjs";
import { renderLineageSvg, layoutLineage, relationWord } from "./lib/lineage.mjs";

const D = loadData();
const S = computeStats(D);
const camp = Object.fromEntries(D.camps.map(c => [c.id, c]));
const person = Object.fromEntries(D.people.map(p => [p.id, p]));
const source = Object.fromEntries(D.sources.map(s => [s.id, s]));
const node = Object.fromEntries(D.lineage.nodes.map(n => [n.id, n]));
const preview = !D.meta.last_approved_at;
const NUM = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
const lanesSorted = [...D.lineage.lanes].sort((a, b) => a.order - b.order);
const laneNumber = (l) => lanesSorted.findIndex(x => x.id === l.id) + 1;

const srcLinks = (ids, sep = " · ") => {
  const list = ids.map(id => source[id]).filter(Boolean), seen = {};
  const total = list.reduce((m, s) => (m[s.publisher] = (m[s.publisher] || 0) + 1, m), {});
  return list.map(s => {
    const n = (seen[s.publisher] = (seen[s.publisher] || 0) + 1);
    const label = total[s.publisher] > 1 ? `${s.publisher} ${n}` : s.publisher;
    return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"${s.title ? ` title="${esc(s.title)}"` : ""}>${esc(label)}</a>`;
  }).join(sep);
};
const isoRange = (e) => e.date_end
  ? `<time datetime="${e.date_start}">${esc(e.date_label.split("—")[0])}</time>—<time datetime="${e.date_end}">${esc(e.date_label.split("—")[1])}</time>`
  : `<time datetime="${e.date_start}">${esc(e.date_label)}</time>`;
const personLink = (id, label) => `<a href="#person-${esc(id)}">${esc(label ?? person[id].ko)}</a>`;
const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => D.meta[k] ?? "");

// ---------- 히어로 ----------
const hero = `
    <header class="hero">
      <div>
        <p class="draft-line">데이터 기준일 ${esc(D.meta.data_as_of)} · ${preview ? '<span class="pending">공개 승인 전 미리보기</span>' : `마지막 승인 ${esc(D.meta.last_approved_at)}`}</p>
        <h1>${D.meta.h1_lines.map(esc).join("<br>")}</h1>
        <p class="hero-copy">${txt(D.meta.hero_copy)}</p>
      </div>
      <dl class="stats" aria-label="자료 개요">
        <div class="stat"><dt class="sr-only">인물 수</dt><dd style="margin:0"><strong>${S.people}</strong><span>인물</span></dd></div>
        <div class="stat"><dt class="sr-only">관점 수</dt><dd style="margin:0"><strong>${S.perspectives}</strong><span>관점</span></dd></div>
        <div class="stat"><dt class="sr-only">사건 수</dt><dd style="margin:0"><strong>${S.events}</strong><span>주요 사건</span></dd></div>
      </dl>
    </header>`;

// ---------- 달라진 점 ----------
const [latest, ...older] = D.changelog;
const updates = `
    <section aria-labelledby="update-title">
      <div class="section-head">
        <div><h2 id="update-title">${esc(latest.headline)}</h2></div>
        <p class="section-note">${txt(latest.note)}</p>
      </div>
      <div class="update-board">
        ${latest.items.map(it => `<article class="update-item"><h3>${esc(it.title)}</h3><p>${txt(it.text)}</p></article>`).join("\n        ")}
      </div>
      ${older.length ? `<details class="history">
        <summary>이전 변경 기록 ${older.length}회</summary>
        ${older.map(c => `<div class="history-entry">
          <h3>${esc(c.headline)}</h3><p class="period">${esc(c.period)}</p>
          <p class="period">${txt(c.note)}</p>
          <ul>${c.items.map(it => `<li><strong>${esc(it.title)}</strong> — ${txt(it.text)}${it.source_ids?.length ? ` <span class="update-source">출처: ${srcLinks(it.source_ids)}</span>` : ""}</li>`).join("")}</ul>
        </div>`).join("\n")}
      </details>` : ""}
    </section>`;

// ---------- 계보 ----------
const legend = D.camps.map(c => `<span class="legend-item ${c.badge}"><span class="legend-dot" aria-hidden="true"></span>${esc(c.label)}</span>`).join("\n            ");
const svg = renderLineageSvg(D, { campBadge: (id) => camp[id].badge, personName: (id) => person[id].ko, laneNumber });
const connector = (a, b) => {
  const e = D.lineage.edges.find(x => (x.from === a.id && x.to === b.id) || (x.from === b.id && x.to === a.id));
  if (!e) return { sym: " / ", label: "직접 관계선 없음" };
  const sym = e.type === "flow" ? (e.from === a.id ? " → " : " ← ") : e.type === "opposition" ? " ↔ " : " ＝ ";
  return { sym, label: relationWord(e) + (e.verification !== "verified" ? " (미확인)" : ""), unverified: e.verification !== "verified" };
};
const chainNode = (n) => {
  const c = camp[n.person_id ? person[n.person_id].camp : n.camp];
  const inner = `${esc(n.label)}<span class="chain-camp">(${esc(c.short)})</span>`;
  return `<span class="${c.badge}-text">${n.person_id ? `<a href="#person-${esc(n.person_id)}">${inner}</a>` : inner}</span>`;
};
const chains = lanesSorted.map(l => {
  const ns = D.lineage.nodes.filter(n => n.lane === l.id).sort((a, b) => a.order - b.order);
  const parts = ns.map((n, i) => {
    if (i === 0) return chainNode(n);
    const c = connector(ns[i - 1], n);
    return `<span aria-label="${esc(c.label)}">${esc(c.sym)}</span>${c.unverified ? '<span class="tag-unverified">미확인</span> ' : ""}${chainNode(n)}`;
  });
  return `<article class="chain"><h3>${laneNumber(l)} · ${esc(l.title)}</h3><p>${parts.join("")}</p></article>`;
}).join("\n            ");
const evidence = D.lineage.edges.map(e => {
  const a = node[e.from], b = node[e.to];
  const sym = e.type === "flow" ? "→" : e.type === "opposition" ? "↔" : "＝";
  return `<li><strong>${esc(a.label)} ${sym} ${esc(b.label)}</strong> · ${esc(relationWord(e))}${e.verification !== "verified" ? '<span class="tag-unverified">미확인</span>' : ""}<br>${txt(e.note)}${e.source_ids.length ? `<span class="src-links">출처: ${srcLinks(e.source_ids)}</span>` : ""}</li>`;
}).join("\n              ");
const et = S.edgeTypes;
const genealogy = `
    <section aria-labelledby="genealogy-title">
      <div class="section-head">
        <div>
          <h2 id="genealogy-title">${NUM[S.lanes] || S.lanes} 갈래의 계보</h2>
          <div class="legend" aria-label="진영 색상 범례">
            ${legend}
          </div>
        </div>
        <p class="section-note">화살표는 사상·학맥·조직의 흐름을, 화살촉 없는 점선은 대립 또는 긴장을, 양끝에 점이 있는 실선은 인용·입장 일치를 뜻합니다. 직접 영향이 확인되지 않은 인과는 넣지 않았고, 출처를 확보하지 못한 관계는 흐리게 ‘미확인’으로 표시했습니다. 노드를 누르면 인물 카드로 이동합니다.</p>
      </div>
      <div class="graph-shell">
        <div class="graph-label"><strong>지적 영향 → 조직 분화 → 정책·인프라</strong><span>${S.lanes}갈래 · 관계선 ${S.edges}개(흐름 ${et.flow} · 대립 ${et.opposition} · 인용·입장 일치 ${et.agreement}) · 인물 위치는 상대적 관계를 위한 배치</span></div>
        <div class="graph-wrap">
          ${svg}
          <div class="mobile-chains" aria-label="모바일용 계보 요약">
            <p class="chain-key">→ 흐름 · ↔ 대립 · ＝ 인용·입장 일치 · / 직접 관계선 없음 · 괄호는 진영</p>
            ${chains}
          </div>
        </div>
        <details class="graph-foot">
          <summary>관계선 근거 ${S.edges}개 보기</summary>
          <ul class="edge-key" aria-label="선 모양 설명">
            <li><svg width="34" height="10" aria-hidden="true"><path d="M2 5 H30" stroke="currentColor" stroke-width="1.6"/><path d="M26 1 L32 5 L26 9z" fill="currentColor"/></svg>흐름(화살표)</li>
            <li><svg width="34" height="10" aria-hidden="true"><path d="M2 5 H32" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5 4"/></svg>대립·긴장(점선, 방향 없음)</li>
            <li><svg width="34" height="10" aria-hidden="true"><path d="M4 5 H30" stroke="currentColor" stroke-width="1.6"/><circle cx="4" cy="5" r="3" fill="currentColor"/><circle cx="30" cy="5" r="3" fill="currentColor"/></svg>인용·입장 일치</li>
          </ul>
          <ul class="evidence">
              ${evidence}
          </ul>
        </details>
      </div>
    </section>`;

// ---------- 연표 ----------
const chevron = '<span class="event-chevron" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
const timeline = `
    <section aria-labelledby="timeline-title">
      <div class="section-head">
        <div><h2 id="timeline-title">${esc(D.events[0].date_start.slice(0, 4))}—${esc(D.events.at(-1).date_start.slice(0, 4))} 전환점</h2></div>
        <p class="section-note">${txt(D.meta.sections.timeline_note)} 사건 ${S.events}건 중 ${S.eventsVerified}건 검증됨, ${S.eventsUnverified}건 미확인.</p>
      </div>
      <div class="timeline-frame">
        <ol class="timeline" id="timeline">
${D.events.map(e => {
  const did = "detail-" + e.id, ok = e.verification === "verified";
  return `          <li class="${camp[e.camp].badge}" id="event-${esc(e.id)}">
            <div class="when">${isoRange(e)}</div>
            <span class="axis" aria-hidden="true"></span>
            <article class="event">
              <div class="event-row">
                <h3 class="event-title-row"><button class="event-toggle" type="button" aria-expanded="true" aria-controls="${did}"><span class="event-heading">${txt(e.title)}</span>${chevron}</button><span class="event-status ${ok ? "verified" : "unverified"}">${ok ? "검증됨" : "미확인"}</span></h3>
                <p class="event-copy">${txt(e.summary)}</p>
                <p class="source src-links">출처: ${srcLinks(e.source_ids)}</p>
              </div>
              <div class="event-detail" id="${did}">
                <div class="detail-block"><h4>배경</h4><p>${txt(e.background)}</p></div>
                <div class="detail-block"><h4>확인된 사실</h4><p>${txt(e.confirmed)}</p>${e.people_ids.length ? `<p class="event-people">관련 인물: ${e.people_ids.map(id => personLink(id)).join(" · ")}</p>` : ""}</div>
                ${e.unknown ? `<div class="detail-block"><h4>미확인 사항</h4><p>${txt(e.unknown)}</p></div>` : ""}
              </div>
            </article>
          </li>`;
}).join("\n")}
        </ol>
      </div>
    </section>`;

// ---------- 분야별 ----------
const domains = `
    <section aria-labelledby="domains-title">
      <div class="section-head">
        <div><h2 id="domains-title">전문분야에서 건너온 경고</h2></div>
        <p class="section-note">${txt(D.meta.sections.domains_note)}</p>
      </div>
      <div class="domain-board">
        ${D.domainGroups.map(g => {
          const ms = D.people.filter(p => p.camp === "domain" && g.fields.includes(p.field));
          return `<article class="domain-group"><h3>${esc(g.title)}</h3><p><strong>${ms.map(p => personLink(p.id, p.short)).join(" · ")}</strong><br>${txt(g.text)}</p></article>`;
        }).join("\n        ")}
      </div>
    </section>`;

// ---------- 인물 ----------
const initials = (en) => {
  const parts = en.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) || [];
  const p = parts.length > 2 && /^(?:Jr|Sr|I{1,3}|IV|V|VI{0,3}|IX|X|XI{0,3}|XIV)$/i.test(parts.at(-1)) ? parts.slice(0, -1) : parts;
  return p.length > 1 ? p[0][0] + p.at(-1)[0] : (p[0] || "").slice(0, 2);
};
const card = (p, i) => {
  const c = camp[p.camp];
  const portrait = p.portrait
    ? `<div class="portrait"><img src="${esc(p.portrait.path)}" alt="${esc(p.ko)} 초상 사진" width="72" height="72" loading="lazy" decoding="async"></div>`
    : `<div class="portrait initials" aria-hidden="true">${esc(initials(p.en))}</div>`;
  const search = [p.ko, p.en, ...p.aliases, p.field, p.country, p.role, p.stance, p.moment, c.label, ...p.source_ids.map(id => source[id]?.publisher)].filter(Boolean).join(" ").toLocaleLowerCase("ko");
  return `<article class="person" id="person-${esc(p.id)}" tabindex="-1" data-camp="${esc(p.camp)}"${p.country ? ` data-country="${esc(p.country)}"` : ""} data-search="${esc(search)}">
          <div class="card-top"><span class="index">${String(i + 1).padStart(2, "0")}</span><div class="badges">
            <span class="badge ${c.badge}">${esc(c.label)}</span>${p.country ? `<span class="badge kr">${esc(p.country)}</span>` : ""}${p.field ? `<span class="badge field">${esc(p.field)}</span>` : ""}${p.verification !== "verified" ? '<span class="badge warn">미확인</span>' : ""}
          </div></div>
          <div class="identity">${portrait}<h3>${esc(p.ko)}<span class="en">${esc([p.en, ...p.aliases].join(" · "))}</span></h3></div>
          <p class="role">${txt(p.role)}</p>
          <p class="stance">${txt(p.stance)}</p>
          <p class="moment"><strong>대표 장면</strong> · ${txt(p.moment)}</p>
          ${p.verification !== "verified" ? `<p class="unverified-note"><strong>미확인 사유</strong> · ${txt(p.unverified_note)}</p>` : ""}
          <p class="card-source">출처: ${p.source_ids.length ? srcLinks(p.source_ids) : "확보 전"}</p>
        </article>`;
};
const filters = [["all", `전체 ${S.people}`], ...D.camps.map(c => [c.id, `${c.short} ${S.byCamp[c.id]}`]), ["korea", `한국 태그 ${S.korea}`]];
const peopleSec = `
    <section aria-labelledby="people-title">
      <div class="section-head">
        <div><h2 id="people-title">인물 ${S.people}명</h2></div>
        <p class="section-note">${txt(D.meta.sections.people_note)}</p>
      </div>
      <div class="controls" role="search" aria-label="인물 탐색 도구">
        <label class="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <span class="sr-only">인물 검색</span>
          <input id="searchInput" type="search" placeholder="이름, 소속, 키워드 검색" autocomplete="off" />
        </label>
        <div class="filter-group" role="group" aria-label="진영 필터">
          ${filters.map(([f, l], i) => `<button class="filter-btn" type="button" data-filter="${f}" aria-pressed="${i === 0}">${esc(l)}</button>`).join("\n          ")}
        </div>
      </div>
      <p class="result-line" id="resultLine" aria-live="polite">${S.people}명을 표시하고 있습니다.</p>
      <div class="people-grid" id="peopleGrid">
        ${D.people.map(card).join("\n        ")}
      </div>
      <div class="empty" id="emptyState">조건에 맞는 인물이 없습니다. 검색어나 진영 필터를 바꿔 보세요.</div>
      <noscript><p class="noscript">검색·필터와 연표 접기는 JavaScript가 필요합니다. 모든 내용은 JavaScript 없이도 아래에 펼쳐져 있습니다.</p></noscript>
    </section>`;

// ---------- 푸터 ----------
const withPhoto = D.people.filter(p => p.portrait);
const bySource = [...D.sources].sort((a, b) => a.publisher.localeCompare(b.publisher, "ko") || a.url.localeCompare(b.url));
const footer = `
    <footer class="method">
      <div>
        <h2>분류 기준</h2>
        <p>${txt(fill(D.meta.sections.classification))}</p>
      </div>
      <div>
        <h2>확인 가능한 주요 원문·약력</h2>
        <p>${txt(D.meta.sections.sources_text)}</p>
        <div class="sources-list">
          ${D.meta.footer_source_ids.map(id => source[id]).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title || s.publisher)}</a>`).join("\n          ")}
        </div>
      </div>
      <details class="all-sources">
        <summary>전체 출처 ${S.sources}건 (매체·기관 이름순)</summary>
        <ul>${bySource.map(s => `<li>${esc(s.publisher)}${s.kind === "primary" ? " (1차)" : ""} · <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url.replace(/^https?:\/\//, ""))}</a></li>`).join("")}</ul>
      </details>
      <details class="photo-credits">
        <summary>사진 크레딧 · Wikimedia Commons 자유 라이선스 ${withPhoto.length}건</summary>
        <div class="photo-credit-grid">
          ${withPhoto.map(p => `<p class="photo-credit"><strong>${esc(p.ko)}</strong> · ${esc(p.portrait.author)} · ${esc(p.portrait.license)} · ${esc(p.portrait.crop)} · <a href="${esc(p.portrait.commons_url)}" target="_blank" rel="noopener noreferrer">원본·라이선스</a></p>`).join("\n          ")}
        </div>
      </details>
      <div class="corrections">
        <h2>정정·수정 안내</h2>
        <p>${txt(D.meta.sections.corrections_text)}</p>
      </div>
      <p class="build-info">데이터 기준일 ${esc(D.meta.data_as_of)} · 보도 반영 ${esc(D.meta.news_through)}까지 · 팩트체크 점검일 ${esc(D.meta.factcheck.checked_at)} · ${preview ? "공개 승인 전 미리보기" : `마지막 승인 ${esc(D.meta.last_approved_at)}`}</p>
    </footer>`;

const html = `<!doctype html>
<html lang="ko" class="no-js">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="color-scheme" content="light dark" />
  <title>${esc(D.meta.page_title)}</title>
  <meta name="description" content="${esc(D.meta.description)}" />
  ${preview ? '<meta name="robots" content="noindex, nofollow" />' : ""}
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:title" content="${esc(D.meta.page_title)}" />
  <meta property="og:description" content="${esc(D.meta.description)}" />
  <link rel="icon" href="data:," />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/styles.css" />
  <script>document.documentElement.className = "js";</script>
</head>
<body>
  ${preview ? '<p class="preview-banner" role="note">공개 승인 전 미리보기입니다. 편집자 승인 뒤 공개됩니다.</p>' : ""}
  <main class="page">
${hero}
${updates}
${genealogy}
${timeline}
${domains}
${peopleSec}
${footer}
  </main>
  <script src="assets/app.js" defer></script>
</body>
</html>
`;

// ---------- 쓰기 ----------
fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST_DIR, "assets/portraits"), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, "data"), { recursive: true });
fs.writeFileSync(path.join(DIST_DIR, "index.html"), html);
fs.copyFileSync(path.join(APP_DIR, "src/styles.css"), path.join(DIST_DIR, "assets/styles.css"));
fs.copyFileSync(path.join(APP_DIR, "src/app.js"), path.join(DIST_DIR, "assets/app.js"));
for (const p of withPhoto) fs.copyFileSync(path.join(APP_DIR, p.portrait.path), path.join(DIST_DIR, p.portrait.path));
for (const f of fs.readdirSync(path.join(APP_DIR, "data"))) fs.copyFileSync(path.join(APP_DIR, "data", f), path.join(DIST_DIR, "data", f));
fs.writeFileSync(path.join(DIST_DIR, "build-stats.json"), JSON.stringify({ built_at: new Date().toISOString(), data_as_of: D.meta.data_as_of, preview, ...S }, null, 2));
console.log(`✓ 빌드 완료 → dist/index.html (${(html.length / 1024).toFixed(0)} KB) · 인물 ${S.people} · 관점 ${S.perspectives} · 사건 ${S.events} · 관계선 ${S.edges}`);
