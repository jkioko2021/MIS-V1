---
name: Responsive grid measurements
description: Why a page-width check can miss clipped grid content on mobile
---
Check the bounding boxes of important grid children and controls, not only the document's scroll width.

**Why:** A constrained page reported a width smaller than the viewport while a risk-list card extended well past its right edge. Parent clipping hid the overflow and made it unreachable by horizontal scrolling. Fixing form fields alone did not constrain the separate list grid item.

**How to apply:** When verifying small screens, compare card, selector and editor right edges with the viewport. Ensure shrinkability at both the grid item/container and its controls; implicit grid minimum sizing can otherwise retain a child's intrinsic width.
