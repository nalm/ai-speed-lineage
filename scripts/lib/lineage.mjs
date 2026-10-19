// 계보 SVG를 데이터(lane·order)로 고정 격자에 자동 배치합니다. 손으로 적은 좌표는 없습니다.
import { esc } from "./html.mjs";

const W = 1200, GUTTER = 168, RIGHT = 20, LANE_H = 100, LANE_GAP = 12, NODE_H = 58, MIN_GAP = 64, MAX_GAP = 120;
const textWidth = (s, px) => [...s].reduce((w, ch) => w + (/[\u3131-\uD79D]/.test(ch) ? px * 1.0 : /[A-Z]/.test(ch) ? px * 0.66 : /[\s·]/.test(ch) ? px * 0.34 : px * 0.56), 0);

export function layoutLineage(D) {
  const campOf = (n) => n.person_id ? D.people.find(p => p.id === n.person_id).camp : n.camp;
  const lanes = [...D.lineage.lanes].sort((a, b) => a.order - b.order);
  const placed = new Map();
  const laneBoxes = lanes.map((lane, li) => {
    const y = li * (LANE_H + LANE_GAP);
    const nodes = D.lineage.nodes.filter(n => n.lane === lane.id).sort((a, b) => a.order - b.order);
    const widths = nodes.map(n => Math.max(118, Math.ceil(Math.max(textWidth(n.label, 13.5), textWidth(n.sub || "", 11)) + 30)));
    const avail = W - GUTTER - RIGHT;
    const sum = widths.reduce((a, b) => a + b, 0);
    const gap = nodes.length > 1 ? Math.max(MIN_GAP, Math.min(MAX_GAP, (avail - sum) / (nodes.length - 1))) : 0;
    const total = sum + gap * Math.max(0, nodes.length - 1);
    let x = GUTTER + Math.max(0, (avail - total) / 2);
    nodes.forEach((n, i) => {
      const box = { ...n, x: Math.round(x), y: y + (LANE_H - NODE_H) / 2 + 6, w: widths[i], h: NODE_H, camp: campOf(n) };
      placed.set(n.id, box); x += widths[i] + gap;
    });
    return { ...lane, y, h: LANE_H, nodes: nodes.map(n => placed.get(n.id)) };
  });
  const H = lanes.length * (LANE_H + LANE_GAP) - LANE_GAP;
  return { W, H, laneBoxes, placed };
}

const REL = { flow: "흐름", opposition: "대립·긴장", agreement: "인용·입장 일치" };
export const relationWord = (e) => e.label || REL[e.type];

export function renderLineageSvg(D, { campBadge, personName, laneNumber }) {
  const { W, H, laneBoxes, placed } = layoutLineage(D);
  const out = [];
  out.push(`<svg class="genealogy" viewBox="0 0 ${W} ${H}" role="group" aria-labelledby="graph-title graph-desc">`);
  out.push(`<title id="graph-title">${esc(D.meta.page_title)} — ${laneBoxes.length}갈래 관계도</title>`);
  const desc = laneBoxes.map(l => `${laneNumber(l)} · ${l.title}`).join(", ");
  out.push(`<desc id="graph-desc">${esc(desc)}. 노드를 누르면 해당 인물 카드로 이동합니다. 관계선의 근거는 그림 아래 목록에 있습니다.</desc>`);
  out.push(`<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="arrowhead" d="M 0 0 L 10 5 L 0 10 z"/></marker>` +
    `<marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"><circle class="dothead" cx="5" cy="5" r="4"/></marker></defs>`);
  for (const l of laneBoxes) {
    out.push(`<g class="lane-group"><rect class="lane" x="0" y="${l.y}" width="${W}" height="${l.h}" rx="4"/><text class="lane-title" x="20" y="${l.y + 28}">${esc(laneNumber(l) + " · " + l.title)}</text>`);
    for (const n of l.nodes) {
      const cx = n.x + n.w / 2;
      const rect = `<rect class="node ${campBadge(n.camp)}" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6"/>` +
        `<text class="name" x="${cx}" y="${n.y + 26}" text-anchor="middle">${esc(n.label)}</text>` +
        `<text class="sub" x="${cx}" y="${n.y + 44}" text-anchor="middle">${esc(n.sub || "")}</text>`;
      if (n.person_id) {
        const full = personName(n.person_id);
        const aria = `${n.label}${full !== n.label ? ` (${full})` : ""} — ${n.sub || ""}. 인물 카드로 이동`;
        out.push(`<a class="node-link" href="#person-${esc(n.person_id)}" aria-label="${esc(aria)}">${rect}</a>`);
      } else {
        out.push(`<g class="node-static" role="img" aria-label="${esc(n.label + " — " + (n.sub || "") + " (인물이 아닌 집단)")}">${rect}</g>`);
      }
    }
    out.push(`</g>`);
  }
  for (const e of D.lineage.edges) {
    const a = placed.get(e.from), b = placed.get(e.to);
    const left = a.x < b.x ? a : b, right = a.x < b.x ? b : a;
    const cy = a.y + a.h / 2;
    let d, lx, ly;
    if (Math.abs(a.order - b.order) === 1) {
      const x1 = a === left ? left.x + left.w : right.x, x2 = a === left ? right.x - 2 : left.x + left.w + 2;
      d = `M${x1} ${cy} H${x2}`; lx = (left.x + left.w + right.x) / 2; ly = cy - 8;
    } else {
      const x1 = a.x + a.w / 2, x2 = b.x + b.w / 2, top = a.y - 2;
      d = `M${x1} ${top} C${x1} ${top - 26} ${x2} ${top - 26} ${x2} ${top}`; lx = (x1 + x2) / 2; ly = top - 22;
    }
    const rel = relationWord(e) + (e.verification !== "verified" ? " · 미확인" : "");
    const showLabel = e.label || e.verification !== "verified";
    const title = `${a.label} ${e.type === "flow" ? "→" : e.type === "opposition" ? "↔" : "＝"} ${b.label}: ${rel}. ${e.note}`;
    out.push(`<g class="edge ${e.type}${e.verification !== "verified" ? " unverified" : ""}"><title>${esc(title)}</title><path d="${d}"/>` +
      (showLabel ? `<text class="relation" x="${lx}" y="${ly}" text-anchor="middle">${esc(rel)}</text>` : "") + `</g>`);
  }
  out.push(`</svg>`);
  return out.join("\n");
}
