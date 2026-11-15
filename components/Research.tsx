"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, ExternalLink, Filter, Lightbulb, Link2, ListOrdered, RotateCcw, SlidersHorizontal, TriangleAlert, X } from "lucide-react";
import type { Domain } from "@/lib/catalog";
import { COUNTRIES, SOURCES, STAGES, STUDY_TYPES, YEARS, type Filter as FDef, type Selection } from "@/lib/filters";
import type { Paper } from "@/lib/epmc";
import { TIERS } from "@/lib/rank";
import { Pulse, Verified } from "./ui";

type Counts = Record<string, number>;
type RankedPaper = Paper & { tier?: number; tierLabel?: string };
type PapersRes = { total: number; items: RankedPaper[]; nextCursor?: string; query: string; verify: { europepmc: string; pubmed: string } };

const EMPTY: Selection = { sources: [], studies: [], stages: [], open: false };
const nf = new Intl.NumberFormat("en");
const compact = new Intl.NumberFormat("en", { notation: "compact" });

function toParams(id: string, s: Selection, extra: Record<string, string> = {}) {
  const p = new URLSearchParams({ ...(id.startsWith("q:") ? { q: id.slice(2) } : { id }), ...extra });
  if (s.sources.length) p.set("sources", s.sources.join(","));
  if (s.studies.length) p.set("studies", s.studies.join(","));
  if (s.stages.length) p.set("stages", s.stages.join(","));
  if (s.year) p.set("year", s.year);
  if (s.country) p.set("country", s.country);
  if (s.open) p.set("open", "1");
  if (s.organism) p.set("organism", s.organism);
  return p.toString();
}

