UD LOCKED IMAGE MASTERS

The four numbered label images are the approved visual masters:

01 = 3 mL catalog / 40 x 20 mm
02 = 3 mL calculator / 40 x 20 mm
03 = 10 mL catalog / 50 x 30 mm
04 = 10 mL calculator / 50 x 30 mm

Use the matching *_EDIT_CONTENT_ONLY.svg file for production. Replace only the
named text values and the contents of BRAND_IMAGE, QR_IMAGE, and MASCOT_IMAGE.
Do not move, resize, stretch, redraw, or regenerate their locked regions, or the
label, rails, dividers, amount bar, legal panel, vial, cap, powder, or liquid.

Permitted text fields:
PRODUCT_NAME, TOTAL_AMOUNT, UNIT, FORM_TEXT, STORAGE_TEMP,
DILUENT, CONCENTRATION, DOSE_RANGE, and DOSE_UNITS.

Permitted replaceable image/control fields:
- BRAND_IMAGE
- QR_VALUE or QR_IMAGE
- MASCOT_IMAGE
- BRAND_GAP_CHARS
- QR_ENABLED
- MASCOT_ENABLED

Brand, QR, and mascot content may change, but their bounding boxes, sizes,
alignment, proportions, stacking order, and positions are locked. The mascot
must remain behind and above the QR box. Never stretch any replacement image.

SVG field names are normalized for Cursor:
- data-field="BRAND_IMAGE" data-replaceable="true"
- data-field="QR_IMAGE" data-replaceable="true"
- data-field="MASCOT_IMAGE" data-replaceable="true"

Everything outside the permitted text boxes and the locked brand, QR, and
mascot boxes must remain pixel-identical.

Vial masters:
- 3 mL white powder
- 3 mL cobalt-blue powder
- 10 mL white powder
- 10 mL B12 ruby-red liquid at 75%

Visual mapping:
- KLOW, GLOW, GHK-Cu, AHK-Cu: cobalt-blue powder
- B12: 10 mL ruby-red liquid
- Other lyophilized products: white powder
