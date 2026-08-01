/**
 * Site-specific legal language.
 * WellPept (/) = cosmetic Renew only.
 * Undisclosed (/undisclosed) = laboratory research only.
 * Never mix the two on the wrong shell.
 */

/** Public WellPept Renew — cosmetic skincare. */
export const WELLPEPT_COSMETIC_LEGAL = {
  short:
    "For external cosmetic use only. Not for injection, ingestion, or medical use. Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease.",
  medium:
    "WellPept Renew products are cosmetic skincare for external use on intact skin only. They are not drugs, not sterile injectables, and not for compounding into injectable preparations. Keep out of reach of children. Discontinue if irritation occurs. Consult a qualified professional if you are pregnant, nursing, or under medical care.",
  long: [
    "COSMETIC USE ONLY. External application on intact skin. Not for injection, IV, IM, SQ, oral, nasal, ocular (unless labeled as an eye serum for periocular skin), or any other route.",
    "NOT A DRUG. These products are not intended to diagnose, treat, cure, or prevent any disease. No therapeutic or medical claims are made.",
    "NOT FDA EVALUATED. Statements have not been evaluated by the U.S. Food and Drug Administration.",
    "NOT FOR RESEARCH OR CLINICAL COMPOUNDING. Do not use as a starting material for sterile compounding, pharmacy preparations, or laboratory assays.",
    "FRESH ACTIVATION. Key actives are sealed separately to limit shelf degradation. Once mixed into the base, use within the stated window and refrigerate when directed. Results after activation are not guaranteed beyond labeled guidance.",
    "ASSUMPTION OF RISK. By purchasing you confirm you understand cosmetic actives may cause irritation or sensitization, will follow mix instructions, and will not misuse these products.",
    "AGE AND JURISDICTION. You must be 18+ and purchasing for lawful personal cosmetic use in the United States. Void where prohibited.",
  ],
  ageGate:
    "You must be 18 or older to enter this site. WellPept products are for adults for personal cosmetic use on intact skin only — not for injection, ingestion, or medical use.",
  signupAck:
    "I confirm I am 18 years of age or older. WellPept products are for personal cosmetic use on intact skin only — not for injection, ingestion, or medical use.",
  cartTitle: "Cosmetic use acknowledgment",
  cartCheckbox:
    "I am 18+, ordering for personal cosmetic use only. I understand these products are for external use on intact skin — not for injection, ingestion, or medical use.",
  authFooter:
    "By continuing you agree to WellPept Renew product notices (cosmetic use on intact skin only).",
  footer:
    "WellPept Renew is cosmetic skincare for external use on intact skin only. Not for injection, ingestion, or medical use. Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease. Ships to United States addresses only.",
  orderMapCaution:
    "Please save this order map. Invoice / card descriptors use WellPept Renew item names. The map below is your confirmation of what you requested after placing this order. Keep it for your records.",
};

/** Undisclosed — laboratory research catalog. */
export const UNDISCLOSED_LEGAL = {
  short:
    "For laboratory research use only. Not for human consumption, medical use, injection, or household purposes. Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease.",
  medium:
    "Undisclosed (brought to you by WellPept) offers materials for laboratory research use only. These are not drugs, not cosmetics, not dietary supplements, and not for human or animal use. Review COAs and handle according to your institutional protocols.",
  long: [
    "RESEARCH USE ONLY. Intended solely for laboratory research and in-vitro / analytical work by qualified adults. Not for human consumption, clinical use, veterinary use, or household purposes.",
    "NOT A DRUG OR COSMETIC. No therapeutic, diagnostic, or cosmetic claims are made. Not for compounding into preparations intended for human use.",
    "NOT FDA EVALUATED. Statements have not been evaluated by the U.S. Food and Drug Administration.",
    "HANDLING. Follow your lab’s SOPs for receipt, storage, reconstitution, and disposal. Verify identity and purity (e.g. COA) before use in any assay.",
    "DOSE RANGES. Any mass or volume figures shown are for lab convenience and calculation only — not medical dosing guidance.",
    "ASSUMPTION OF RISK. By ordering you confirm you are 18+, understand these materials are for research only, and will not misuse them.",
    "AGE AND JURISDICTION. You must be 18+ and purchasing for lawful laboratory research purposes in the United States. Void where prohibited.",
  ],
  ageGate:
    "You must be 18 or older to enter Undisclosed. Materials here are for laboratory research use only — not for human consumption, medical use, injection, or household purposes.",
  signupAck:
    "I confirm I am 18 years of age or older. I understand Undisclosed materials are for laboratory research use only — not for human consumption, medical use, or household purposes.",
  cartTitle: "Research use acknowledgment",
  cartCheckbox:
    "I am 18+, ordering for laboratory research use only. I understand these materials are not for human consumption, medical use, injection, or household purposes.",
  authFooter:
    "By continuing you agree to Undisclosed research-use notices (laboratory research only — not for human use).",
  footer:
    "Undisclosed is brought to you by WellPept. Items are for laboratory research use only. Not for human consumption, medical use, or household purposes. Ships to United States addresses only.",
  orderMapCaution:
    "Please save this order map. Payment descriptors may use alternate WellPept product names. The map below confirms the research materials you requested after placing this order. Keep it for your records. Research use only — not for human consumption.",
};

/** @deprecated Prefer WELLPEPT_COSMETIC_LEGAL — kept for existing skincare imports. */
export const PEPTIDE_LEGAL = WELLPEPT_COSMETIC_LEGAL;

export function siteLegal(labMode = false) {
  return labMode ? UNDISCLOSED_LEGAL : WELLPEPT_COSMETIC_LEGAL;
}
