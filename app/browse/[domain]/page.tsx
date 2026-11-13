import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { DOMAINS, getNode, type Domain } from "@/lib/catalog";
import { Footer, TopBar } from "@/components/Shell";
import { SearchBox } from "@/components/SearchBox";
import { DOMAIN_META, DomainIcon } from "@/components/ui";

export function generateStaticParams() {
  return DOMAINS.map((d) => ({ domain: d.id }));
}

export default async function Browse({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const d = DOMAINS.find((x) => x.id === domain);
  if (!d) notFound();
  const m = DOMAIN_META[d.id as Domain];
  const roots = d.roots.map((r) => getNode(r)!).filter(Boolean);
  return (
    <>
      <TopBar current={d.id} />
      <main className="wrap page">
        <div className="crumbs">
          <Link href="/">Home</Link> <ChevronRight size={14} /> <span>{m.label}</span>
        </div>
        <div className="dhead">
          <DomainIcon domain={d.id as Domain} size={28} />
          <div>
            <h1>{m.label}</h1>
            <div className="meta">
              <span className="tag src">{d.id === "human" || d.id === "animal" ? "NLM MeSH classification" : "Curated + MeSH"}</span>
              <span>{d.sub}</span>
            </div>
          </div>
        </div>
        <div style={{ margin: "18px 0 22px" }}>
          <SearchBox domain={d.id as Domain} placeholder={`Search ${m.label.toLowerCase()}…`} />
        </div>
        <div className="subtypes">
          <h2>Categories · {roots.length}</h2>
          <div className="sublist">
            {roots.map((n) => (
              <Link key={n.id} className="sub" href={`/d/${n.id}`}>
                {n.name}
                <span className="more">{n.children.length ? `${n.children.length} sub-types` : ""}</span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
