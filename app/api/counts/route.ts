import { NextResponse } from "next/server";
import { getNode } from "@/lib/catalog";
import { buildQuery, SOURCES, STAGES, STUDY_TYPES } from "@/lib/filters";
import { counts } from "@/lib/epmc";
import { parseSelection } from "@/lib/params";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Counts for every filter chip, given the current selection (each chip = selection + that chip). */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const n = getNode(u.searchParams.get("id") || "");
  if (!n) return NextResponse.json({ error: "Unknown disease" }, { status: 404 });
  const sel = parseSelection(u);
  const group = u.searchParams.get("group") || "sources";
  const defs = group === "studies" ? STUDY_TYPES : group === "stages" ? STAGES : SOURCES;
  const key = group === "studies" ? "studies" : group === "stages" ? "stages" : "sources";
  const qs: Record<string, string> = {};
  for (const f of defs) qs[f.id] = buildQuery(n.query, { ...sel, [key]: [f.id] });
  const out = await counts(qs, 7);
  return NextResponse.json({ group, counts: out }, { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } });
}
