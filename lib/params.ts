import type { Selection } from "./filters";

export function parseSelection(u: URL): Selection {
  const list = (k: string) => (u.searchParams.get(k) || "").split(",").filter(Boolean).slice(0, 20);
  return {
    sources: list("sources"),
    studies: list("studies"),
    stages: list("stages"),
    year: u.searchParams.get("year") || undefined,
    country: (u.searchParams.get("country") || "").slice(0, 40) || undefined,
    open: u.searchParams.get("open") === "1",
    organism: (u.searchParams.get("organism") || "").slice(0, 60) || undefined,
  };
}

/** Free-text topic from the URL, cleaned for Europe PMC. Returns a quoted phrase for multi-word topics. */
export function parseTopic(u: URL): string | null {
  const raw = (u.searchParams.get("q") || "").replace(/[^\w\s\-.,'()/]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (raw.length < 2) return null;
  const words = raw.split(" ");
  // "endophyte extraction" -> ("endophyte extraction" OR (endophyte AND extraction))
  return words.length > 1 ? `("${raw}" OR (${words.map((w) => w.replace(/[()]/g, "")).filter(Boolean).join(" AND ")}))` : raw;
}
