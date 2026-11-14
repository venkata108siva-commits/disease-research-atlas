"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, X } from "lucide-react";
import type { Domain } from "@/lib/catalog";
import { DOMAIN_META, DomainIcon } from "./ui";

type Hit = { id: string; name: string; domain: Domain; syn: string[]; source: string; hasChildren: boolean };

export function SearchBox({ domain, placeholder, autoFocus }: { domain?: Domain; placeholder?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}${domain ? `&domain=${domain}` : ""}`);
      const d = await r.json();
      setHits(d.items || []);
      setSel(0);
      setOpen(true);
    }, 160);
  }, [q, domain]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as any) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function go(h: Hit) {
    setOpen(false);
    router.push(`/d/${h.id}`);
  }
  function goTopic() {
    const t = q.trim();
    if (t.length < 2) return;
    setOpen(false);
    router.push(`/r?q=${encodeURIComponent(t)}`);
  }
  const total = hits.length + 1; // +1 for the "all research" row

  return (
    <div className="searchbox" ref={box}>
      <Search size={20} />
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.trim().length >= 2 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setSel((s) => Math.min(s + 1, total - 1));
          else if (e.key === "ArrowUp") setSel((s) => Math.max(s - 1, 0));
          else if (e.key === "Enter") {
            if (sel === 0 || !hits.length) goTopic();
            else go(hits[sel - 1]);
          } else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder || "Search any disease or research topic, e.g. breast cancer, endophyte extraction, rice blast…"}
        aria-label="Search diseases"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {q && (
        <button className="btn sm clear" onClick={() => (setQ(""), setHits([]), setOpen(false))} aria-label="Clear">
          <X size={16} />
        </button>
      )}
      {open && q.trim().length >= 2 && (
        <div className="results" role="listbox">
          <a href={`/r?q=${encodeURIComponent(q.trim())}`} role="option" aria-selected={sel === 0} className="topic" onClick={(e) => (e.preventDefault(), goTopic())} onMouseEnter={() => setSel(0)}>
            <span className="dom" style={{ background: "linear-gradient(135deg,#2f3bb3,#5b6cf5)" }}>
              <BookOpen size={15} />
            </span>
            <span style={{ minWidth: 0 }}>
              <b>Search all research papers for “{q.trim()}”</b>
              <span className="s">Any topic: compounds, methods, organisms, e.g. endophyte extraction · with filters and ranking</span>
            </span>
            <span className="src">All papers</span>
          </a>
          {hits.length > 0 && <div className="reshead">Diseases & problems matching “{q.trim()}”</div>}
          {hits.map((h, i) => (
            <a key={h.id} href={`/d/${h.id}`} role="option" aria-selected={i + 1 === sel} onClick={(e) => (e.preventDefault(), go(h))} onMouseEnter={() => setSel(i + 1)}>
              <DomainIcon domain={h.domain} size={15} className="dom" />
              <span style={{ minWidth: 0 }}>
                <b>{h.name}</b>
                <span className="s">
                  {DOMAIN_META[h.domain].short}
                  {h.syn.length ? ` · ${h.syn.join(", ")}` : ""}
                  {h.hasChildren ? " · has sub-types" : ""}
                </span>
              </span>
              <span className="src">{h.source}</span>
            </a>
          ))}
          {hits.length === 0 && <div className="reshead">No disease with that name. Use the option above to search every paper on the topic.</div>}
        </div>
      )}
    </div>
  );
}
