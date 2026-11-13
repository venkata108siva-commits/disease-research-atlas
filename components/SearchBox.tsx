"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
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

  return (
    <div className="searchbox" ref={box}>
      <Search size={20} />
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setSel((s) => Math.min(s + 1, hits.length - 1));
          else if (e.key === "ArrowUp") setSel((s) => Math.max(s - 1, 0));
          else if (e.key === "Enter" && hits[sel]) go(hits[sel]);
          else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder || "Search a disease or problem, e.g. breast cancer, mastitis, rice blast, drought…"}
        aria-label="Search diseases"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {q && (
        <button className="btn sm clear" onClick={() => (setQ(""), setHits([]), setOpen(false))} aria-label="Clear">
          <X size={16} />
        </button>
      )}
      {open && hits.length > 0 && (
        <div className="results" role="listbox">
          {hits.map((h, i) => (
            <a key={h.id} href={`/d/${h.id}`} role="option" aria-selected={i === sel} onClick={(e) => (e.preventDefault(), go(h))} onMouseEnter={() => setSel(i)}>
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
        </div>
      )}
      {open && q.trim().length >= 2 && hits.length === 0 && (
        <div className="results" style={{ padding: 14, fontSize: ".88rem", color: "var(--ink-3)" }}>
          No matching disease. Try another spelling, a broader term, or browse the categories below.
        </div>
      )}
    </div>
  );
}
