# Validation hardening design and implementation plan

Status: implementation candidate; review and qualification in progress.
Implementation base: `950dae725be9613ec3e102ec67f20937988342c6`.
Design review date: 2026-09-30.
Planning owner: standards maintainer; portfolio entry:
[RM-006](../planning/roadmap.yaml).

## Authority and scope

This document records design, delivery mapping, and acceptance experiments. It is
not an admitted operating standard. Merging it does not change artifact
validity, enable required GitHub checks, or certify that any repair is delivered.
Proposed contract changes take effect only through their canonical owners,
catalog admission, and repository binding where applicable.

The scope is the repository validator, PR runtime generator, structured
contracts, examples, CI evidence boundary, and maintenance documentation.
F01-F30 are traceability labels for the finite concern set below; they are not
new invariant IDs or a count of independent defects. Each row has a selected
action, including explicit retention of valid current behavior.

| Concern | Current normative owner |
| --- | --- |
| Package routing and complete routine instructions | [Standard Package](../../standards/meta/standard-package/v1/standard.md) |
| Catalog identity and routing mirrors | [Standards Catalog](../../standards/meta/standards-catalog/v1/standard.md) |
| Repository adoption and canonical artifacts | [Repository Binding](../../standards/meta/repository-binding/v1/standard.md) |
| Claim classification and authority | [Claim Types](../../standards/authority/claim-types/v1/standard.md) |
| PR model, evidence, and sections | [PR contract](../../standards/artifacts/pull-request-description/v1/standard.yaml) and its named schema/rules |
| Projection provenance and freshness | [Rendered View](../../standards/artifacts/rendered-view/v1/standard.md) |
| Planning and scheduling claims | [Roadmap](../../standards/artifacts/roadmap/v1/standard.yaml) |
| Local/CI checks and their limits | [Repository Validation](../../standards/workflows/repository-validation/v1/standard.md) |

Current source wins over this design if they disagree. An implementation PR
identifies its intended owner delta before using the proposed behavior as an
acceptance requirement. This plan adds no universal workflow requirement.

## Problem and protected observations

The strongest repair cases were incomplete schema assignment for a
selected alternate template (F06), omission of JSON examples without a known
version marker (F07), and an outdated example naming the actual PR contract
(F30). The remaining concerns include useful hardening, incomplete guarantees,
and semantics deliberately left to review.

Protected observations are:

- Existing valid artifacts and explicitly selected alternate catalogs remain
  valid; duplicate keys, aliases, escaping paths, invalid schema data, stale
  runtime core, and invalid finite proofs remain rejected.
- Template starter text is not promoted into authority. A fictional example
  does not need to impersonate an admitted production artifact.
- Schema conformance, semantic adequacy, external evidence truth, and executed
  workflow identity remain separate claims. Unknown facts do not become false.
- Generated projections have one editable source. Independent test oracles
  remain independent of the producer they test.
- The advisory validation model, repository permissions, and squash-only merge
  policy remain unchanged unless a later owner change explicitly admits a delta.

A validator defect requires an owner-promised automatic predicate `P` over a
declared domain `D` and a witness `x in D` with `not P(x)` and `Gate(x) = pass`.
Unusual input accepted by a structural schema is not sufficient by itself.

## Design

### D1. Complete declared artifact registration

Keep the existing JSON Schema engine and package/catalog ownership. Replace
filename-only template selection in
[validate.mjs](../../scripts/validate.mjs) with assignments derived from the
selected package declaration. An assignment carries path, selected schema,
standard ID, and declaration origin; it is an in-memory relation, not another
persistent catalog.

Let `C` be binding-selected structured canonical artifacts, `T` selected
structured templates, and `E` package examples with supported structured
extensions. The coverage obligation is:

```text
Declared = C union T union E
for every declaration d in Declared:
  resolve d.path under the repository boundary
  parse using the admitted format
  validate against d.selectedSchema
```

For a machine entrypoint, its non-null `validation.template` is the template
selection. Do not silently substitute `folder/template.yaml`. A null selection
is not a request to invent one. For a prose-only package, retain its explicitly
declared conventional template route. Recursively include `.yaml`, `.yml`, and
`.json` examples even when their required version marker is missing. A missing
marker is then rejected by the selected schema, rather than causing omission.
Declare these formats in the package/workflow owners before relying on them.

Deduplicate repeated identical path/schema assignments while preserving their
origins. If a path has multiple declared schema obligations, preserve each;
do not let last-write-wins choose one. Schemaless packages remain explicitly
schemaless. Preserve existing proof, kernel, runtime-overlay, and core checks.
Errors identify the artifact, selected schema, and declaration that selected it.

