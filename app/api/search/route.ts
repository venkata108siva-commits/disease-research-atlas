import { NextResponse } from "next/server";
import { search, type Domain } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") || "").slice(0, 80);
  const domain = u.searchParams.get("domain") as Domain | null;
  const items = search(q, domain && ["human", "animal", "plant", "agri"].includes(domain) ? domain : undefined).map((n) => ({
    id: n.id,
    name: n.name,
    domain: n.domain,
    syn: n.syn.slice(0, 3),
    source: n.source,
    hasChildren: n.children.length > 0,
  }));
  return NextResponse.json({ items });
}
