# Repository Validation Workflow v1

## Status and authority

Active when explicitly adopted by the repository binding. This workflow owns
only the repository validation job and its evidence scope. Adoption is the
repository maintainer's policy decision; this file does not self-authorize it.

## Contract

The repository MUST run `.github/workflows/validate.yml` for pull requests into
main and pushes to main, with `contents: read` and no write permissions. The
single validation job MUST use Node 24, `npm ci`, and `npm run check` so local and
CI checks use the committed lockfile. Checkout MUST disable persisted credentials.
The job has a ten-minute timeout; newer runs may cancel earlier runs for the same
ref. These are explicit local policy choices, not universally optimal constants.

The supported local runtime is Node >=24, declared in `package.json` and its
lockfile. Node 20 is no longer supported by this profile. A newer local runtime
does not substitute for verification on the Node 24 CI runtime.

Checkout and setup-node MUST use their official `actions/checkout` and
`actions/setup-node` repositories at full 40-hex commit SHAs. The workflow is the
pin owner; release provenance is independently reviewed when a pin changes.
The validator checks repository names and pin shape, not remote provenance.
Automatic package-manager caching is disabled in the setup step.

The job and its steps MUST NOT skip execution with `if` or suppress failures
with `continue-on-error`. Checkout MUST use the event-selected repository,
revision and workspace without `repository`, `ref` or `path` overrides.
Workflow/job `defaults` or `env`, and step `env`, `working-directory` or `shell`
overrides are outside this execution profile. Additional execution behavior
requires an explicit owner change and independent review.

The four package entrypoints MUST remain `node scripts/generate-runtime.mjs`,
`node scripts/validate.mjs`, `node --test`, and `npm run validate && npm test`
for generate, validate, test, and check respectively. Root package lifecycle
hooks around these commands or `npm ci` are not admitted; unrelated explicitly
invoked scripts remain allowed. These checks diagnose command-chain drift,
not whether a replaced or skipped checker actually ran. Before relying on CI,
independent review MUST bind the workflow, package commands and validator to
the candidate revision and inspect the executed job's source and result.

`npm run check` MUST validate syntax, schemas, catalog/binding routing, complete
runtime projection identity, proof-reference coverage, finite proof consequences,
and the regression suite. Every declared structured canonical artifact and
example/template MUST be validated against its selected schema; template values
must satisfy structural shape even when their text is only a starter prompt.
Structured templates are selected by each machine manifest's non-null
`validation.template`; a null selection adds none. Prose-only packages retain
their declared conventional `template.yaml` when present. Package examples are
enumerated recursively for `.yaml`, `.yml` and `.json`, including inputs with a
missing or invalid version marker. Every declared path/schema obligation is
checked; repeated identical assignments do not erase their declaration origins
or other schema obligations. Equivalently represented selected schemas MUST
retain this declared coverage. Top-level `schema_version.const` discovery is
supplemental, not the basis of declared coverage.

The validator also rejects conflicting package authority sets, binding policy
declarations that contradict their owner, and kernel ledger owner drift. The
PR owner's decision-model vocabulary and nonblank-answer diagnostics apply
before accepting PR drafts. These checks do not establish factual adequacy.
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