Implicit `schema_version` discovery remains a supplemental compatibility route.
It is not the proof of `Declared` coverage. F08 does not justify a generic JSON
Schema introspector: an equivalent `allOf` rewrite affects implicit discovery,
but declaration-driven coverage now validates templates and examples too. The
workflow owner documents supplemental discovery and its limit; regression tests
preserve that distinction. A future stronger discovery
guarantee needs an explicit discriminator contract before implementation.

### D2. Validate before confined, atomic generation

Treat [generate-runtime.mjs](../../scripts/generate-runtime.mjs) as a writer
with a separate prepublication boundary. Its execution domain is a
cooperative, single-writer local checkout. No hostile same-UID filesystem or
concurrent source-writer isolation guarantee is claimed.

The implemented transition is:

```text
load canonical inputs -> validate inputs and selected output destination
-> construct complete output bytes -> write exclusive sibling temporary file
-> verify bytes -> replace destination -> report success
```

Validate the source manifest and semantic-rule data before opening the output.
Do not call the whole repository validator as a precondition: a stale generated
core is a legitimate reason to run the generator. Reuse the input owners and
schema engine without weakening the post-generation whole-repository check.

The destination is repository-relative, has no traversal or symlink component,
and is an absent leaf or a regular file under an admitted existing directory.
Reject output aliases of canonical inputs, including hard-link identity when
an existing destination and source have the same device/inode. A sibling
temporary file is created exclusively. Preserve required existing file modes;
new files follow the admitted creation mode and process umask. Failed writes
leave the previous destination intact and clean only this attempt's temporary
file. Success is emitted after replacement, not after serialization.

Atomic replacement protects a single output from partial publication. It does
not prove crash durability of the filesystem or a coherent multi-input
snapshot. Unsupported replacement semantics fail explicitly. Any later support
for concurrent writers needs its own synchronization and freshness contract;
pre/post hashes alone must not be described as race prevention.

### D3. Narrow, owned consistency checks

These are owner contract clarifications and guard additions, not findings
that the current valid corpus contains conflicting authority.

| Fields | Treatment | Owner and compatibility boundary |
| --- | --- | --- |
| `owned_claim_types` / `forbidden_claim_types` | Reject an intersection as unresolved/conflicting metadata before reliance | Package owner defines this automatic rejection |
| Claim-type vocabulary | Keep unclassified claims unproven; do not add another handwritten enum | Before a vocabulary checker, choose one machine owner under Claim Types, migrate existing enum projections, and verify both package and exception consumers; otherwise retain semantic review |
| `proof_policy.proof_location` | Retain explanatory prose, including composite descriptions | `validation.justifications` and exact rule references remain the machine route; no heuristic path parser for prose |
| Kernel ledger `owner_surface` | Compare with the actual selected kernel owner, alongside statement and proof identity | Kernel semantic owner defines equality; do not hardcode a second owner path |
| Binding `default_policy` | Reject false declarations semantically; retain the v1 wire schema | Binding owner states that these are declarations, not switches; no new schema field or structural migration |

The vocabulary choice is a bounded prerequisite decision, not permission to
implement a duplicate registry. A new machine owner is justified only by the
two existing consumer families and a complete migration/reference plan. Keep
this decision out of the initial coverage repair.

### D4. PR model diagnostics and evidence semantics

Compile PR section predicates against explicitly owned fact, profile, readiness,
urgency, field, and section domains. Reject a selected section without a field
mapping, unknown leaf names, and malformed predicates before validating drafts.
Scope this compiler to the PR decision model; other packages have different
decision-tree representations. Declare the supported schema-vocabulary
extraction profile rather than claiming arbitrary-schema introspection.

Retain the decision tree as the visible-section selector and the schema as
structural admission. Test their conjunction; do not require either to replace
the other. Independently authored expected results remain test oracles. Add
nonblank checks for mandatory final PR answers as a narrow semantic diagnostic;
this does not prove factuality or adequate explanation, and meaningful starter
text remains allowed.

Retain the v1 independent evidence-class and result enums. The prior proposal
to restrict their cross-product is not adopted: no admitted meaning establishes
that rejection, and introducing it would change the supported valid domain.
A future restriction needs an explicit versioned owner decision and independent
pairwise expectations. Existing immutable-target and positive-reference
requirements remain in force; external reference truth remains review work.

