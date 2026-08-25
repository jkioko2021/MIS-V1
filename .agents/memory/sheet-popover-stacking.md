---
name: Sheet popover stacking
description: Keep dropdown popovers visible when they are opened inside a modal sheet.
---

# Sheet popover stacking

A portalled popover inside a Sheet must use a z-index higher than the sheet and its overlay.

**Why:** The BPO Admin options were loaded successfully and present in the DOM, but the default popover layer rendered behind the Sheet overlay, making the list appear empty.

**How to apply:** When placing a `PopoverContent` inside a Sheet, verify its z-index is above the sheet stack and size it from the trigger width so it stays within the visible viewport.