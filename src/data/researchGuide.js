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
    def: "Certificate of Analysis — usually HPLC-based purity and quantity reporting. Prefer independent third-party labs when possible.",
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
    term: "Dose range (label)",
    def: "Suggested low–high research amount printed on some Undisclosed wraps (often dose → ~2×, framed as 10–20 syringe units). Generated from Undisclosed reconstitution defaults for lab convenience — not COA data, not manufacturer labeling, and not medical advice.",
  },
  {
    term: "Kit",
    def: "Common wholesale pack: often 10 × 3 mL vials at the labeled mg each (e.g. a “30 mg kit” = ten 30 mg vials).",
  },
];

export const LYOPHILIZED_QC = {
  good: [
    "Uniform white lyophilized cake or powder (KLOW, GLOW, and GHK-Cu kits are intentionally blue)",
    "Looks dry — no wet sheen, sticky walls, or heavy crystallization",
    "After reconstitution: clear solution that dissolves without persistent cloudiness",
  ],
  caution: [
    "Yellowing, browning, or foreign particles in the dry cake (KLOW, GLOW, and GHK-Cu are intentionally blue)",
    "Wet, gummy, or thickly stuck powder — high residual moisture speeds degradation",
    "Reconstituted cloudiness, floaters, gelling/aggregation, or failure to dissolve",
  ],
  testing: [
    "HPLC for identity, purity (many labs target ≥98%), and mass fill",
    "LAL endotoxin when the assay path involves injectable research use",
    "Periodic counterion / residual-solvent spot checks (e.g. NMR F-19 for TFA) on long-running supply lines",
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
    "Investigated in preclinical tissue-signaling, angiogenesis, and gastrointestinal barrier models.",
  "TB-500":
    "Thymosin β-4 fragment studied in actin remodeling, cell migration, and tissue-repair models.",
  "TB-4 (full sequence)":
    "Chosen for full-sequence thymosin β-4 work beyond the TB-500 fragment.",
  "GHK-Cu":
    "Copper-binding tripeptide investigated in extracellular-matrix, collagen, wound, and gene-expression models.",
  KLOW:
    "Multi-compound blend intended for comparative inflammation, barrier-signaling, and tissue-repair research.",
  GLOW:
    "Multi-compound blend used in skin, extracellular-matrix, and tissue-repair research models.",
  Tesamorelin:
    "GHRH-receptor agonist analogue used to study pulsatile growth-hormone and downstream IGF-1 signaling.",
  Ipamorelin:
    "Ghrelin-receptor agonist investigated for relatively selective pulsatile growth-hormone signaling.",
  "CJC-1295":
    "GHRH analogue used to investigate growth-hormone release and downstream IGF-1 pathway activity.",
  "CJC-1295 / Ipamorelin":
    "Combination model pairing GHRH-receptor and ghrelin-receptor signaling in growth-hormone pathway research.",
  "GHRP-6":
    "Used in GH-secretagogue and appetite-axis research where a stronger ghrelin-mimetic signal is wanted.",
  HGH:
    "Somatropin used in growth-hormone receptor, IGF-1, growth, and metabolic signaling research.",
  Tirzepatide:
    "Dual GIP/GLP-1 receptor agonist investigated in incretin, glucose-regulation, and energy-balance models.",
  Semaglutide:
    "Selective GLP-1 receptor agonist studied in incretin, glucose-regulation, and appetite-signaling models.",
  Retatrutide:
    "Triple GLP-1/GIP/glucagon receptor agonist studied in metabolic and energy-expenditure models.",
  Cagrilintide:
    "Long-acting amylin analogue investigated in satiety, gastric-emptying, and energy-balance models.",
  "MOTS-c":
    "Mitochondrial-derived peptide investigated in cellular energy sensing, metabolism, and stress-response models.",
  "SS-31":
    "Mitochondria-targeting tetrapeptide studied in cardiolipin, membrane energetics, and oxidative-stress models.",
  Epithalon:
    "Synthetic tetrapeptide investigated in cellular-aging, circadian, and telomere-related preclinical models.",
  Semax:
    "ACTH-derived peptide analogue studied in neurotrophic signaling, cognition, and ischemia-related preclinical models.",
  Selank:
    "Tuftsin-derived peptide investigated in neuroimmune signaling, stress-response, and cognition models.",
  Glutathione:
    "Endogenous tripeptide central to redox buffering, oxidative-stress, and cellular detoxification research.",
  "PT-141":
    "Melanocortin receptor agonist investigated in central melanocortin and behavioral signaling models.",
  "Thymosin Alpha-1":
    "Thymic peptide investigated in innate/adaptive immune signaling and host-response models.",
  KPV:
    "α-MSH-derived tripeptide studied in inflammatory signaling, epithelial barrier, and microbiome-related models.",
  "ARA-290":
    "Non-erythropoietic EPO-derived peptide investigated in tissue-protective receptor and inflammatory models.",
  "FOX04-DRI":
    "Cell-penetrating research peptide used to study FOXO4–p53 interactions and senescent-cell biology.",
  DSIP:
    "Experimental neuropeptide investigated in sleep architecture, stress-response, and neuroendocrine models.",
  "Melanotan-2":
    "For melanocortin-receptor and pigmentation pathway research only.",
  HCG:
    "Helps reproductive-axis / LH-receptor laboratory designs.",
  "NAD+":
    "Core redox coenzyme investigated in cellular energy metabolism, DNA repair, and sirtuin-dependent signaling.",
  "Vitamin B12":
    "Cobalamin cofactor used in one-carbon metabolism, methylation, red-cell, and neurological pathway research.",
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
  if (/TB-?500/.test(n)) return RESEARCH_HELP["TB-500"];
  if (/GHK/.test(n)) return RESEARCH_HELP["GHK-Cu"];
  if (/KLOW/.test(n)) return RESEARCH_HELP.KLOW;
  if (/\bGLOW\b/.test(n)) return RESEARCH_HELP.GLOW;
  if (/TESA/.test(n)) return RESEARCH_HELP.Tesamorelin;
  if (/CJC/.test(n) && /IPA/.test(n)) return RESEARCH_HELP["CJC-1295 / Ipamorelin"];
  if (/CJC/.test(n)) return RESEARCH_HELP["CJC-1295"];
  if (/IPAMORELIN|\bIPA\b/.test(n)) return RESEARCH_HELP.Ipamorelin;
  if (/\bHGH\b|SOMATROPIN/.test(n)) return RESEARCH_HELP.HGH;
  if (/\bNAD\b/.test(n)) return RESEARCH_HELP["NAD+"];
  if (/MOTS/.test(n)) return RESEARCH_HELP["MOTS-c"];
  if (/EPITH|EPITAL/.test(n)) return RESEARCH_HELP.Epithalon;
  if (/SEMAX/.test(n) && !/SELANK/.test(n)) return RESEARCH_HELP.Semax;
  if (/SELANK/.test(n) && !/SEMAX/.test(n)) return RESEARCH_HELP.Selank;
  if (/GLUTATHIONE|GLUTA/.test(n)) return RESEARCH_HELP.Glutathione;
  if (/SS-?31/.test(n)) return RESEARCH_HELP["SS-31"];
  if (/PT-?141/.test(n)) return RESEARCH_HELP["PT-141"];
  if (/THYMOSIN ALPHA|TA-?1/.test(n)) return RESEARCH_HELP["Thymosin Alpha-1"];
  if (/\bKPV\b/.test(n)) return RESEARCH_HELP.KPV;
  if (/CAGRI/.test(n)) return RESEARCH_HELP.Cagrilintide;
  if (/ARA-?290|CIBINETIDE/.test(n)) return RESEARCH_HELP["ARA-290"];
  if (/FOX[O0]-?4|FOX0?4/.test(n)) return RESEARCH_HELP["FOX04-DRI"];
  if (/\bDSIP\b/.test(n)) return RESEARCH_HELP.DSIP;
  if (/\bB12\b|COBALAMIN/.test(n)) return RESEARCH_HELP["Vitamin B12"];
  return "Review peer-reviewed literature for your specific assay before committing inventory.";
}