For F21, test the complete compact-consumer load path before changing the core.
The adapter must either supply the selected authority information or resolve
`source_manifest` before an authority-sensitive decision. Use two otherwise
equal packages with different permissions as a distinguishing case. If no
actual consumer or harness is available, retain an unresolved consumer
obligation; a schema equality test cannot substitute for execution evidence.

### D5. CI evidence and maintained dependencies

Structural workflow checks may reject accidental `if`, `continue-on-error`,
checkout-target, and npm-command changes earlier. They cannot protect execution
when their own step is skipped, their result is suppressed, their entrypoint
is replaced, or checkout hides the candidate tree.

For a CI-assurance change, independently inspect the candidate workflow and
package scripts at immutable base/head identities. Bind the inspected validator
revision separately from the candidate. Record whether the observed run used
the intended source, command chain, event, and result. An intended policy change
requires independent review of that delta, not ratification solely by its new
checker. Keep four separate falsifiers for F02-F05. This proposal does not add
`pull_request_target`, privileged execution of PR code, branch protection, or
required status checks. A stronger enforced mechanism is a separate workflow
admission, with a separately justified trust boundary.

The maintained application runtime is Node 24 LTS, rechecked on 2026-09-30.
Node 20 reached EOL on
2026-04-30 and Node 24 is supported: [Node.js release schedule](https://github.com/nodejs/Release#release-schedule).
The workflow owner, workflow input, execution-profile checks, regression
oracles, and local `engines` now agree on Node 24 as the minimum.
Use the old runtime only as a bounded migration comparison, not a new supported
deployment recommendation.

Official Action releases are resolved to full commit SHAs in the workflow,
with human-readable version comments and update automation. A SHA pin addresses Action identity, not the entire runner image or
every dependency: [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use).
Scheduled npm version updates complement Action updates. Record security-update/alert settings only from
authorized provider evidence; absence of an npm entry does not establish their
absence: [Dependabot configuration](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file).

### D6. Preserve intentional review boundaries

Retain semantic review for rule-to-proof adequacy, observed stale state,
free-text scheduling claims, and external evidence truth. Improve explanations
at their owners instead of introducing unsupported automatic verdicts. A
schema-valid fictional starter can contain placeholders; a named real example
should agree with the named contract. Correct the real semantic-rules example
without rejecting the intentionally fictional template.

Review roadmap metadata and remaining work against the named owners. Do not
infer missed human review solely from an old date, or complete a combined task
merely because one component exists. Keep additional renderer work separate
from validator hardening. A roadmap renderer/current-freshness gate remains
outside this plan unless the binding later adopts that obligation.

Resource limits and stronger publication durability remain conditional work.
Before adding limits, establish admitted workload, trust boundary, units,
failure behavior, and a measured bound. Before adding concurrency guarantees,
establish the real reader/writer topology. Avoid arbitrary thresholds and
unnecessary services for the current small local CLI.

## Finding disposition and delivery mapping

`Implemented` identifies candidate code and owner changes, subject to PR
qualification and review. `Retain` is an explicit no-change
decision for a valid boundary, with its review obligation preserved.
`Conditional` names the missing evidence that would reopen implementation.
These decisions cover concerns; implementation does not mean merged delivery.

| ID | Bounded concern | Selected action | Package |
| --- | --- | --- | --- |
| F01 | Output path accepted before writer validation | Implemented confined prepublication validation under D2 | P2 |
| F02 | A required step can be disabled in a changed workflow | Implemented structural diagnostics and independent review boundary under D5 | P5 |
| F03 | A changed job can suppress errors | Same family, separate result-propagation falsifier | P5 |
| F04 | A changed checkout can select the wrong tree | Same family, separately bind inspected and executed revisions | P5 |
| F05 | A changed npm entrypoint can omit checks | Same family, verify leaf commands and guard reachability | P5 |
| F06 | Selected alternate template escapes schema assignment | Implemented declaration-driven assignment | P1 |
| F07 | JSON example without a marker escapes schema assignment | Implemented complete supported-example enumeration | P1 |
| F08 | Implicit discovery depends on schema layout | Implemented declaration-based coverage independent of discriminator layout; retain limited supplemental discovery | P1 |
| F09 | Conflicting authority arrays pass structural admission | Implemented owner clarification and narrow intersection check | P3 |
| F10 | Vocabulary validation has no single machine owner | Retain manual classification; no second vocabulary registry | P3 |
| F11 | Proof-location prose is mistaken for a typed path | Retain prose; clarify the existing exact machine-reference route | P3 |
| F12 | Kernel owner metadata is not checked for identity | Implemented selected-owner comparison under the kernel contract | P3 |
| F13 | Evidence enums lack a stated cross-field relation | Retain independent v1 enums; a new restriction requires a versioned owner decision | P4 |
| F14 | CI selects an EOL application runtime | Implemented Node 24 minimum and CI migration with owner parity | P5 |
| F15 | Removing an obligation can evade forward reference checks | Conditional: adopt an obligation-to-delivery mapping only with a real consumer and owner semantics; retain independent review meanwhile | P6 |
| F16 | Finite logic does not establish semantic adequacy | Retain the declared semantic-review boundary | P6 |
| F17 | Standalone validation detects less than the full gate | Implemented earlier PR-model diagnostics; preserve independent full-suite oracles | P4 |
| F18 | A stale label does not serialize its observation | Retain manual observation requirement; no mandatory new witness format | P6 |
| F19 | Whitespace passes a string-length check | Implemented a narrow final-answer nonblank diagnostic | P4 |
| F20 | Scheduling-text heuristic covers one field | Retain semantic review; typed scheduling is conditional on an actual scheduling owner | P6 |
| F21 | Compact core omits an authority field | Clarified source-manifest authority resolution; actual external consumer execution remains conditional | P4 |
| F22 | Schema/model representations partially overlap | Retain their distinct roles and independent tests; no file split by metrics | P4 |
| F23 | Roadmap projection has no current-freshness gate | Retain the current scope; renderer admission belongs to RM-005 | P6 |
| F24 | npm version updates are not configured | Implemented npm version updates; provider security settings remain unverified | P5 |
| F25 | Action major tags are mutable | Implemented official full-SHA Action pins without claiming total environment reproducibility | P5 |
| F26 | Recorded roadmap review and combined work are unclear | Refreshed RM-006 as active, not shipped; projection reflects the canonical row | P6 |
| F27 | Boolean declarations look like disableable switches | Implemented owner-declared semantic true check; retain the v1 wire schema | P3 |
| F28 | No explicit pre-read resource budget | Conditional on a defined workload/trust boundary and measured need | P6 |
| F29 | Generated output is replaced by a direct write | Implemented one-file atomic replacement with D2's explicit limits | P2 |
| F30 | Named real example disagrees with its current contract | Corrected the real example; preserved the fictional starter | P1 |

## Implementation sequence

P1-P6 are logical review groups within one implementation PR. The sequence
expresses dependency, not a delivery date or a requirement for six separate PRs.

| Package | Change surfaces | Prerequisite | Exit evidence |
| --- | --- | --- | --- |
| P1: declared coverage and example | `scripts/validate.mjs`, `test/validation-hardening.test.mjs`, package/workflow owner clarification, real semantic-rules example | Current owner review | A1-A4; existing positive gate remains green |
| P2: safe generation | Generator, `test/generation.test.mjs`, package generation contract | P1 coverage available; D2 domain admitted | A5-A7 and unchanged normal generated bytes |
| P3: contract consistency | Package, kernel and binding owners; semantic checks without wire-schema changes | P1; resolve vocabulary and compatibility decisions | A8-A9; no second vocabulary owner; current valid corpus preserved |
| P4: PR model and consumption | PR owner/schema/rules, section helper, runtime projections, tests; actual adapter only if in scope | P3; supported PR-model vocabulary profile declared | A10-A12; complete core regenerated; consumer gap remains explicit if unavailable |
| P5: runtime and CI assurance | Workflow owner, workflow, package support metadata, execution-profile tests, Dependabot | P1; qualify the complete candidate tree | A13-A15; exact target/run and supported-runtime evidence |
| P6: documentation and residual decisions | Relevant existing owner explanations, roadmap and its projection; external audit evidence | P1-P5 outcomes reconciled | A16; every F-row has an implementation receipt, retained rationale, or explicit conditional blocker |

Changes to shared contracts, validator, generator, and projections are qualified
together after the disjoint writer batch. Review binds owner deltas, protected
observations, derived outputs, expected failures, and independent acceptance cases.
P6 records conditional work as conditional; it does not turn it into completion.

## Acceptance experiments

For every rejection case, keep syntax, paths, and unrelated requirements valid
so the intended guard is reached. Assert the reason and affected artifact,
not merely any nonzero exit. Positive controls prevent rejection-by-default.

| ID | Independent positive control and negative witness |
| --- | --- |
| A1 | A valid alternate selected template passes; the same declared path with schema-invalid data fails before success |
| A2 | Valid nested YAML/YML/JSON examples pass; a JSON example missing the required marker fails against its package schema |
| A3 | Alternate catalog and existing canonical artifacts retain validation; duplicate declarations do not erase distinct schema obligations |
| A4 | The real PR semantic-rule example agrees with current PR fields/rule meaning; the explicitly fictional template remains an allowed starter |
| A5 | A valid missing/regular output is generated; absolute/traversal/symlink/source-alias destinations fail before a sentinel changes |
| A6 | A source parse/schema failure leaves old output unchanged; injected write/replace failures leave old output intact and no owned temporary residue |
| A7 | Repeated generation has identical bytes and retained required mode; an interrupted pre-replace write cannot expose partial destination bytes in the admitted environment |
| A8 | Disjoint classified authority and the selected kernel owner pass; isolate overlap and wrong owner as separate negatives; vocabulary remains manual |
| A9 | Current true declarations pass; false follows the newly admitted binding policy; composite proof prose is not accidentally parsed as a path |
| A10 | Existing profile/readiness/urgency behavior and true/unknown composition remain unchanged; unmapped sections and invalid PR predicate leaves fail early |
| A11 | Existing evidence enum combinations remain accepted under v1; blank mandatory final answers fail without rejecting meaningful starter text |
| A12 | Real full/compact consumer paths distinguish changed authority; absence of such a consumer yields an unresolved result, never an equivalence pass |
| A13 | Four isolated workflow/command mutations expose execution, result, target and leaf-command gaps; verify whether the checker itself runs and receives the candidate |
| A14 | Lockfile install and whole check pass on the selected supported runtime; workflow owner, configuration and observed runtime agree; Action pins resolve to intended official releases |
| A15 | npm version-update configuration targets the existing lockfile; provider security settings remain unknown unless authorized provider evidence establishes them |
| A16 | All 30 F-IDs occur once in the disposition table; roadmap projections match changed canonical rows; retained manual obligations and unresolved evidence stay visible |

These experiments map to the new isolated tests and existing regression suite;
external consumer execution and provider security settings remain unverified.
They are not new CI jobs or proof merely by being listed. Preserve existing
regression cases. Native
`npm run check` remains the current repository gate; a representative negative
case or a count of tests never substitutes for the package's exact predicate.

## Compatibility, rollout, and rollback

P1 repairs promised coverage without adding an artifact field. Newly rejected
declared artifacts can reveal pre-existing invalid data; identify and repair
those artifacts rather than weakening their selected schema. Preserve the
supported declaration routes and schemaless cases.

P2 preserves normal generated bytes and changes failure ordering. P3/P4 clarify
existing semantic obligations and update routine instruction projections without
changing v1 wire fields. For future valid-domain or wire-schema changes,
inventory supported consumers and exact old/new valid domains. Use a new
standard/schema version by default when valid supported inputs or strict
readers would break; retain the old route until its retirement is admitted.
Do not reuse the old unmerged-proposal disclaimer as current migration evidence.

Regenerate only affected derived surfaces from their canonical inputs. Check
producer-to-consumer composition after the complete writer batch. Per-file
atomic writes do not make a multi-file schema/core migration atomic; use the
reviewed commit as the publication unit and do not promise mixed-tree safety.

Rollback is package-specific: revert a code-only repair as one commit; revert
an owner/schema/core transition together; preserve already accepted external
consumer data and old-version support. A runtime rollback must still select a
supported runtime and consistent owner/profile, rather than silently restore
an EOL support claim. Verify rollback on the actual supported consumer matrix
before claiming it is safe. No runtime service or database migration is implied.

## Alternatives, structure, and completion boundary

- Keep the current AJV-based validator and small domain helpers. A replacement
  validation engine is not required by the coverage witnesses.
- Reject a persistent parallel artifact registry when existing declarations
  already own selection. A narrowly shared in-memory enumerator is sufficient.
- Reject mechanical splitting of `validate.mjs`, schemas, proof collections,
  or cohesive tests by LOC. Extract only a demonstrated independent owner or
  shared operation; preserve dependency direction and the complete proof chain.
- Preserve independent expected test outcomes. Generating them from the same
  production decision tree would remove their ability to detect policy drift.
- Keep conditional resource, renderer, concurrency, and external-consumer work
  out of unconditional completion claims until their trigger evidence exists.

Delivery is established package by package from current owner changes, exact
target-bound checks, review, and post-merge evidence. A merged plan, finite proof
count, inventory of external checklist IDs, or a green native suite alone does
not prove exhaustive semantic conformance, absence of every structural defect,
historical non-regression, or global SOTA superiority. Unknown applicability and
missing evidence remain explicit work, not an automatic excuse to change the
project's policy or an automatic defect of the project.
