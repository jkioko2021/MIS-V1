---
name: Enterprise risk compatibility
description: Calibration and privacy boundaries between departmental risk assessments and client AML classifications.
---

Do not infer approved risk-rating catalogs or effectiveness fractions from the historical sample data. Use supplied, calibrated reference values before introducing categorical rating choices.

**Why:** The updated AAR_RISK_DB export supplies catalog definitions but no populated impact/likelihood/effectiveness catalogs. Older PostgreSQL samples include effectiveness codes outside 0–1. Treating those codes as fractions would produce incorrect residual exposure.

**How to apply:** Keep AML client ratings separate from departmental Enterprise Risk Register assessments. Until approved catalogs are supplied, use explicit numeric factors and percentages with the verified legacy residual-exposure formula.

When increasing fractional precision, preserve the integer capacity needed for historical codes. A stored percentage below 1% must not be reinterpreted as a fraction.

**Why:** Old codes and newly entered control fractions share a legacy storage field. Narrowing its integer range or guessing percentage units from magnitude can corrupt valid existing assessments.

**How to apply:** Preserve historical values during schema changes, validate newly entered fractions separately, and use the declared percentage units in the editor.

Global Client Rating reports use explicitly entered AML classifications. Department champion or owner assignments do not grant global customer-rating access; that reporting is restricted to active administrators and Risk Management.

**Why:** The updated legacy database confirms that client-rating records originate in AML risk capture, not department scoring. Client records have no reliable department ownership mapping, so reusing departmental access or exposure calculations would disclose unrelated customers or misstate classifications.

**How to apply:** Keep captured rating/reason history, disclose unavailable historical/system data, and apply the same global customer permission gate to options, searches and exports. Do not broaden customer visibility merely because an account can maintain a departmental risk register.
