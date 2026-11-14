import { NextResponse } from "next/server";
import { getNode } from "@/lib/catalog";
import { buildQuery, type Selection } from "@/lib/filters";
import { epmcSearchUrl, pubmedSearchUrl, searchPapers } from "@/lib/epmc";
import { parseSelection, parseTopic } from "@/lib/params";
import { rank } from "@/lib/rank";

export const runtime = "nodejs";
export const maxDuration = 30;


export async function GET(req: Request) {
  const u = new URL(req.url);
  const n = getNode(u.searchParams.get("id") || "");
  const topic = parseTopic(u);
  const base = n ? n.query : topic;
  if (!base) return NextResponse.json({ error: "Unknown disease or topic" }, { status: 404 });
  const sel = parseSelection(u);
  const query = buildQuery(base, sel);
  const sort = (u.searchParams.get("sort") as any) || "rank";
  const cursor = u.searchParams.get("cursor") || undefined;
  try {
    // Standard-first rank: pull a larger relevance page, then order by evidence tier, citations, indexing, recency.
    let r = await searchPapers(query, { sort: sort === "rank" ? "relevance" : sort, cursor, pageSize: sort === "rank" ? 60 : 20 });
    if (sort === "rank" && !cursor) {
      // First ranked page also draws from the most-cited papers so landmark studies are not missed.
      const cited = await searchPapers(query, { sort: "cited", pageSize: 40 }).catch(() => null);
      if (cited) {
        const seen = new Set(r.items.map((p) => p.id));
        r = { ...r, items: [...r.items, ...cited.items.filter((p) => !seen.has(p.id))] };
      }
    }
    const items = sort === "rank" ? rank(r.items) : r.items;
    return NextResponse.json({ ...r, items, query, verify: { europepmc: epmcSearchUrl(query), pubmed: pubmedSearchUrl(query) } }, { headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Europe PMC did not respond. Please try again." }, { status: 502 });
  }
}
