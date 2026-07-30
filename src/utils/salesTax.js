/**
 * Estimated US destination sales tax by state.
 * Rates are approximate combined state+average local averages for quoting.
 * Not a substitute for a full tax engine (Avalara/TaxJar) later.
 */

export const US_STATES = [
  { code: "AL", name: "Alabama", rate: 0.0929 },
  { code: "AK", name: "Alaska", rate: 0.0176 },
  { code: "AZ", name: "Arizona", rate: 0.084 },
  { code: "AR", name: "Arkansas", rate: 0.0947 },
  { code: "CA", name: "California", rate: 0.0879 },
  { code: "CO", name: "Colorado", rate: 0.0777 },
  { code: "CT", name: "Connecticut", rate: 0.0635 },
  { code: "DE", name: "Delaware", rate: 0 },
  { code: "DC", name: "District of Columbia", rate: 0.06 },
  { code: "FL", name: "Florida", rate: 0.0708 },
  { code: "GA", name: "Georgia", rate: 0.0735 },
  { code: "HI", name: "Hawaii", rate: 0.0444 },
  { code: "ID", name: "Idaho", rate: 0.0603 },
  { code: "IL", name: "Illinois", rate: 0.0886 },
  { code: "IN", name: "Indiana", rate: 0.07 },
  { code: "IA", name: "Iowa", rate: 0.0694 },
  { code: "KS", name: "Kansas", rate: 0.0869 },
  { code: "KY", name: "Kentucky", rate: 0.06 },
  { code: "LA", name: "Louisiana", rate: 0.0955 },
  { code: "ME", name: "Maine", rate: 0.055 },
  { code: "MD", name: "Maryland", rate: 0.06 },
  { code: "MA", name: "Massachusetts", rate: 0.0625 },
  { code: "MI", name: "Michigan", rate: 0.06 },
  { code: "MN", name: "Minnesota", rate: 0.0749 },
  { code: "MS", name: "Mississippi", rate: 0.0707 },
  { code: "MO", name: "Missouri", rate: 0.0825 },
  { code: "MT", name: "Montana", rate: 0 },
  { code: "NE", name: "Nebraska", rate: 0.0694 },
  { code: "NV", name: "Nevada", rate: 0.0823 },
  { code: "NH", name: "New Hampshire", rate: 0 },
  { code: "NJ", name: "New Jersey", rate: 0.066 },
  { code: "NM", name: "New Mexico", rate: 0.0783 },
  { code: "NY", name: "New York", rate: 0.0852 },
  { code: "NC", name: "North Carolina", rate: 0.0698 },
  { code: "ND", name: "North Dakota", rate: 0.0696 },
  { code: "OH", name: "Ohio", rate: 0.0723 },
  { code: "OK", name: "Oklahoma", rate: 0.0899 },
  { code: "OR", name: "Oregon", rate: 0 },
  { code: "PA", name: "Pennsylvania", rate: 0.0634 },
  { code: "RI", name: "Rhode Island", rate: 0.07 },
  { code: "SC", name: "South Carolina", rate: 0.0746 },
  { code: "SD", name: "South Dakota", rate: 0.0611 },
  { code: "TN", name: "Tennessee", rate: 0.0955 },
  { code: "TX", name: "Texas", rate: 0.082 },
  { code: "UT", name: "Utah", rate: 0.0719 },
  { code: "VT", name: "Vermont", rate: 0.0624 },
  { code: "VA", name: "Virginia", rate: 0.0575 },
  { code: "WA", name: "Washington", rate: 0.0929 },
  { code: "WV", name: "West Virginia", rate: 0.0655 },
  { code: "WI", name: "Wisconsin", rate: 0.0543 },
  { code: "WY", name: "Wyoming", rate: 0.0536 },
];

const BY_CODE = Object.fromEntries(US_STATES.map((s) => [s.code, s]));

export function normalizeStateCode(raw = "") {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}

export function isValidUsState(raw) {
  const code = normalizeStateCode(raw);
  return Boolean(BY_CODE[code]);
}

export function getStateTaxInfo(raw) {
  const code = normalizeStateCode(raw);
  return BY_CODE[code] || null;
}

/**
 * Tax merchandise after discount. Shipping is not taxed in this estimate.
 * Returns { state, rate, amount, taxable, label }
 */
export function calcSalesTax({
  subtotal = 0,
  discount = 0,
  state = "",
} = {}) {
  const info = getStateTaxInfo(state);
  const taxable = Math.max(0, Number(subtotal) || 0) - Math.max(0, Number(discount) || 0);
  const base = Math.max(0, taxable);
  if (!info) {
    return {
      state: normalizeStateCode(state),
      rate: 0,
      amount: 0,
      taxable: base,
      label: "",
      ok: false,
    };
  }
  const amount = Math.round(base * info.rate * 100) / 100;
  const pct = (info.rate * 100).toFixed(2).replace(/\.?0+$/, "");
  return {
    state: info.code,
    rate: info.rate,
    amount,
    taxable: base,
    label: info.rate > 0 ? `${info.code} tax (~${pct}%)` : `${info.code} (no state sales tax)`,
    ok: true,
  };
}
