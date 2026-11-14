import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { Footer, TopBar } from "@/components/Shell";
import { SearchBox } from "@/components/SearchBox";
import { Research } from "@/components/Research";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `${q} · all research, ranked | Research Atlas` : "Search research | Research Atlas" };
}

export default async function TopicPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const topic = q.trim().slice(0, 120);
  return (
    <>
      <TopBar />
      <main className="wrap page">
        <div className="crumbs">
          <Link href="/">Home</Link> <ChevronRight size={14} /> <span>All research</span>
          {topic && (
            <>
              <ChevronRight size={14} /> <span>{topic}</span>
            </>
          )}
        </div>
        <div className="dhead">
          <span className="ic" style={{ background: "linear-gradient(135deg,#2f3bb3,#5b6cf5)" }}>
            <BookOpen size={28} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1>{topic ? `“${topic}”` : "Search any research topic"}</h1>
            <div className="meta">
              <span className="tag src">Peer-reviewed literature · Europe PMC / PubMed</span>
              <span className="tag">Any topic</span>
            </div>
            <p className="note-text">
              Every indexed paper matching this topic, ranked standard-first (systematic reviews and trials ahead of other articles, preprints last). Use the filters to
              narrow by treatment source, study type, stage, year, country or open access.
            </p>
          </div>
        </div>
        <div style={{ margin: "18px 0 6px" }}>
          <SearchBox placeholder="Search another topic or disease…" />
        </div>
        {topic.length >= 2 ? <Research id={`q:${topic}`} name={`“${topic}”`} /> : <div className="note" style={{ marginTop: 16 }}>Type at least 2 characters to search.</div>}
      </main>
      <Footer />
    </>
  );
}
