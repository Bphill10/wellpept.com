import * as XLSX from "xlsx";
import { guessCategory } from "../data/products";

const HEADER_ALIASES = {
  name: [
    "name",
    "product",
    "product name",
    "peptide",
    "item",
    "description",
    "compound",
  ],
  sku: ["sku", "code", "item code", "product code", "id"],
  mg: ["mg", "strength", "dose", "mass", "iu", "amount", "size"],
  vendorCost: [
    "price",
    "cost",
    "vendor cost",
    "unit price",
    "wholesale",
    "usd",
    "amount usd",
    "kit price",
    "your cost",
  ],
  form: ["form", "spec", "specification", "pack", "packaging", "notes"],
  purity: ["purity", "assay", "coa"],
  packVials: ["pack", "vials", "qty", "quantity", "kit"],
  vialMl: ["vial", "vial ml", "ml", "volume"],
};

function normHeader(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[$€£]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mapHeaders(row) {
  const map = {};
  row.forEach((cell, index) => {
    const h = normHeader(cell);
    if (!h) return;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (map[field] != null) continue;
      if (aliases.some((a) => h === a || h.includes(a))) {
        map[field] = index;
      }
    }
  });
  return map;
}

function parseMoney(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!s) return null;
  const n = Number(s[0]);
  return Number.isFinite(n) ? n : null;
}

function parseMgFromText(text) {
  const t = String(text || "");
  const iu = t.match(/(\d+(?:\.\d+)?)\s*iu\b/i);
  if (iu) return { mg: Number(iu[1]), unit: "IU" };
  const mg = t.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  if (mg) return { mg: Number(mg[1]), unit: "mg" };
  const mcg = t.match(/(\d+(?:\.\d+)?)\s*(?:mcg|ug)\b/i);
  if (mcg) return { mg: Number(mcg[1]) / 1000, unit: "mg" };
  return { mg: null, unit: "mg" };
}

function slugSku(name, mg) {
  const base = String(name || "ITEM")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 18);
  return mg ? `${base}-${mg}` : base || `ITEM-${Date.now().toString(36)}`;
}

function detectVialMl(text) {
  const t = String(text || "");
  if (/\b10\s*ml\b/i.test(t) || /\b10ml\b/i.test(t)) return "10";
  return "3";
}

function rowToLine(cells, headerMap, rowIndex) {
  const get = (field) => {
    const i = headerMap[field];
    return i == null ? "" : cells[i];
  };

  let name = String(get("name") || "").trim();
  let sku = String(get("sku") || "").trim();
  let form = String(get("form") || "").trim();
  let purity = String(get("purity") || "99%").trim() || "99%";
  let vendorCost = parseMoney(get("vendorCost"));
  let mgRaw = get("mg");
  let mg = parseMoney(mgRaw);
  let unit = /iu/i.test(String(mgRaw || "")) ? "IU" : "mg";

  // Fallback: treat first text-ish cell as name, last money-ish as cost
  if (!name || vendorCost == null) {
    const texts = cells
      .map((c, i) => ({ c, i, s: String(c ?? "").trim() }))
      .filter((x) => x.s);
    if (!name) {
      const nameCell = texts.find((x) => /[a-zA-Z]/.test(x.s) && !parseMoney(x.s));
      if (nameCell) name = nameCell.s;
    }
    if (vendorCost == null) {
      for (let i = texts.length - 1; i >= 0; i -= 1) {
        const money = parseMoney(texts[i].s);
        if (money != null && money > 0) {
          vendorCost = money;
          break;
        }
      }
    }
  }

  if (!name || vendorCost == null || vendorCost <= 0) return null;

  if (mg == null) {
    const parsed = parseMgFromText(`${name} ${form} ${mgRaw || ""}`);
    mg = parsed.mg;
    unit = parsed.unit;
  }

  const vialMl = detectVialMl(`${form} ${name}`);
  const packMatch = String(form || name).match(/(\d+)\s*(?:vials?|pack|kit)/i);
  const packVials = packMatch ? packMatch[1] : "10";

  if (!sku) sku = slugSku(name, mg || rowIndex + 1);
  if (!form) {
    form =
      mg != null
        ? `Lyophilized vial · ${mg}${unit === "IU" ? "IU" : "mg"}*${packVials}vials · ${vialMl}ml`
        : `Lyophilized vial · ${vialMl}ml`;
  } else if (!/\b\d+\s*ml\b/i.test(form)) {
    form = `${form} · ${vialMl}ml`;
  }

  return {
    sku: sku.toUpperCase(),
    name,
    form,
    purity,
    mg: mg != null ? String(mg) : "",
    vendorCost: String(vendorCost),
    category: guessCategory(name),
    vialMl,
  };
}

