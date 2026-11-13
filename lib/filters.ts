// Filter definitions. Each filter maps to a Europe PMC query fragment.
// KW: searches MeSH headings and keywords (verified to match PubMed MeSH counts).

export type Filter = { id: string; label: string; icon: string; query: string; hint?: string };

const kw = (...terms: string[]) => "(" + terms.map((t) => `KW:"${t}"`).join(" OR ") + ")";

/** Filter 1 – where the treatment / compound comes from */
export const SOURCES: Filter[] = [
  { id: "plant", label: "Plants", icon: "🌿", query: kw("Plant Extracts", "Phytotherapy", "Plants, Medicinal", "Phytochemicals", "Plant Preparations", "Medicine, Ayurvedic", "Herbal Medicine"), hint: "Herbal extracts, phytochemicals, Ayurveda, Siddha, Unani" },
  { id: "fungi", label: "Fungi", icon: "🍄", query: kw("Fungi", "Agaricales", "Basidiomycota", "Ascomycota", "Fungal Proteins", "Mycotoxins"), hint: "Mushrooms and fungal metabolites" },
  { id: "bacteria", label: "Bacteria", icon: "🦠", query: kw("Bacteria", "Probiotics", "Streptomyces", "Actinobacteria", "Lactobacillus", "Bacterial Proteins", "Microbiota"), hint: "Probiotics, actinomycetes, bacterial compounds, microbiome" },
  { id: "endophyte", label: "Endophytes", icon: "🌱", query: kw("Endophytes"), hint: "Microbes living inside plants and their compounds" },
  { id: "animal", label: "Animals", icon: "🐄", query: kw("Venoms", "Animal Products", "Snake Venoms", "Scorpion Venoms", "Amphibian Venoms", "Milk", "Chitosan"), hint: "Venoms, animal-derived compounds and products" },
  { id: "insect", label: "Insects", icon: "🦟", query: kw("Insecta", "Propolis", "Honey", "Bee Venoms", "Royal Jelly", "Bombyx", "Insect Proteins"), hint: "Bee products, silkworm, insect compounds" },
  { id: "marine", label: "Marine", icon: "🌊", query: kw("Aquatic Organisms", "Seaweed", "Porifera", "Algae", "Microalgae", "Anthozoa", "Marine Toxins"), hint: "Algae, seaweed, sponges, corals" },
  { id: "virus", label: "Viruses", icon: "🧫", query: kw("Bacteriophages", "Phage Therapy", "Oncolytic Viruses", "Oncolytic Virotherapy", "Genetic Vectors"), hint: "Phage therapy, oncolytic viruses, viral vectors" },
  { id: "synthetic", label: "Synthetic drugs", icon: "🧪", query: kw("Pharmaceutical Preparations", "Drug Therapy", "Small Molecule Libraries", "Antineoplastic Agents", "Anti-Bacterial Agents", "Drug Design"), hint: "Lab-made medicines and chemotherapy" },
  { id: "biologic", label: "Biologics", icon: "🧬", query: kw("Biological Products", "Vaccines", "Immunotherapy", "Antibodies, Monoclonal", "Genetic Therapy", "Cell- and Tissue-Based Therapy", "Stem Cells"), hint: "Antibodies, vaccines, gene and cell therapy" },
  { id: "mineral", label: "Minerals & metals", icon: "🪨", query: kw("Metals", "Nanoparticles", "Metal Nanoparticles", "Minerals", "Trace Elements", "Clay"), hint: "Nanoparticles, metal compounds, Rasa Shastra" },
  { id: "diet", label: "Diet & lifestyle", icon: "🥗", query: kw("Diet", "Exercise", "Yoga", "Nutrition Therapy", "Dietary Supplements", "Meditation", "Life Style"), hint: "Food, nutrition, yoga, exercise" },
  { id: "nondrug", label: "Non-drug", icon: "⚙️", query: kw("Surgical Procedures, Operative", "Radiotherapy", "Equipment and Supplies", "Physical Therapy Modalities", "Acupuncture Therapy"), hint: "Surgery, radiation, devices, physiotherapy" },
];

