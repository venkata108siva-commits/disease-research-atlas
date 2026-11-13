import Link from "next/link";
import { MESH_BUILT } from "@/lib/catalog";

export function TopBar({ current }: { current?: string }) {
  return (
    <header className="topbar">
      <div className="wrap">
        <Link className="brand" href="/">
          <img src="/icons/icon-192.png" alt="" width={34} height={34} />
          <span>
            <b>Disease Research Atlas</b>
            <small>Verified research, filtered</small>
          </span>
        </Link>
        <span className="spacer" />
        <nav className="topnav" aria-label="Sections">
          {(["human", "animal", "plant", "agri"] as const).map((d) => (
            <Link key={d} href={`/browse/${d}`} aria-current={current === d ? "page" : undefined}>
              {{ human: "Human", animal: "Animal", plant: "Plant", agri: "Agriculture" }[d]}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <span>© {new Date().getFullYear()} Disease Research Atlas · For education and research only. Not medical, veterinary or agricultural advice.</span>
        <span>
          Papers from <a href="https://europepmc.org" target="_blank" rel="noreferrer">Europe PMC</a> and <a href="https://pubmed.ncbi.nlm.nih.gov" target="_blank" rel="noreferrer">PubMed</a> · Disease classification from{" "}
          <a href="https://www.nlm.nih.gov/mesh/" target="_blank" rel="noreferrer">NLM MeSH</a> ({MESH_BUILT})
        </span>
      </div>
    </footer>
  );
}
