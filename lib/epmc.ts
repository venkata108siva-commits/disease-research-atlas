// Europe PMC access: peer-reviewed literature indexed from PubMed/MEDLINE and more.
const BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const UA = "DiseaseResearchAtlas/1.0 (educational research tool)";

export type Paper = {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  cited: number;
  open: boolean;
  types: string[];
  allTypes?: string[];
  source?: string;
  doi?: string;
  pmid?: string;
  href: string;
  abstract?: string;
  mesh?: string[];
};

async function call(params: Record<string, string>, timeout = 15000) {
  const u = new URLSearchParams({ format: "json", ...params });
  const r = await fetch(`${BASE}?${u}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(timeout), next: { revalidate: 86400 } } as RequestInit);
  if (!r.ok) throw new Error(`EPMC ${r.status}`);
  return r.json();
}

export async function count(query: string): Promise<number> {
  try {
    const d = await call({ query, pageSize: "1", resultType: "idlist" }, 12000);
    return Number(d.hitCount) || 0;
  } catch {
    return -1; // unknown
  }
}

export async function counts(queries: Record<string, string>, concurrency = 6): Promise<Record<string, number>> {
  const keys = Object.keys(queries);
  const out: Record<string, number> = {};
  let i = 0;
  const worker = async () => {
    while (i < keys.length) {
      const k = keys[i++];
      out[k] = await count(queries[k]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, keys.length) }, worker));
  return out;
}

export type SearchResult = { total: number; items: Paper[]; nextCursor?: string };

export async function searchPapers(query: string, opts: { sort?: "relevance" | "cited" | "date" | "rank"; cursor?: string; pageSize?: number } = {}): Promise<SearchResult> {
  const sort = opts.sort === "cited" ? "CITED desc" : opts.sort === "date" ? "P_PDATE_D desc" : "";
  const d = await call({
    query: sort ? query : query,
    pageSize: String(opts.pageSize || 20),
    resultType: "core",
    cursorMark: opts.cursor || "*",
    ...(sort ? { sort } : {}),
  });
  const seen = new Set<string>();
  const items: Paper[] = (d.resultList?.result || []).filter((p: any) => {
    const k = (p.doi || strip(p.title || "")).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).map((p: any) => ({
    id: p.id,
    title: strip(p.title || ""),
    authors: shortAuthors(p.authorString || ""),
    journal: p.journalInfo?.journal?.title || p.journalTitle || (p.source === "PPR" ? "Preprint" : ""),
    year: p.pubYear || "",
    cited: p.citedByCount || 0,
    open: p.isOpenAccess === "Y",
    types: (p.pubTypeList?.pubType || []).filter((t: string) => !/journal article|research-article|english abstract/i.test(t)).slice(0, 3),
    allTypes: p.pubTypeList?.pubType || [],
    source: p.source,
    doi: p.doi,
    pmid: p.pmid,
    href: p.doi ? `https://doi.org/${p.doi}` : `https://europepmc.org/article/${p.source}/${p.id}`,
    abstract: p.abstractText ? strip(p.abstractText).slice(0, 700) : undefined,
    mesh: (p.meshHeadingList?.meshHeading || []).map((m: any) => m.descriptorName).slice(0, 12),
  }));
  return { total: Number(d.hitCount) || 0, items, nextCursor: d.nextCursorMark && d.nextCursorMark !== opts.cursor ? d.nextCursorMark : undefined };
}

function strip(s: string) {
  return decode(decode(s)).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().replace(/\.$/, "");
}
function decode(s: string) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");
}
function shortAuthors(s: string) {
  const a = s.replace(/\.$/, "").split(", ");
  return a.length > 3 ? `${a.slice(0, 3).join(", ")} et al.` : a.join(", ");
}

export function epmcSearchUrl(query: string) {
  return `https://europepmc.org/search?query=${encodeURIComponent(query)}`;
}
export function pubmedSearchUrl(query: string) {
  // Approximate translation of KW: to PubMed MeSH syntax for the "verify on PubMed" link.
  const q = query.replace(/KW:"([^"]+)"/g, '"$1"[MeSH Terms]').replace(/PUB_TYPE:"([^"]+)"/g, '"$1"[Publication Type]').replace(/AFF:"([^"]+)"/g, '"$1"[Affiliation]').replace(/OPEN_ACCESS:y/g, "free full text[filter]").replace(/PUB_YEAR:\[(\d+) TO (\d+)\]/g, '("$1"[Date - Publication] : "$2"[Date - Publication])');
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`;
}
