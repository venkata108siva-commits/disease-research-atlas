import { NextResponse } from "next/server";
import { DOMAINS, breadcrumbs, getNode, type Domain } from "@/lib/catalog";

export const dynamic = "force-dynamic";

function lite(id: string) {
  const n = getNode(id)!;
  return { id: n.id, name: n.name, syn: n.syn.slice(0, 4), note: n.note, source: n.source, ui: n.ui, childCount: n.children.length, domain: n.domain };
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id");
  const domain = u.searchParams.get("domain") as Domain | null;
  if (!id && domain) {
    const d = DOMAINS.find((x) => x.id === domain);
    if (!d) return NextResponse.json({ error: "Unknown domain" }, { status: 404 });
    return NextResponse.json({ domain: d.id, label: d.label, sub: d.sub, children: d.roots.map(lite) });
  }
  const n = id ? getNode(id) : undefined;
  if (!n) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const kids = n.children.map(lite).sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({
    node: { ...lite(n.id), query: n.query },
    crumbs: breadcrumbs(n.id).map((c) => ({ id: c.id, name: c.name })),
    children: kids,
  });
}
