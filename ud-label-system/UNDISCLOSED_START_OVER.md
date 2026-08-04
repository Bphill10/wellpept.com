# Undisclosed renderer: start over

The current vial-label implementation is rejected. It has accumulated
overlapping CSS, SVG transforms, image resizing, masks and label overlays.
Do not add another patch over it.

## 1. Protect the repository

1. Show `git status` and create a backup branch or checkpoint commit.
2. Identify every active component, script, stylesheet, generated asset and
   import used by the Undisclosed vial renderer.
3. Report the exact file list before removal.
4. Remove only those active renderer files and references.
5. Do not modify catalog records, calculator math, product prices, routing,
   checkout, WellPept pages or unrelated untracked files.
6. Confirm no obsolete renderer CSS, transform, mask or import remains active.

## 2. Build one proof only

Create one website image and stop:

- Display name: RETA
- Total amount: 10 MG
- Vial: 3 mL
- Contents: white lyophilized powder
- Label: catalog version
- Final canvas: 1024 x 1536 pixels

Do not create GLUTA, KLOW, NAD+, B12, calculator labels or the full catalog
until the RETA proof is approved.

## 3. Separate print labels from website vial images

The files in `labels/` are flat physical labels for download and Niimbot
printing. Never stretch a flat 40 x 20 mm or 50 x 30 mm SVG across a website
vial.

For website product images, use the supplied labeled website references as the
placement target and the supplied vial PNG as the untouched background. Replace
only approved content inside the already-positioned label area. Produce one
static finished PNG at native resolution. Do not assemble the product image
with responsive webpage CSS.

## 4. Preserve the vial pixels

Use `vials/01_3mL_White_Powder_LOCKED.png` without changing its geometry.
Outside the mounted label area, the RETA result must match the source vial.

Do not resize, regenerate, stretch, crop, move, blur, sharpen or redraw the:

- vial
- cap
- crimp
- neck
- glass
- powder
- powder texture
- powder height

The white and cobalt-blue 3 mL masters must remain identical in all geometry.
Only powder color and approved label content may differ.

## 5. Mounted-label placement

- Cover approximately 57 to 60 percent of the straight body below the neck.
- Leave approximately 20 percent visible glass above and 20 percent below.
- Center the label horizontally and vertically.
- Reach both visible outer sides of the vial.
- Keep the full black left rail against the left label edge.
- Add no outside border, white margin, padding or trim area.
- Lock the placement after approval.

## 6. Editable content

Only these values may change:

`PRODUCT_NAME`, `TOTAL_AMOUNT`, `UNIT`, `FORM_TEXT`, `STORAGE_TEMP`,
`DILUENT`, `CONCENTRATION`, `DOSE_RANGE`, `DOSE_UNITS`, `COMPANY_NAME`,
`HEADER_COMPANY_NAME`, `LEGAL_LINE_1`, `LEGAL_LINE_2`, `LEGAL_LINE_3`,
`BRAND_IMAGE`, `QR_IMAGE`, `QR_VALUE`, `MASCOT_IMAGE`, `BRAND_GAP_CHARS`,
`QR_ENABLED`, `MASCOT_ENABLED`.

Brand, QR and mascot content may change. Their bounding boxes, alignment,
proportions, positions and stacking remain locked. The mascot stays behind and
above the QR code.

## 7. Text rules

Catalog abbreviations are allowed and preferred. Use `RETA` for this proof.
Abbreviate instead of shrinking or squeezing the font.

Never use `textLength`, `lengthAdjust`, `font-stretch`, `scaleX`, `scaleY`,
nonuniform scaling, `preserveAspectRatio="none"`, or a transform on a text
element or parent group containing text.

Use Arial or Helvetica, fixed coordinates, fixed template font sizes,
`font-weight: 800` for the product name and total amount, and normal 1:1 letter
proportions.

## 8. Website display

The finished static image remains 1024 x 1536 with a 2:3 aspect ratio. Display
the completed image using `width: 100%`, `height: auto`, `aspect-ratio: 2 / 3`,
`object-fit: contain`, and `object-position: center`.

Never use `object-fit: fill`, separate width/height distortion, `scaleX`, or
`scaleY`.

## 9. Acceptance tests

1. The finished image is exactly 1024 x 1536.
2. Vial and powder pixels outside the label area match the locked source.
3. Text has normal proportions and is crisp and readable.
4. The label covers approximately 57 to 60 percent of the usable body.
5. No white border or margin surrounds the label.
6. The complete black rail reaches the left edge.
7. No old renderer, CSS transform, mask or overlay affects the result.
8. The source and result remain 2:3 at every display size.

Stop and show the single RETA proof after all eight tests pass.

