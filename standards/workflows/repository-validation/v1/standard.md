# Repository Validation Workflow v1

## Status and authority

Active when explicitly adopted by the repository binding. This workflow owns
only the repository validation job and its evidence scope. Adoption is the
repository maintainer's policy decision; this file does not self-authorize it.

## Contract

The repository MUST run `.github/workflows/validate.yml` for pull requests into
main and pushes to main, with `contents: read` and no write permissions. The
single validation job MUST use Node 20, `npm ci`, and `npm run check` so local and
CI checks use the committed lockfile. Checkout MUST disable persisted credentials.
The job has a ten-minute timeout; newer runs may cancel earlier runs for the same
ref. These are explicit local policy choices, not universally optimal constants.

`npm run check` MUST validate syntax, schemas, catalog/binding routing, complete
runtime projection identity, proof-reference coverage, finite proof consequences,
and the regression suite. Every declared structured canonical artifact and
example/template MUST be validated against its selected schema; template values
must satisfy structural shape even when their text is only a starter prompt.
Semantic or external-evidence gaps MUST remain explicit; a structural pass is not
an approval, a release claim, or proof that an external agent obeyed the standard.

The workflow is advisory with respect to merge enforcement. It does not set
GitHub required checks or approve merging. Enabling required status checks needs
a separate explicit repository policy change bound to the actual job name.

## Justification

The scoped goals, assumptions, alternatives and finite consequences are in
`standards/workflows/repository-validation/v1/proofs.yaml` under WF-001 and
WF-POL-001. They justify reproducible evidence and this chosen execution profile;
they do not claim that a fixed runtime version or trigger schedule is unique.
