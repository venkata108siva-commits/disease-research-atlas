import { NextResponse } from "next/server";
import { getNode } from "@/lib/catalog";
import { buildQuery } from "@/lib/filters";
import { counts } from "@/lib/epmc";
import { parseSelection, parseTopic } from "@/lib/params";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Papers per year for the last 10 years, for the trend chart. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const n = getNode(u.searchParams.get("id") || "");
  const base = n ? n.query : parseTopic(u);
  if (!base) return NextResponse.json({ error: "Unknown disease or topic" }, { status: 404 });
  const sel = { ...parseSelection(u), year: undefined };
  const bq = buildQuery(base, sel);
  const now = new Date().getFullYear();
  const qs: Record<string, string> = {};
  for (let y = now - 9; y <= now; y++) qs[String(y)] = `${bq} AND PUB_YEAR:${y}`;
  const out = await counts(qs, 4);
  return NextResponse.json({ years: Object.entries(out).map(([year, n]) => ({ year, n })) }, { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } });
}