export function Research({ id, name, domain }: { id: string; name: string; domain?: Domain }) {
  const [sel, setSel] = useState<Selection>(EMPTY);
  const [sort, setSort] = useState<"rank" | "relevance" | "cited" | "date">("rank");
  const [showRank, setShowRank] = useState(false);
  const [res, setRes] = useState<PapersRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [trend, setTrend] = useState<{ year: string; n: number | null }[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [organismInput, setOrganismInput] = useState("");
  const reqId = useRef(0);

  // Restore filters from the URL hash so a filtered view can be shared.
  useEffect(() => {
    try {
      const h = new URLSearchParams(location.hash.slice(1));
      if ([...h.keys()].length) {
        const s: Selection = {
          sources: (h.get("sources") || "").split(",").filter(Boolean),
          studies: (h.get("studies") || "").split(",").filter(Boolean),
          stages: (h.get("stages") || "").split(",").filter(Boolean),
          year: h.get("year") || undefined,
          country: h.get("country") || undefined,
          open: h.get("open") === "1",
          organism: h.get("organism") || undefined,
        };
        setSel(s);
        setOrganismInput(s.organism || "");
      }
    } catch {}
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    const p = toParams("x", sel);
    const h = p.replace(/^id=x&?/, "").replace(/&$/, "");
    history.replaceState(null, "", h ? `#${h}` : location.pathname);
  }, [sel]);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setLoading(true);
    setErr(null);
    const url = `/api/papers?${toParams(id, sel, { sort })}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(url);
        const d = await r.json();
        if (my !== reqId.current) return;
        if (!r.ok) throw new Error(d.error || "Failed");
        setRes(d);
        setLoading(false);
        return;
      } catch (e: any) {
        if (my !== reqId.current) return;
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 1500)); // one silent retry
          continue;
        }
        setErr(e?.message || "Could not load papers.");
        setLoading(false);
      }
    }
  }, [id, sel, sort]);

  useEffect(() => {
    load();
  }, [load]);

  // Chip counts and trend, refreshed whenever the selection changes.
  useEffect(() => {
    let dead = false;
    setCounts({});
    setTrend(null);
    (async () => {
      const get = async (g: string) => {
        try {
          const r = await fetch(`/api/counts?${toParams(id, sel, { group: g })}`);
          const d = await r.json();
          if (!dead && d.counts) setCounts((c) => ({ ...c, [g]: d.counts }));
        } catch {}
      };
      // Staggered so Europe PMC is not hit with everything at once.
      await Promise.all([get("sources"), get("tiers")]);
      if (dead) return;
      await Promise.all([
        get("studies"),
        get("stages"),
        (async () => {
          try {
            const r = await fetch(`/api/trend?${toParams(id, sel)}`);
            const d = await r.json();
            if (!dead && d.years) setTrend(d.years.map((y: any) => ({ ...y, n: y.n < 0 ? null : y.n })));
          } catch {}
        })(),
      ]);
    })();
    return () => {
      dead = true;
    };
  }, [id, sel]);

  async function more() {
    if (!res?.nextCursor) return;
    setLoadingMore(true);
    try {
      const r = await fetch(`/api/papers?${toParams(id, sel, { sort, cursor: res.nextCursor })}`);
      const d: PapersRes = await r.json();
      if (r.ok) setRes({ ...d, items: [...res.items, ...d.items] });
    } finally {
      setLoadingMore(false);
    }
  }

  const toggle = (key: "sources" | "studies" | "stages", fid: string) =>
    setSel((s) => ({ ...s, [key]: s[key].includes(fid) ? s[key].filter((x) => x !== fid) : [...s[key], fid] }));

  const activeCount = sel.sources.length + sel.studies.length + sel.stages.length + (sel.year ? 1 : 0) + (sel.country ? 1 : 0) + (sel.open ? 1 : 0) + (sel.organism ? 1 : 0);

  const sourceBars = useMemo(() => {
    const c = counts.sources || {};
    return SOURCES.map((f) => ({ id: f.id, label: `${f.icon} ${f.label}`, value: c[f.id] ?? -1, hl: sel.sources.includes(f.id) })).filter((x) => x.value >= 0).sort((a, b) => b.value - a.value);
  }, [counts, sel.sources]);

  const gaps = useMemo(() => {
    const c = counts.sources;
    if (!c) return [];
    return SOURCES.filter((f) => c[f.id] >= 0 && c[f.id] < 5).map((f) => f.label);
  }, [counts]);

  const Chip = ({ group, f }: { group: "sources" | "studies" | "stages"; f: FDef }) => {
    const n = counts[group]?.[f.id];
    const on = sel[group].includes(f.id);
    return (
      <button className="fchip" aria-pressed={on} onClick={() => toggle(group, f.id)} title={f.hint || f.label} disabled={!on && n === 0}>
        {f.icon && <span aria-hidden="true">{f.icon}</span>}
        {f.label}
        <span className={`cnt ${n === undefined ? "skel" : ""}`}>{n === undefined ? "···" : n < 0 ? "?" : compact.format(n)}</span>
      </button>
    );
  };

  return (
    <section className="research" aria-label="Research">
      <aside className={`sidebar ${showFilters ? "open" : ""}`} aria-label="Filters">
        <div className="fbar">
          <h2 style={{ margin: 0 }}>Filters</h2>
          {activeCount > 0 && (
            <button className="btn sm" onClick={() => (setSel(EMPTY), setOrganismInput(""))}>
              <RotateCcw size={14} /> Clear ({activeCount})
            </button>
          )}
          <button className="btn sm filterbtn" style={{ marginLeft: "auto" }} onClick={() => setShowFilters(false)} aria-label="Close filters">
            <X size={14} />
          </button>
        </div>

        <div className="fgroup">
          <h3>
            Where the treatment comes from <small>pick one or more</small>
          </h3>
          <div className="chips">
            {SOURCES.map((f) => (
              <Chip key={f.id} group="sources" f={f} />
            ))}
          </div>
        </div>

        <div className="fgroup">
          <h3>Type of study</h3>
          <div className="chips">
            {STUDY_TYPES.map((f) => (
              <Chip key={f.id} group="studies" f={f} />
            ))}
          </div>
        </div>

        <div className="fgroup">
          <h3>Research stage</h3>
          <div className="chips">
            {STAGES.map((f) => (
              <Chip key={f.id} group="stages" f={f} />
            ))}
          </div>
        </div>

        <div className="fgroup">
          <h3>Year</h3>
          <div className="chips">
            {YEARS.map((y) => (
              <button key={y.id} className="fchip" aria-pressed={sel.year === y.id} onClick={() => setSel((s) => ({ ...s, year: s.year === y.id ? undefined : y.id }))}>
                {y.label}
              </button>
            ))}
          </div>
        </div>

        <div className="fgroup">
          <h3>Country of study</h3>
          <select value={sel.country || ""} onChange={(e) => setSel((s) => ({ ...s, country: e.target.value || undefined }))}>
            <option value="">Any country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="fgroup">
          <h3>Specific organism or compound</h3>
          <input
            type="text"
            value={organismInput}
            placeholder="e.g. neem, curcumin, Streptomyces"
            onChange={(e) => setOrganismInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSel((s) => ({ ...s, organism: organismInput.trim() || undefined }))}
            onBlur={() => setSel((s) => (s.organism === (organismInput.trim() || undefined) ? s : { ...s, organism: organismInput.trim() || undefined }))}
          />
        </div>

        <div className="fgroup">
          <label className="toggle">
            <input type="checkbox" checked={!!sel.open} onChange={(e) => setSel((s) => ({ ...s, open: e.target.checked }))} />
            Open access only (full paper free to read)
          </label>
        </div>
      </aside>

      <div style={{ minWidth: 0 }}>
        <div className="papers-head">
          <h2>Research on {name}</h2>
          <button className="btn sm filterbtn" onClick={() => setShowFilters(true)}>
            <SlidersHorizontal size={14} /> Filters{activeCount ? ` (${activeCount})` : ""}
          </button>
          <button className={`btn sm ${showRank ? "primary" : ""}`} onClick={() => setShowRank((v) => !v)} aria-expanded={showRank} aria-controls="rank-panel">
            <ListOrdered size={14} /> Rank order
          </button>
          <div className="sort">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="rank">Standard first (ranked)</option>
              <option value="relevance">Most relevant</option>
              <option value="cited">Most cited</option>
              <option value="date">Newest</option>
            </select>
          </div>
        </div>

        {showRank && (
          <div className="rankpanel" id="rank-panel" role="region" aria-label="Rank order">
            <div className="rankhead">
              <b>
                <ListOrdered size={16} /> How results are ranked
              </b>
              <span>
                Evidence tier first, then citations, MEDLINE indexing, open access and recency. {sort !== "rank" && <em>Currently sorted by “{sort === "cited" ? "most cited" : sort === "date" ? "newest" : "most relevant"}”; choose “Standard first” to apply this order.</em>}
              </span>
              <button className="btn sm" onClick={() => setShowRank(false)} aria-label="Close rank order">
                <X size={14} />
              </button>
            </div>
            <ol className="tiers">
              {TIERS.map((t) => {
                const n = counts.tiers?.[String(t.n)];
                const max = Math.max(1, ...TIERS.map((x) => counts.tiers?.[String(x.n)] || 0));
                return (
                  <li key={t.n}>
                    <span className={`tn t${t.n}`}>{t.n}</span>
                    <span className="tl">
                      {t.label}
                      {t.n === 6 && <small> · shown last, not peer-reviewed</small>}
                    </span>
                    <span className="track">
                      <span className="fill" style={{ width: n ? `${Math.max(1.5, (n / max) * 100)}%` : "0%" }} />
                    </span>
                    <span className="tc">{n === undefined ? "···" : n < 0 ? "?" : compact.format(n)}</span>
                  </li>
                );
              })}
            </ol>
            <div className="rankfoot">Within a tier: more citations → higher. MEDLINE-indexed journals and open-access papers rank slightly above others. Counts use the current filters.</div>
          </div>
        )}

        <div className="total">
          {loading && !res ? (
            <span className="loader">
              <Pulse /> Searching verified literature…
            </span>
          ) : res ? (
            <>
              {nf.format(res.total)} peer-reviewed papers <Verified />
              {activeCount > 0 && <span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: ".86rem" }}>with {activeCount} filter{activeCount > 1 ? "s" : ""}</span>}
            </>
          ) : null}
        </div>

        <div className="charts" style={{ marginTop: 12 }}>
          <div className="chart">
            <h4>
              <Filter size={14} /> Papers by treatment source <Verified />
              <small>{sel.sources.length ? "highlighted = selected" : ""}</small>
            </h4>
            {!counts.sources ? (
              <div className="skel">
                <i />
                <i />
                <i />
                <i />
              </div>
            ) : (
              <div className="bars">
                {sourceBars.slice(0, 8).map((b, i) => {
                  const max = sourceBars[0]?.value || 1;
                  return (
                    <div className={`bar ${b.hl ? "hl" : ""}`} key={b.id}>
                      <span className="lab">{b.label}</span>
                      <span className="track">
                        <span className="fill" style={{ width: `${Math.max(1.5, (b.value / max) * 100)}%`, animationDelay: `${i * 40}ms` }} />
                      </span>
                      <span className="val">{compact.format(b.value)}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {gaps.length > 0 && (
              <div className="gap">
                <Lightbulb size={15} />
                <span>
                  <b>Research gap:</b> fewer than 5 papers from {gaps.slice(0, 4).join(", ")}
                  {gaps.length > 4 ? ` and ${gaps.length - 4} more` : ""}. An opening for new studies.
                </span>
              </div>
            )}
          </div>
          <div className="chart">
            <h4>
              <BookOpen size={14} /> Papers per year <Verified />
              <small>last 10 years</small>
            </h4>
            {!trend ? (
              <div className="skel">
                <i />
                <i />
                <i />
                <i />
              </div>
            ) : (
              <>
                <div className="trend">
                  {trend.map((t, i) => {
                    const max = Math.max(...trend.map((x) => x.n ?? 0), 1);
                    return (
                      <div key={t.year} title={t.n == null ? `${t.year}: no data` : `${t.year}: ${nf.format(t.n)} papers`}>
                        <b>{t.n == null ? "?" : compact.format(t.n)}</b>
                        <i style={{ height: `${Math.max(2, ((t.n ?? 0) / max) * 70)}%`, animationDelay: `${i * 40}ms` }} />
                        <span>{t.year.slice(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <TrendNote trend={trend} />
              </>
            )}
          </div>
        </div>

        {err && (
          <div className="note warn" style={{ marginBottom: 12 }}>
            <TriangleAlert size={16} />
            <span>
              {err}{" "}
              <button className="btn sm" style={{ marginLeft: 8 }} onClick={load}>
                <RotateCcw size={14} /> Retry
              </button>
            </span>
          </div>
        )}

        {loading && res && (
          <div className="loader" style={{ marginBottom: 10 }}>
            <Pulse /> Updating…
          </div>
        )}

        {res && res.items.length === 0 && !loading && (
          <div className="note">
            <Lightbulb size={16} />
            <span>No papers match this combination yet. That itself is a finding: a research gap. Try removing a filter.</span>
          </div>
        )}

        <div className="plist" style={{ opacity: loading && res ? 0.55 : 1, transition: "opacity .2s" }}>
          {res?.items.map((p, i) => (
            <article className="paper" key={p.id}>
              {sort === "rank" && p.tier && (
                <div className="rankbadge">
                  <span className="pos">#{i + 1}</span>
                  <span className={`tn t${p.tier}`}>{p.tier}</span>
                  <span>Tier {p.tier} · {p.tierLabel}</span>
                </div>
              )}
              <a className="t" href={p.href} target="_blank" rel="noreferrer">
                {p.title}
              </a>
              <div className="meta">
                <Verified />
                <span>{p.authors}</span>
                {p.journal && <span>{p.journal}</span>}
                <span>{p.year}</span>
                {p.cited > 0 && <span>Cited {nf.format(p.cited)}×</span>}
                {p.open && <span className="oa">Open access</span>}
                {p.types.map((t) => (
                  <span className="ty" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              {(p.abstract || p.mesh?.length) && (
                <details>
                  <summary>Abstract & index terms</summary>
                  {p.abstract && <p className="abs">{p.abstract}…</p>}
                  {p.mesh && p.mesh.length > 0 && (
                    <div className="mesh">
                      {p.mesh.map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  )}
                </details>
              )}
              <div className="links">
                <a href={p.href} target="_blank" rel="noreferrer">
                  <ExternalLink size={12} /> Open paper
                </a>
                {p.pmid && (
                  <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`} target="_blank" rel="noreferrer">
                    <ExternalLink size={12} /> PubMed
                  </a>
                )}
                <a href={`https://europepmc.org/article/MED/${p.pmid || p.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink size={12} /> Europe PMC
                </a>
              </div>
            </article>
          ))}
        </div>

        {res?.nextCursor && res.items.length < res.total && (
          <div className="more">
            <button className="btn" onClick={more} disabled={loadingMore}>
              {loadingMore ? "Loading…" : `Load more (${nf.format(res.total - res.items.length)} remaining)`}
            </button>
          </div>
        )}

        {res && (
          <>
            <details className="sources">
              <summary>
                <Link2 size={16} /> Sources & how to verify this search
                <ChevronDown size={16} className="chev" />
              </summary>
              <ol>
                <li>
                  <a href={res.verify.europepmc} target="_blank" rel="noreferrer">
                    Run this exact search on Europe PMC
                  </a>{" "}
                  <Verified />
                </li>
                <li>
                  <a href={res.verify.pubmed} target="_blank" rel="noreferrer">
                    Run the equivalent search on PubMed
                  </a>{" "}
                  <Verified />
                </li>
                {!id.startsWith("q:") && (
                  <li>
                    Disease term from{" "}
                    <a href="https://www.nlm.nih.gov/mesh/" target="_blank" rel="noreferrer">
                      NLM Medical Subject Headings (MeSH)
                    </a>{" "}
                    <Verified />
                  </li>
                )}
                <li>
                  Query used: <code>{res.query}</code>
                </li>
              </ol>
            </details>
            <div className="legend">
              <span>
                <Verified /> Peer-reviewed, indexed in PubMed/Europe PMC
              </span>
              <span>Counts are live from Europe PMC and may change as new papers are indexed.</span>
              {sort === "rank" && <span>Ranked view orders the 60 most relevant papers per page; “Load more” ranks the next 60.</span>}
            </div>
            <p className="disclaimer">
              This tool lists published research. It is not medical, veterinary or agricultural advice. Consult a qualified doctor, veterinarian or agronomist
              before acting on any study.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function TrendNote({ trend }: { trend: { year: string; n: number | null }[] }) {
  if (trend.some((x) => x.n == null)) return <div className="gap">Some yearly counts are unavailable right now; try again in a minute.</div>;
  const a = trend.slice(0, 5).reduce((s, x) => s + (x.n || 0), 0);
  const b = trend.slice(5, 9).reduce((s, x) => s + (x.n || 0), 0) * (5 / 4); // exclude the current partial year
  if (a === 0 && b === 0) return <div className="gap">No papers in the last 10 years.</div>;
  const pct = a ? Math.round(((b - a) / a) * 100) : 100;
  const word = pct > 15 ? "growing" : pct < -15 ? "declining" : "steady";
  return (
    <div className="gap">
      <Lightbulb size={15} />
      <span>
        Research is <b>{word}</b> ({pct > 0 ? "+" : ""}
        {pct}% in the last 4 full years vs the 5 before).
      </span>
    </div>
  );
}
