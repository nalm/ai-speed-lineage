import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const DATA_DIR = process.env.DATA_DIR_OVERRIDE || path.join(APP_DIR, "data");
export const DIST_DIR = path.join(APP_DIR, "dist");
export const FILES = ["meta", "camps", "people", "events", "lineage", "sources", "changelog", "domain-groups"];

export function loadData(dir = DATA_DIR) {
  const D = {};
  for (const f of FILES) {
    const p = path.join(dir, f + ".json");
    try { D[f.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = JSON.parse(fs.readFileSync(p, "utf8")); }
    catch (e) { throw new Error(`${f}.json 을 읽지 못했습니다: ${e.message}`); }
  }
  return D; // { meta, camps, people, events, lineage, sources, changelog, domainGroups }
}

/** 데이터에서 계산하는 숫자들(히어로 통계·필터·계보 요약). 손으로 적지 않습니다. */
export function computeStats(D) {
  const byCamp = Object.fromEntries(D.camps.map(c => [c.id, D.people.filter(p => p.camp === c.id).length]));
  const usedCamps = D.camps.filter(c => byCamp[c.id] > 0);
  const edgeTypes = { flow: 0, opposition: 0, agreement: 0 };
  for (const e of D.lineage.edges) edgeTypes[e.type] = (edgeTypes[e.type] || 0) + 1;
  return {
    people: D.people.length,
    perspectives: usedCamps.length,
    events: D.events.length,
    byCamp,
    korea: D.people.filter(p => p.country === "한국").length,
    peopleUnverified: D.people.filter(p => p.verification !== "verified").length,
    eventsVerified: D.events.filter(e => e.verification === "verified").length,
    eventsUnverified: D.events.filter(e => e.verification !== "verified").length,
    lanes: D.lineage.lanes.length,
    nodes: D.lineage.nodes.length,
    edges: D.lineage.edges.length,
    edgeTypes,
    edgesUnverified: D.lineage.edges.filter(e => e.verification !== "verified").length,
    portraits: D.people.filter(p => p.portrait).length,
    sources: D.sources.length
  };
}
