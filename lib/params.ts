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
