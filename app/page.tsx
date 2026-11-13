import Link from "next/link";
import { BadgeCheck, Filter, Layers, Lock } from "lucide-react";
import { countDomain, DOMAINS } from "@/lib/catalog";
import { Footer, TopBar } from "@/components/Shell";
import { SearchBox } from "@/components/SearchBox";
import { DOMAIN_META, DomainIcon, Verified } from "@/components/ui";

export default function Home() {
  return (
    <>
      <TopBar />
      <main>
        <section className="hero">
          <div className="wrap">
            <span className="pill">
              <BadgeCheck size={14} /> Peer-reviewed research only
            </span>
            <h1>
              Every disease. Every study. <em>Filtered your way.</em>
            </h1>
            <p>
              Pick a human, animal or plant disease, or an agricultural problem, and see the published research on it, filtered by where the treatment comes
              from: plants, fungi, bacteria, endophytes, insects, viruses and more.
            </p>
            <div className="trust">
              <span>
                <BadgeCheck size={16} /> PubMed · Europe PMC · NLM MeSH
              </span>
              <span>
                <Layers size={16} /> {new Intl.NumberFormat("en").format(Object.keys(DOMAINS).length && countDomain("human") + countDomain("animal") + countDomain("plant") + countDomain("agri"))} diseases & problems
              </span>
              <span>
                <Lock size={16} /> No account needed
              </span>
            </div>
          </div>
        </section>

        <div className="wrap">
          <div className="searchcard">
            <SearchBox />
            <div className="hint">
              <span>Try: breast cancer · diabetes · mastitis · rice blast · drought stress · fall armyworm</span>
            </div>
          </div>

          <div className="domains">
            {DOMAINS.map((d) => {
              const m = DOMAIN_META[d.id];
              return (
                <Link key={d.id} className="domain" href={`/browse/${d.id}`}>
                  <DomainIcon domain={d.id} size={26} />
                  <span>
                    <b>{m.label}</b>
                    <span>{d.sub}</span>
                    <br />
                    <span className="n">{new Intl.NumberFormat("en").format(countDomain(d.id))} entries</span>
                  </span>
                </Link>
              );
            })}
          </div>

          <h2 className="section-title">How it works</h2>
          <div className="how">
            <div>
              <b>
                <span className="num">1</span> Choose a disease
              </b>
              <p>Search or browse the official classification down to sub-types, e.g. Cancer → Breast → Triple-negative.</p>
            </div>
            <div>
              <b>
                <span className="num">2</span> Filter the research
              </b>
              <p>
                <Filter size={13} style={{ verticalAlign: -2 }} /> By source (plants, fungi, bacteria, endophytes, insects, viruses…), study type, research stage, year, country and open access.
              </p>
            </div>
            <div>
              <b>
                <span className="num">3</span> Verify every paper
              </b>
              <p>
                Each result carries a <Verified /> and links to the original paper, plus a one-click check of the same search on PubMed and Europe PMC.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
