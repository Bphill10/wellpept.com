/**
 * Research quality notes for the Wellpept lab bench.
 * Educational framing only — for laboratory research use, not medical advice.
 */

export const RESEARCH_GLOSSARY = [
  {
    term: "API",
    def: "Active pharmaceutical ingredient — the intended peptide in the vial (e.g. tirzepatide), separate from fillers used for lyophilization.",
  },
  {
    term: "BAC water",
    def: "Bacteriostatic water (typically 0.9% benzyl alcohol) used to reconstitute lyophilized research peptides and limit bacterial growth in solution.",
  },
  {
    term: "COA",
    def: "Certificate of Analysis — usually HPLC-based purity and quantity reporting. Prefer third-party labs over vendor-only paperwork when possible.",
  },
  {
    term: "HPLC",
    def: "High-performance liquid chromatography — confirms the expected peptide peak, estimates purity, and can quantify mass fill (mg of API per vial).",
  },
  {
    term: "Mass fill",
    def: "How much API is actually in the vial versus the labeled strength. Research teams often treat roughly ±10–15% as a practical acceptance band.",
  },
  {
    term: "Lyophilized cake",
    def: "Freeze-dried peptide form (loose powder or puck). Both can be normal; wet, sticky, yellowed, or particulate cakes are red flags before assay work.",
  },
  {
    term: "Deamidation",
    def: "Chemical change on asparagine/glutamine residues that can lower stability. Often reflected in HPLC purity as nearby degradation peaks.",
  },
  {
    term: "Endotoxin (LAL)",
    def: "Bacterial lipopolysaccharide contamination checked with LAL assays. Relevant for injectable research materials; can’t be filtered out after the fact.",
  },
  {
    term: "Counterion / TFA",
    def: "Salt form paired with the peptide. Trifluoroacetate (TFA) can remain from synthesis; NMR F-19 is used when labs want to screen for TFA.",
  },
  {
    term: "Kit",
    def: "Common wholesale pack: often 10 × 3 mL vials at the labeled mg each (e.g. a “30 mg kit” = ten 30 mg vials).",
  },
];

export const LYOPHILIZED_QC = {
  good: [
    "Uniform white lyophilized cake or powder (KLOW kits are intentionally blue)",
    "Looks dry — no wet sheen, sticky walls, or heavy crystallization",
    "After reconstitution: clear solution that dissolves without persistent cloudiness",
  ],
  caution: [
    "Yellowing, browning, or foreign particles in the dry cake (KLOW is intentionally blue)",
    "Wet, gummy, or thickly stuck powder — high residual moisture speeds degradation",
    "Reconstituted cloudiness, floaters, gelling/aggregation, or failure to dissolve",
  ],
  testing: [
    "HPLC for identity, purity (many labs target ≥98%), and mass fill",
    "LAL endotoxin when the assay path involves injectable research use",
    "Periodic counterion / residual-solvent spot checks (e.g. NMR F-19 for TFA) on long-running vendors",
  ],
};

export const GLP_CLASS_NOTES = {
  Tirzepatide:
    "Dual agonist at GIP and GLP-1 receptors — incretin-pathway research compound studied extensively in metabolic models. Kits are typically 10 vials of labeled mg each.",
  Semaglutide:
    "Selective GLP-1 receptor agonist in the incretin class — used in metabolic and appetite-pathway laboratory research.",
  Retatrutide:
    "Triple agonist engaging GLP-1, GIP, and glucagon pathways — metabolic and energy-balance research focus.",
  Liraglutide:
    "GLP-1 receptor agonist analogue — metabolic research applications with a shorter clinical half-life profile than semaglutide.",
};

/** Extra “what it’s for” lines keyed by normalized compound names. */
export const RESEARCH_HELP = {
  "BPC-157":
    "Helps labs study tissue signaling, gut-barrier models, and recovery-pathway assays.",
  "TB-500":
    "Used when the research question is actin remodeling, cell migration, or soft-tissue recovery biology.",
  "TB-4 (full sequence)":
    "Chosen for full-sequence thymosin β-4 work beyond the TB-500 fragment.",
  "GHK-Cu":
    "Supports skin, collagen, and gene-expression experiments — including cosmetic-biology assays.",
  Ipamorelin:
    "Helps probe pulsatile GH release with a relatively selective ghrelin-receptor profile.",
  "GHRP-6":
    "Used in GH-secretagogue and appetite-axis research where a stronger ghrelin-mimetic signal is wanted.",
  HGH:
    "For GH-receptor, growth, and metabolic pathway work that needs somatropin itself.",
  Tirzepatide:
    "Helps study dual GIP/GLP-1 incretin signaling in metabolic research models.",
  Semaglutide:
    "Used for GLP-1 pathway, glycemic, and appetite-biology research designs.",
  Retatrutide:
    "For multi-receptor metabolic research spanning GLP-1, GIP, and glucagon axes.",
  "MOTS-c":
    "Supports mitochondrial and metabolic-regulation experiments.",
  "SS-31":
    "Used in mitochondrial membrane and oxidative-stress research settings.",
  "Melanotan-2":
    "For melanocortin-receptor and pigmentation pathway research only.",
  HCG:
    "Helps reproductive-axis / LH-receptor laboratory designs.",
  "NAD+":
    "Core coenzyme for redox, energy, and aging-pathway bench work.",
  Glow:
    "Multi-pathway recovery/skin blend when labs want BPC, TB, and copper-peptide signals together.",
};

export function researchHelpFor(name) {
  if (!name) return "";
  if (RESEARCH_HELP[name]) return RESEARCH_HELP[name];
  const key = Object.keys(RESEARCH_HELP).find(
    (k) => k.toLowerCase() === String(name).toLowerCase()
  );
  if (key) return RESEARCH_HELP[key];
  const n = String(name).toUpperCase();
  if (/TIRZ/.test(n)) return RESEARCH_HELP.Tirzepatide;
  if (/SEMA/.test(n) && !/SEMAX|SELANK/.test(n)) return RESEARCH_HELP.Semaglutide;
  if (/RETA/.test(n)) return RESEARCH_HELP.Retatrutide;
  if (/BPC/.test(n)) return RESEARCH_HELP["BPC-157"];
  if (/GHK/.test(n)) return RESEARCH_HELP["GHK-Cu"];
  if (/MOTS/.test(n)) return RESEARCH_HELP["MOTS-c"];
  if (/SS-?31/.test(n)) return RESEARCH_HELP["SS-31"];
  return "Review peer-reviewed literature for your specific assay before committing inventory.";
}
