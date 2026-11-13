import { NextResponse } from "next/server";
import { getNode } from "@/lib/catalog";
import { buildQuery, type Selection } from "@/lib/filters";
import { epmcSearchUrl, pubmedSearchUrl, searchPapers } from "@/lib/epmc";
import { parseSelection } from "@/lib/params";

export const runtime = "nodejs";
export const maxDuration = 30;


export async function GET(req: Request) {
  const u = new URL(req.url);
  const n = getNode(u.searchParams.get("id") || "");
  if (!n) return NextResponse.json({ error: "Unknown disease" }, { status: 404 });
  const sel = parseSelection(u);
  const query = buildQuery(n.query, sel);
  const sort = (u.searchParams.get("sort") as any) || "relevance";
  const cursor = u.searchParams.get("cursor") || undefined;
  try {
    const r = await searchPapers(query, { sort, cursor, pageSize: 20 });
    return NextResponse.json({ ...r, query, verify: { europepmc: epmcSearchUrl(query), pubmed: pubmedSearchUrl(query) } }, { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Europe PMC did not respond. Please try again." }, { status: 502 });
  }
}
