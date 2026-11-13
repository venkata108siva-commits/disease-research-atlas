// Unified disease catalogue: MeSH (official, NLM) for human and animal diseases plus the MeSH
// plant-disease subtree, and curated lists for plant diseases and agriculture problems.
import meshRaw from "@/data/mesh.json";
import plantRaw from "@/data/plant.json";
import agriRaw from "@/data/agri.json";

export type Domain = "human" | "animal" | "plant" | "agri";

export type Node = {
  id: string;
  domain: Domain;
  name: string;
  syn: string[];
  note: string;
  query: string; // Europe PMC query for this disease
  source: "MeSH" | "Curated";
  animal?: boolean; // also listed under Animal diseases (MeSH C22)
  ui?: string; // MeSH unique ID (D000000)
  children: string[];
  parents: string[];
};

type MeshNode = { ui: string; name: string; syn: string[]; note: string; tree: string[]; children: string[]; parents: string[] };
type Curated = { name: string; note: string; groups: { name: string; query: string; items: { name: string; query: string; syn?: string[] }[] }[] };

const mesh = meshRaw as { built: string; roots: string[]; nodes: Record<string, MeshNode> };

export const DOMAINS: { id: Domain; label: string; sub: string; roots: string[] }[] = [
  { id: "human", label: "Human diseases", sub: "Official MeSH classification · 4,800+ diseases", roots: [] },
  { id: "animal", label: "Animal diseases", sub: "Veterinary diseases · MeSH classification", roots: [] },
  { id: "plant", label: "Plant diseases", sub: "By causal agent: fungal, bacterial, viral, nematode…", roots: [] },
  { id: "agri", label: "Agriculture problems", sub: "Stress, soil, pests, water, climate, post-harvest", roots: [] },
];

export const NODES: Record<string, Node> = {};
const NAME_INDEX: { id: string; text: string }[] = [];

const meshQuery = (name: string) => `KW:"${name.replace(/"/g, "")}"`;

// Classify each MeSH node by tree number: C22 = animal diseases; Plant Diseases subtree is separate.
const plantRootUid = Object.keys(mesh.nodes).find((k) => mesh.nodes[k].name === "Plant Diseases");
const plantSet = new Set<string>();
(function walk(id: string) {
  if (!id || plantSet.has(id)) return;
  plantSet.add(id);
  for (const c of mesh.nodes[id]?.children || []) walk(c);
})(plantRootUid || "");

for (const [uid, n] of Object.entries(mesh.nodes)) {
  const isAnimal = n.tree.some((t) => t.startsWith("C22"));
  const isPlant = plantSet.has(uid);
  const onlyAnimal = isAnimal && n.tree.every((t) => t.startsWith("C22"));
  const id = `m${uid}`;
  const domain: Domain = isPlant ? "plant" : onlyAnimal ? "animal" : "human";
  NODES[id] = {
    id,
    domain,
    name: n.name,
    syn: n.syn,
    note: n.note,
    query: meshQuery(n.name),
    source: "MeSH",
    animal: isAnimal,
    ui: n.ui,
    children: n.children.map((c) => `m${c}`),
    parents: n.parents.map((c) => `m${c}`),
  };
  // Nodes that sit in both human and animal trees are listed under human and also reachable from animal.
  if (isAnimal && !onlyAnimal) NODES[id].domain = "human";
}

// Domain roots from MeSH
const meshRootIds = mesh.roots.map((r) => `m${r}`);
for (const d of DOMAINS) {
  if (d.id === "human") d.roots = meshRootIds.filter((r) => NODES[r] && !["Animal Diseases", "Plant Diseases"].includes(NODES[r].name)).sort((a, b) => NODES[a].name.localeCompare(NODES[b].name));
  if (d.id === "animal") d.roots = meshRootIds.filter((r) => NODES[r]?.name === "Animal Diseases").flatMap((r) => NODES[r].children).sort((a, b) => NODES[a].name.localeCompare(NODES[b].name));
}

// Curated lists
function addCurated(domain: Domain, data: Curated, prefix: string) {
  const roots: string[] = [];
  data.groups.forEach((g, gi) => {
    const gid = `${prefix}${gi}`;
    const kids: string[] = [];
    g.items.forEach((it, ii) => {
      const id = `${gid}_${ii}`;
      NODES[id] = { id, domain, name: it.name, syn: it.syn || [], note: "", query: it.query, source: "Curated", children: [], parents: [gid] };
      kids.push(id);
    });
    NODES[gid] = { id: gid, domain, name: g.name, syn: [], note: "", query: g.query, source: "Curated", children: kids, parents: [] };
    roots.push(gid);
  });
  return roots;
}
const plantRoots = addCurated("plant", plantRaw as Curated, "p");
const agriRoots = addCurated("agri", agriRaw as Curated, "a");
DOMAINS.find((d) => d.id === "plant")!.roots = [...plantRoots, ...(plantRootUid ? [`m${plantRootUid}`] : [])];
DOMAINS.find((d) => d.id === "agri")!.roots = agriRoots;

for (const n of Object.values(NODES)) NAME_INDEX.push({ id: n.id, text: [n.name, ...n.syn].join(" | ").toLowerCase() });

export function getNode(id: string): Node | undefined {
  return NODES[id];
}

export function breadcrumbs(id: string): Node[] {
  const out: Node[] = [];
  let cur = NODES[id];
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.parents.length ? NODES[cur.parents[0]] : (undefined as any);
    if (out.length > 12) break;
  }
  return out;
}

export function search(q: string, domain?: Domain, limit = 25): Node[] {
  const s = q.trim().toLowerCase();
  if (s.length < 2) return [];
  const scored: { n: Node; score: number }[] = [];
  for (const e of NAME_INDEX) {
    const n = NODES[e.id];
    if (domain && !inDomain(n, domain)) continue;
    const name = n.name.toLowerCase();
    let score = -1;
    if (name === s) score = 0;
    else if (name.startsWith(s)) score = 1;
    else if (n.syn.some((x) => x.toLowerCase() === s)) score = 0.5;
    else if (n.syn.some((x) => x.toLowerCase().startsWith(s))) score = 2;
    else if (name.includes(s)) score = 3;
    else if (e.text.includes(s)) score = 4;
    if (score >= 0) scored.push({ n, score: score + Math.min(n.name.length, 60) / 100 - (n.children.length ? 0.2 : 0) });
  }
  return scored.sort((a, b) => a.score - b.score).slice(0, limit).map((x) => x.n);
}

export function inDomain(n: Node, domain: Domain): boolean {
  return n.domain === domain || (domain === "animal" && !!n.animal);
}

export function countDomain(domain: Domain): number {
  return Object.values(NODES).filter((n) => inDomain(n, domain)).length;
}

export const MESH_BUILT = mesh.built;
