# Disease Research Atlas

Browse every human, animal and plant disease and agricultural problem, then filter the peer-reviewed research on it by **where the treatment comes from** (plants, fungi, bacteria, endophytes, animals, insects, marine, viruses, synthetic drugs, biologics, minerals, diet, non-drug), study type, research stage, year, country and open access.

**Live:** https://disease-research-atlas.vercel.app

## Verified data only
- Disease classification: **NLM Medical Subject Headings (MeSH)**, 5,000+ terms with sub-types (`scripts/build-mesh.mjs` rebuilds `data/mesh.json`).
- Plant diseases and agriculture problems: curated lists following standard plant-pathology and agronomy categories (`data/plant.json`, `data/agri.json`).
- Papers: **Europe PMC** (PubMed/MEDLINE and more). Every result links to the original paper, PubMed and Europe PMC, and each search can be re-run on PubMed and Europe PMC with one click.
- No AI-generated content. Counts are live from Europe PMC.

## Run locally
```bash
npm install
npm run dev
```
No API keys needed.

## Rebuild the MeSH disease list
```bash
node scripts/build-mesh.mjs
```
