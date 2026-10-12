---
name: Enterprise risk compatibility
description: Why enterprise risk assessments use explicit numeric factors rather than inferred legacy rating catalogs.
---

Do not infer approved risk-rating catalogs or effectiveness fractions from the historical sample data. Use supplied, calibrated reference values before introducing categorical rating choices.

**Why:** The updated AAR_RISK_DB export supplies catalog definitions but no populated impact/likelihood/effectiveness catalogs. Older PostgreSQL samples include effectiveness codes outside 0–1. Treating those codes as fractions would produce incorrect residual exposure.

**How to apply:** Keep AML client ratings separate from departmental Enterprise Risk Register assessments. Until approved catalogs are supplied, use explicit numeric factors and percentages with the verified legacy residual-exposure formula.

When increasing fractional precision, preserve the integer capacity needed for historical codes. A stored percentage below 1% must not be reinterpreted as a fraction.

**Why:** Old codes and newly entered control fractions share a legacy storage field. Narrowing its integer range or guessing percentage units from magnitude can corrupt valid existing assessments.

**How to apply:** Preserve historical values during schema changes, validate newly entered fractions separately, and use the declared percentage units in the editor.
