// Standard-first ranking of papers: evidence tier first, then citations, MEDLINE indexing, open access, recency.
import type { Paper } from "./epmc";

export type Tier = { n: number; label: string; short: string; test: (p: Paper) => boolean; query: string };

const has = (p: Paper, re: RegExp) => p.types.some((t) => re.test(t)) || (p.allTypes || []).some((t) => re.test(t));

export const TIERS: Tier[] = [
  { n: 1, label: "Systematic reviews & meta-analyses", short: "Systematic review", test: (p) => has(p, /systematic review|meta-analysis/i), query: `(PUB_TYPE:"Systematic Review" OR PUB_TYPE:"Meta-Analysis")` },
  { n: 2, label: "Randomised & clinical trials", short: "Clinical trial", test: (p) => has(p, /randomized controlled trial|clinical trial|controlled clinical trial/i), query: `(PUB_TYPE:"Randomized Controlled Trial" OR PUB_TYPE:"Clinical Trial" OR PUB_TYPE:"Controlled Clinical Trial")` },
  { n: 3, label: "Review articles & guidelines", short: "Review", test: (p) => has(p, /^review$|review-article|practice guideline|guideline|consensus/i), query: `(PUB_TYPE:"Review" OR PUB_TYPE:"Practice Guideline" OR PUB_TYPE:"Guideline") AND NOT (PUB_TYPE:"Systematic Review" OR PUB_TYPE:"Meta-Analysis")` },
  { n: 4, label: "Original research articles", short: "Research article", test: (p) => p.source !== "PPR" && !has(p, /case reports|editorial|letter|comment|news|erratum|retract/i), query: `(SRC:MED OR SRC:PMC) AND NOT (PUB_TYPE:"Review" OR PUB_TYPE:"Systematic Review" OR PUB_TYPE:"Meta-Analysis" OR PUB_TYPE:"Clinical Trial" OR PUB_TYPE:"Randomized Controlled Trial" OR PUB_TYPE:"Case Reports" OR PUB_TYPE:"Editorial" OR PUB_TYPE:"Letter" OR PUB_TYPE:"Comment")` },
  { n: 5, label: "Case reports, letters & editorials", short: "Case report / letter", test: (p) => p.source !== "PPR" && has(p, /case reports|editorial|letter|comment|news/i), query: `(PUB_TYPE:"Case Reports" OR PUB_TYPE:"Editorial" OR PUB_TYPE:"Letter" OR PUB_TYPE:"Comment")` },
  { n: 6, label: "Preprints (not yet peer-reviewed)", short: "Preprint", test: (p) => p.source === "PPR", query: `SRC:PPR` },
];

export function tierOf(p: Paper): Tier {
  return TIERS.find((t) => t.test(p)) || TIERS[3];
}

/** Higher = better. Tier dominates; citations (log scale), MEDLINE indexing, open access and recency break ties. */
export function score(p: Paper, now = new Date().getFullYear()): number {
  const t = tierOf(p);
  const tierPts = (7 - t.n) * 100;
  const cit = Math.log10(1 + (p.cited || 0)) * 25; // 10 cites = +26, 100 = +50, 1000 = +75
  const med = p.source === "MED" ? 12 : 0;
  const oa = p.open ? 4 : 0;
  const age = now - (Number(p.year) || now);
  const rec = Math.max(0, 10 - age); // up to +10 for this year
  return tierPts + cit + med + oa + rec;
}

export function rank(items: Paper[]): (Paper & { tier: number; tierLabel: string; score: number })[] {
  return items
    .map((p) => ({ ...p, tier: tierOf(p).n, tierLabel: tierOf(p).short, score: score(p) }))
    .sort((a, b) => b.score - a.score);
}
