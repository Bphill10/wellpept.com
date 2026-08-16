/**
 * Website-card typography for the B Front-focused wrap only.
 *
 * Mutates an in-memory filled locked SVG. The locked print file, physical
 * label size, font family, and vertical rail are never changed.
 * QR / right-panel geometry is left in the file and stays off-camera.
 */

const LOCKED_3ML_CATALOG = Object.freeze({
  header: { y: 85, size: 34, tracking: 3 },
  name: { y: 205, size: 96, tracking: -2 },
  bar: { x: 145, y: 243, width: 738, height: 116 },
  amount: { y: 324, size: 73, unit: 39 },
  form: { y: 445, size: 34 },
  storage: { y: 512, size: 32 },
  canvasHeight: 600,
});

function fmt(value) {
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

function setAttr(tag, name, value) {
  const next = `${name}="${fmt(value)}"`;
  if (new RegExp(`\\b${name}="`).test(tag)) {
    return tag.replace(new RegExp(`\\b${name}="[^"]*"`), next);
  }
  return tag.replace(/>$/, ` ${next}>`);
}

function replaceOpenTag(svg, pattern, attrs) {
  return svg.replace(pattern, (tag) => {
    let next = tag;
    for (const [name, value] of Object.entries(attrs)) {
      if (value == null) continue;
      next = setAttr(next, name, value);
    }
    return next;
  });
}

function layoutWebsiteCard({
  headerScale,
  nameScale,
  doseScale,
  formScale,
  storageScale,
  headerGap,
  nameBarGap,
  barFormGap,
  formStorageGap,
  topPad,
  bottomPad,
}) {
  const src = LOCKED_3ML_CATALOG;
  const headerSize = src.header.size * headerScale;
  const nameSize = src.name.size * nameScale;
  const doseSize = src.amount.size * doseScale;
  const unitSize = src.amount.unit * doseScale;
  const barH = src.bar.height * doseScale;
  const formSize = src.form.size * formScale;
  const storageSize = src.storage.size * storageScale;

  const headerY = topPad + headerSize;
  const nameY = headerY + headerGap + nameSize;
  const barY = nameY + nameBarGap;
  const amountY = barY + barH * (src.amount.y - src.bar.y) / src.bar.height;
  const formY = barY + barH + barFormGap + formSize;
  const storageY = formY + formStorageGap + storageSize;
  const bottom = src.canvasHeight - storageY;

  return {
    header: {
      y: headerY,
      size: headerSize,
      tracking: src.header.tracking * headerScale,
    },
    name: {
      y: nameY,
      size: nameSize,
      tracking: src.name.tracking * nameScale,
    },
    bar: {
      x: src.bar.x,
      y: barY,
      width: src.bar.width,
      height: barH,
    },
    amount: {
      y: amountY,
      size: doseSize,
      unit: unitSize,
    },
    form: { y: formY, size: formSize },
    storage: { y: storageY, size: storageSize },
    fits: bottom >= bottomPad && headerY - headerSize >= topPad * 0.45,
    nameScale,
    doseScale,
  };
}

export function websiteCardLayoutLarger() {
  return layoutWebsiteCard({
    headerScale: 1.1,
    nameScale: 1.35,
    doseScale: 1.25,
    formScale: 0.7,
    storageScale: 0.68,
    headerGap: 20,
    nameBarGap: 16,
    barFormGap: 26,
    formStorageGap: 12,
    topPad: 36,
    bottomPad: 36,
  });
}

/**
 * Largest natural TA-1 that still leaves side/vertical air.
 * Dosage scales with the name. Form/storage stay decorative.
 */
export function websiteCardLayoutMax() {
  let best = null;
  for (let nameScale = 2.2; nameScale >= 1.55; nameScale -= 0.01) {
    const layout = layoutWebsiteCard({
      headerScale: 1.1,
      nameScale,
      doseScale: nameScale,
      formScale: 0.58,
      storageScale: 0.56,
      headerGap: 16,
      nameBarGap: 14,
      barFormGap: 18,
      formStorageGap: 8,
      topPad: 28,
      bottomPad: 28,
    });
    if (layout.fits) {
      best = layout;
      break;
    }
  }
  if (!best) throw new Error("No max website-card layout fit the 3 mL catalog face");
  return best;
}

export function applyWebsiteCardTypography(svg, layout) {
  if (!layout) return svg;
  let out = svg;
  out = replaceOpenTag(out, /<text id="header-company-name"[^>]*>/, {
    y: layout.header.y,
    "font-size": layout.header.size,
    "letter-spacing": layout.header.tracking,
  });
  out = replaceOpenTag(out, /<text id="peptide-name"[^>]*>/, {
    y: layout.name.y,
    "font-size": layout.name.size,
    "letter-spacing": layout.name.tracking,
    "data-max-width": 760,
  });
  out = out.replace(
    /<rect x="145" y="243" width="738" height="116" rx="6" fill="#000" stroke="#000" stroke-width="4"\s*\/>/,
    `<rect x="145" y="${fmt(layout.bar.y)}" width="738" height="${fmt(layout.bar.height)}" rx="6" fill="#000" stroke="#000" stroke-width="4"/>`
  );
  out = out.replace(
    /(<text id="total-amount"[^>]*>)([\s\S]*?)(<\/text>)/,
    (full, open, inner, close) => {
      const nextOpen = setAttr(setAttr(open, "y", layout.amount.y), "font-size", layout.amount.size);
      const nextInner = inner.replace(
        /<tspan([^>]*data-field="UNIT"[^>]*)>/,
        (tag, attrs) => `<tspan${setAttr(attrs, "font-size", layout.amount.unit)}>`
      );
      return `${nextOpen}${nextInner}${close}`;
    }
  );
  out = replaceOpenTag(out, /<text id="form-text"[^>]*>/, {
    y: layout.form.y,
    "font-size": layout.form.size,
  });
  out = replaceOpenTag(out, /<text id="storage-temp"[^>]*>/, {
    y: layout.storage.y,
    "font-size": layout.storage.size,
  });
  return out;
}

export { LOCKED_3ML_CATALOG };
