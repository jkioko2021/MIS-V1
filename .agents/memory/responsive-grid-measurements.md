---
name: Responsive grid measurements
description: Why a page-width check can miss clipped grid content on mobile
---
Check the bounding boxes of important grid children and controls, not only the document's scroll width.

**Why:** A constrained page reported a width smaller than the viewport while a risk-list card extended well past its right edge. Parent clipping hid the overflow and made it unreachable by horizontal scrolling. Fixing form fields alone did not constrain the separate list grid item.

**How to apply:** When verifying small screens, compare card, selector and editor right edges with the viewport. Ensure shrinkability at both the grid item/container and its controls; implicit grid minimum sizing can otherwise retain a child's intrinsic width.

Check the owning shell scroller as well as the page after constraining nested
tables.

**Why:** A page's body, cards and controls fitted the viewport and the table
wrapper scrolled correctly, but the document still reported horizontal
overflow. Fixing intrinsic grid sizing alone did not contain the shell's
horizontal overflow contribution.

**How to apply:** Give single-column grids explicit shrinkable tracks. Once
important controls are confirmed within bounds, constrain horizontal overflow
on that page's owning shell scroller while retaining `overflow-x: auto` on
table wrappers. Do not use page clipping to conceal genuinely out-of-bounds
controls.
