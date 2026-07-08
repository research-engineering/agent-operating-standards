# Agent Policy: Standards Catalog v1

Agents MUST treat `standards.catalog.yaml` as the admission list for standards.

When adding a standards package, agents MUST:

1. Add or update the package files.
2. Add exactly one catalog entry for the standard id.
3. Ensure `owner_surface` points to the package `standard.md`.
4. Ensure `canonical_schema` points to the package schema or is `null`.
5. Ensure `applies_to` describes artifact scope without adding rules.
6. Validate the catalog against this schema when validation tooling is
   available.

Agents MUST NOT treat draft files outside the catalog as active standards.
