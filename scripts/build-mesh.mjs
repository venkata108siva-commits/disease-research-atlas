// Builds data/mesh.json: the MeSH disease tree (categories C01–C26 incl. Animal Diseases, plus Plant Diseases)
// from NLM E-utilities. Run: node scripts/build-mesh.mjs
import fs from "node:fs";
const E = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOTS = ["Infections","Neoplasms","Musculoskeletal Diseases","Digestive System Diseases","Stomatognathic Diseases","Respiratory Tract Diseases","Otorhinolaryngologic Diseases","Nervous System Diseases","Eye Diseases","Urogenital Diseases","Cardiovascular Diseases","Hemic and Lymphatic Diseases","Congenital, Hereditary, and Neonatal Diseases and Abnormalities","Skin and Connective Tissue Diseases","Nutritional and Metabolic Diseases","Endocrine System Diseases","Immune System Diseases","Disorders of Environmental Origin","Animal Diseases","Pathological Conditions, Signs and Symptoms","Occupational Diseases","Chemically-Induced Disorders","Wounds and Injuries","Plant Diseases"];
const py = (s) => { if (Array.isArray(s)) return s; try { return JSON.parse(String(s).replace(/'/g, '"')); } catch { return []; } };
async function get(url) { for (let t = 0; t < 6; t++) { try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {} await sleep(1500 * (t + 1)); } throw new Error(url); }
const nodes = {}; const seen = new Set(); const queue = [];
const prefixes = new Set(["C"]);
for (const name of ROOTS) {
  const j = await get(`${E}/esearch.fcgi?db=mesh&term=${encodeURIComponent(`"${name}"[MeSH Terms]`)}&retmode=json&tool=atlas`);
  const id = j.esearchresult.idlist[0];
  if (id && !seen.has(id)) { seen.add(id); queue.push(id); }
  await sleep(350);
}
while (queue.length) {
  const batch = queue.splice(0, 150);
  const res = await get(`${E}/esummary.fcgi?db=mesh&id=${batch.join(",")}&retmode=json&tool=atlas`);
  for (const id of batch) {
    const d = res.result?.[id]; if (!d || d.error) continue;
    const links = py(d.ds_idxlinks); const terms = py(d.ds_meshterms);
    if (terms[0] === "Plant Diseases") for (const l of links) prefixes.add(String(l.treenum));
    const node = { ui: d.ds_meshui, name: terms[0] || "", syn: terms.slice(1, 16), note: String(d.ds_scopenote || "").slice(0, 300), tree: [], children: [], parents: [] };
    for (const l of links) {
      const t = String(l.treenum || "");
      if (![...prefixes].some((p) => t.startsWith(p))) continue;
      node.tree.push(t);
      if (l.parent) node.parents.push(String(l.parent));
      for (const ch of l.children || []) { const c = String(ch); node.children.push(c); if (!seen.has(c)) { seen.add(c); queue.push(c); } }
    }
    if (!node.tree.length) continue;
    node.children = [...new Set(node.children)]; node.parents = [...new Set(node.parents)];
    nodes[id] = node;
  }
  process.stdout.write(`\r${Object.keys(nodes).length} terms, ${queue.length} queued   `);
  await sleep(400);
}
for (const n of Object.values(nodes)) { n.children = n.children.filter((c) => nodes[c]); n.parents = n.parents.filter((c) => nodes[c]); }
const rootIds = Object.keys(nodes).filter((id) => ROOTS.includes(nodes[id].name));
fs.writeFileSync("data/mesh.json", JSON.stringify({ built: new Date().toISOString().slice(0, 10), roots: rootIds, nodes }));
console.log(`\nSaved ${Object.keys(nodes).length} disease terms, ${rootIds.length} roots`);
