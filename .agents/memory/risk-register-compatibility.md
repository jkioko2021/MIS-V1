---
name: Enterprise risk compatibility
description: Calibration and privacy boundaries between departmental risk assessments and client AML classifications.
---

Do not infer approved risk-rating catalogs or effectiveness fractions from the historical sample data. Use supplied, calibrated reference values before introducing categorical rating choices.

**Why:** The updated AAR_RISK_DB export supplies catalog definitions but no populated impact/likelihood/effectiveness catalogs. Older PostgreSQL samples include effectiveness codes outside 0–1. Treating those codes as fractions would produce incorrect residual exposure.

**How to apply:** Keep AML client ratings separate from departmental Enterprise Risk Register assessments. Until approved catalogs are supplied, use explicit numeric factors and percentages with the verified legacy residual-exposure formula.

The user subsequently supplied explicit impact, likelihood, control-effectiveness and I/R exposure catalogues. Approved factors and criteria can now be selected from those reference tables.

**Why:** These calibrations were supplied directly, rather than inferred from historical assessment labels.

**How to apply:** Fetch active ratings from their reference table, convert fractions to percentages for display and back for calculation, and retain custom numeric entry for historical/noncatalogue values. Loading a catalogue must not recalculate saved assessments.

Keep inherent and residual bands distinct, and retain separate ranges even when their level labels match.

**Why:** The supplied inherent catalogue has two Low ranges with different treatment guidance; collapsing by label would lose the user's distinction.

**How to apply:** Classify the rounded score using risk type and inclusive bounds, not a level-name key. Do not silently assign a band to a historical score outside the calibrated ranges.

Objective codes are department-scoped and can legitimately repeat across departments.

**Why:** The supplied objective master reuses codes for different objective names in different departments.

**How to apply:** Resolve, import and validate by department plus objective code. Do not globally deduplicate, renumber or remap existing objectives or their linked risks.

When increasing fractional precision, preserve the integer capacity needed for historical codes. A stored percentage below 1% must not be reinterpreted as a fraction.

**Why:** Old codes and newly entered control fractions share a legacy storage field. Narrowing its integer range or guessing percentage units from magnitude can corrupt valid existing assessments.

**How to apply:** Preserve historical values during schema changes, validate newly entered fractions separately, and use the declared percentage units in the editor.

Global Client Rating reports use explicitly entered AML classifications. Department champion or owner assignments do not grant global customer-rating access; that reporting is restricted to active administrators and Risk Management.

**Why:** The updated legacy database confirms that client-rating records originate in AML risk capture, not department scoring. Client records have no reliable department ownership mapping, so reusing departmental access or exposure calculations would disclose unrelated customers or misstate classifications.

**How to apply:** Keep captured rating/reason history, disclose unavailable historical/system data, and apply the same global customer permission gate to options, searches and exports. Do not broaden customer visibility merely because an account can maintain a departmental risk register.

For legacy register imports, do not infer department signoff or global reporting-period closure from a closed mitigation action. Preserve reporting dates and supplied review flags separately from action status.

**Why:** Legacy exports can contain completed actions and reviewed assessments without evidence that the department register was signed off or the global reporting period was closed. Inferring closure would change workflow permissions.

**How to apply:** Retain the complete source in import history, including original labels and attribution. Import supplied row-level numeric factors without treating them as approved global rating catalogs. Historical usernames and owner codes do not grant access; department assignments remain explicit.

Existing retired action statuses may remain unchanged on their own historical actions, but cannot be selected for new actions or transitions.

**Why:** The supplied action catalogue excludes legacy Open. Preserving historical records must not add Open back to the approved choices.

**How to apply:** Show a legacy option only while editing an action already using it; validate new selections against the active catalogue on the server and keep status corrections auditable.