/** Filter 2 – type of study */
export const STUDY_TYPES: Filter[] = [
  { id: "review", label: "Review", icon: "📚", query: `(PUB_TYPE:"Review" AND NOT PUB_TYPE:"Systematic Review")` },
  { id: "sysrev", label: "Systematic review / Meta-analysis", icon: "📊", query: `(PUB_TYPE:"Systematic Review" OR PUB_TYPE:"Meta-Analysis")` },
  { id: "trial", label: "Clinical trial (human)", icon: "🧑‍⚕️", query: `(PUB_TYPE:"Clinical Trial" OR PUB_TYPE:"Randomized Controlled Trial" OR PUB_TYPE:"Clinical Trial, Phase II" OR PUB_TYPE:"Clinical Trial, Phase III" OR PUB_TYPE:"Controlled Clinical Trial")` },
  { id: "invivo", label: "Animal study (in vivo)", icon: "🐁", query: kw("Disease Models, Animal", "Mice", "Rats", "Animals, Laboratory", "Mice, Inbred BALB C", "Rats, Wistar") },
  { id: "invitro", label: "Lab study (in vitro)", icon: "🔬", query: kw("In Vitro Techniques", "Cell Line, Tumor", "Cell Line", "Cells, Cultured", "Microbial Sensitivity Tests") },
  { id: "insilico", label: "Computer study (in silico)", icon: "💻", query: kw("Molecular Docking Simulation", "Computer Simulation", "Computational Biology", "Molecular Dynamics Simulation", "Machine Learning") },
  { id: "case", label: "Case report", icon: "📋", query: `PUB_TYPE:"Case Reports"` },
  { id: "field", label: "Field trial", icon: "🌾", query: `("field trial" OR "field experiment" OR "field study" OR "field conditions")` },
];

/** Filter 3 – research stage (ordered from traditional knowledge to approved medicine) */
export const STAGES: Filter[] = [
  { id: "traditional", label: "Traditional use recorded", icon: "📜", query: kw("Medicine, Traditional", "Ethnobotany", "Ethnopharmacology", "Medicine, Ayurvedic", "Medicine, East Asian Traditional", "Medicine, Unani") },
  { id: "isolated", label: "Compound isolated", icon: "⚗️", query: `(KW:"Chemical Fractionation" OR KW:"Chromatography, High Pressure Liquid" OR KW:"Magnetic Resonance Spectroscopy" OR "isolated" OR "isolation and characterization")` },
  { id: "lab", label: "Lab tested", icon: "🔬", query: kw("In Vitro Techniques", "Cell Line, Tumor", "Cells, Cultured", "Microbial Sensitivity Tests") },
  { id: "animal", label: "Tested in animals", icon: "🐁", query: kw("Disease Models, Animal", "Mice", "Rats") },
  { id: "human", label: "Tested in humans", icon: "🧑‍⚕️", query: `(PUB_TYPE:"Clinical Trial" OR PUB_TYPE:"Randomized Controlled Trial" OR KW:"Clinical Trials as Topic" OR KW:"Treatment Outcome")` },
  { id: "approved", label: "Approved medicine", icon: "✅", query: `(KW:"Drug Approval" OR KW:"United States Food and Drug Administration" OR "FDA-approved" OR "approved drug")` },
];

export const YEARS: Filter[] = [
  { id: "y1", label: "Last year", icon: "", query: "" },
  { id: "y5", label: "Last 5 years", icon: "", query: "" },
  { id: "y10", label: "Last 10 years", icon: "", query: "" },
];

export function yearQuery(id: string, now = new Date().getFullYear()): string {
  const span = id === "y1" ? 1 : id === "y5" ? 5 : id === "y10" ? 10 : 0;
  return span ? `PUB_YEAR:[${now - span} TO ${now}]` : "";
}

export const COUNTRIES = ["India", "United States", "China", "United Kingdom", "Japan", "Germany", "Brazil", "Iran", "Pakistan", "Bangladesh", "Nigeria", "South Africa", "Australia", "Egypt", "Italy", "Spain", "France", "South Korea", "Malaysia", "Indonesia", "Thailand", "Sri Lanka", "Nepal", "Saudi Arabia", "Turkey", "Mexico", "Canada", "Netherlands"];

export type Selection = {
  sources: string[];
  studies: string[];
  stages: string[];
  year?: string;
  country?: string;
  open?: boolean;
  organism?: string;
};

function or(fs: Filter[], ids: string[]): string {
  const q = fs.filter((f) => ids.includes(f.id)).map((f) => f.query);
  return q.length ? "(" + q.join(" OR ") + ")" : "";
}

/** Builds the full Europe PMC query for a disease plus the selected filters. */
export function buildQuery(disease: string, sel: Selection): string {
  const parts = [disease];
  const s = or(SOURCES, sel.sources);
  const t = or(STUDY_TYPES, sel.studies);
  const g = or(STAGES, sel.stages);
  if (s) parts.push(s);
  if (t) parts.push(t);
  if (g) parts.push(g);
  if (sel.year) parts.push(yearQuery(sel.year));
  if (sel.country) parts.push(`AFF:"${sel.country.replace(/"/g, "")}"`);
  if (sel.open) parts.push("OPEN_ACCESS:y");
  if (sel.organism) parts.push(`(${sel.organism.replace(/[^\w\s\-.]/g, "")})`);
  return parts.filter(Boolean).join(" AND ");
}