function rowsFromSheetMatrix(matrix) {
  if (!matrix?.length) return [];
  let headerMap = mapHeaders(matrix[0]);
  let start = 1;
  const mappedCount = Object.keys(headerMap).length;
  if (mappedCount < 2 || headerMap.name == null) {
    // No usable header — parse every row heuristically
    headerMap = {};
    start = 0;
  }

  const lines = [];
  for (let r = start; r < matrix.length; r += 1) {
    const row = matrix[r];
    if (!row || row.every((c) => c == null || String(c).trim() === "")) continue;
    const line = rowToLine(row, headerMap, r);
    if (line) lines.push(line);
  }
  return lines;
}

function parseDelimitedText(text) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim());
  if (!lines.length) return [];
  const delim = lines[0].includes("\t")
    ? "\t"
    : lines[0].split(",").length >= 2
      ? ","
      : null;
  if (!delim) return parseLooseText(text);
  const matrix = lines.map((line) =>
    line.split(delim).map((c) => c.replace(/^"|"$/g, "").trim())
  );
  return rowsFromSheetMatrix(matrix);
}

/** PDF / plain text: one product per line when possible. */
function parseLooseText(text) {
  const lines = [];
  const rawLines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    // Pattern: Name ... 10mg ... $80  OR  Name 10mg 80
    const money = line.match(/\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:usd|ea|each)?\s*$/i);
    if (!money) continue;
    const vendorCost = Number(money[1]);
    if (!(vendorCost > 0)) continue;
    const left = line.slice(0, money.index).trim().replace(/[-–—|:]+$/, "").trim();
    if (!left || left.length < 2) continue;
    if (/^(price|cost|total|subtotal|sku|product|name)$/i.test(left)) continue;

    const { mg, unit } = parseMgFromText(left);
    const vialMl = detectVialMl(left);
    const name = left
      .replace(/\b\d+(?:\.\d+)?\s*(?:mg|iu|mcg|ug|ml)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim() || left;

    lines.push({
      sku: slugSku(name, mg || i + 1),
      name,
      form:
        mg != null
          ? `Lyophilized vial · ${mg}${unit === "IU" ? "IU" : "mg"}*10vials · ${vialMl}ml`
          : `Lyophilized vial · ${vialMl}ml`,
      purity: "99%",
      mg: mg != null ? String(mg) : "",
      vendorCost: String(vendorCost),
      category: guessCategory(name),
      vialMl,
    });
  }
  return lines;
}

async function parseExcelArrayBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  return rowsFromSheetMatrix(matrix);
}

async function parsePdfArrayBuffer(buffer) {
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const chunks = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => it.str).join(" ");
    chunks.push(pageText);
    // Also keep line-ish breaks from Y positions when possible
    let lastY = null;
    let line = "";
    const lines = [];
    for (const item of content.items) {
      const y = item.transform?.[5];
      if (lastY != null && Math.abs(y - lastY) > 2) {
        if (line.trim()) lines.push(line.trim());
        line = item.str;
      } else {
        line += (line ? " " : "") + item.str;
      }
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    chunks.push(lines.join("\n"));
  }
  return parseLooseText(chunks.join("\n"));
}

/**
 * Parse a dropped/selected price list file into editable vendor lines.
 * Supports .xlsx .xls .csv .tsv .txt .pdf
 */
export async function parsePriceListFile(file) {
  const name = file.name || "upload";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const buffer = await file.arrayBuffer();

  let lines = [];
  let method = ext;

  if (["xlsx", "xls", "xlsm"].includes(ext)) {
    lines = await parseExcelArrayBuffer(buffer);
    method = "excel";
  } else if (ext === "csv" || ext === "tsv") {
    const text = new TextDecoder().decode(buffer);
    lines = parseDelimitedText(text);
    method = ext;
  } else if (ext === "pdf") {
    lines = await parsePdfArrayBuffer(buffer);
    method = "pdf";
  } else if (ext === "txt" || file.type?.startsWith("text/")) {
    const text = new TextDecoder().decode(buffer);
    lines = parseDelimitedText(text);
    method = "text";
  } else if (
    file.type?.includes("sheet") ||
    file.type?.includes("excel")
  ) {
    lines = await parseExcelArrayBuffer(buffer);
    method = "excel";
  } else if (file.type === "application/pdf") {
    lines = await parsePdfArrayBuffer(buffer);
    method = "pdf";
  } else {
    // Last resort: try excel then text
    try {
      lines = await parseExcelArrayBuffer(buffer);
      method = "excel-fallback";
    } catch {
      const text = new TextDecoder().decode(buffer);
      lines = parseDelimitedText(text);
      method = "text-fallback";
    }
  }

  // Dedupe by sku+name
  const seen = new Set();
  const unique = [];
  for (const line of lines) {
    const key = `${line.sku}|${line.name}|${line.mg}|${line.vendorCost}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(line);
  }

  return {
    fileName: name,
    method,
    lines: unique,
    count: unique.length,
  };
}

export async function parsePriceListText(text) {
  const lines = parseDelimitedText(text);
  return {
    fileName: "pasted-text",
    method: "paste",
    lines,
    count: lines.length,
  };
}
