import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { breadcrumbs, getNode } from "@/lib/catalog";
import { Footer, TopBar } from "@/components/Shell";
import { DOMAIN_META, DomainIcon } from "@/components/ui";
import { Research } from "@/components/Research";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const n = getNode(id);
  return { title: n ? `${n.name} · research filtered by source | Research Atlas` : "Not found" };
}

export default async function DiseasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = getNode(id);
  if (!n) notFound();
  const m = DOMAIN_META[n.domain];
  const crumbs = breadcrumbs(n.id);
  const kids = n.children.map((c) => getNode(c)!).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  const firstKids = kids.slice(0, 12);
  const restKids = kids.slice(12);
  return (
    <>
      <TopBar current={n.domain} />
      <main className="wrap page">
        <div className="crumbs">
          <Link href="/">Home</Link> <ChevronRight size={14} />
          <Link href={`/browse/${n.domain}`}>{m.short}</Link>
          {crumbs.slice(0, -1).map((c) => (
            <span key={c.id} style={{ display: "contents" }}>
              <ChevronRight size={14} /> <Link href={`/d/${c.id}`}>{c.name}</Link>
            </span>
          ))}
          <ChevronRight size={14} /> <span>{n.name}</span>
        </div>
        <div className="dhead">
          <DomainIcon domain={n.domain} size={28} />
          <div style={{ minWidth: 0 }}>
            <h1>{n.name}</h1>
            <div className="meta">
              <span className="tag src">{n.source === "MeSH" ? `NLM MeSH · ${n.ui}` : "Curated · plant pathology / agronomy"}</span>
              <span className="tag">{m.label}</span>
              {n.ui && (
                <a href={`https://meshb.nlm.nih.gov/record/ui?ui=${n.ui}`} target="_blank" rel="noreferrer" style={{ fontSize: ".82rem" }}>
                  Official definition ↗
                </a>
              )}
            </div>
            {n.note && <p className="note-text">{n.note}</p>}
            {n.syn.length > 0 && <div className="syn">Also known as: {n.syn.join(" · ")}</div>}
          </div>
        </div>

        {kids.length > 0 && (
          <div className="subtypes">
            <h2>Sub-types · {kids.length}</h2>
            <div className="sublist">
              {firstKids.map((k) => (
                <Link key={k.id} className="sub" href={`/d/${k.id}`}>
                  {k.name}
                  <span className="more">{k.children.length ? `${k.children.length} more` : ""}</span>
                  <ChevronRight size={16} />
                </Link>
              ))}
            </div>
            {restKids.length > 0 && (
              <details className="moresubs">
                <summary>Show all {kids.length} sub-types</summary>
                <div className="sublist" style={{ marginTop: 8 }}>
                  {restKids.map((k) => (
                    <Link key={k.id} className="sub" href={`/d/${k.id}`}>
                      {k.name}
                      <span className="more">{k.children.length ? `${k.children.length} more` : ""}</span>
                      <ChevronRight size={16} />
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <Research id={n.id} name={n.name} domain={n.domain} />
      </main>
      <Footer />
    </>
  );
}
