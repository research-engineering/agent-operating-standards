import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
let failed = false;
const prdProfiles = new Set([
  "code_behavior",
  "documentation",
  "configuration",
  "ci",
  "dependency",
  "generated",
  "refactor",
  "test",
  "release",
  "migration",
  "security",
  "visual",
  "formatting",
  "emergency",
  "other",
]);
const prdReadinessStates = new Set(["draft", "ready_for_review", "blocked", "emergency"]);
const prdReviewSurfaceTypes = new Set([
  "code",
  "documentation",
  "schema",
  "workflow",
  "configuration",
  "dependency",
  "generated",
  "test",
  "release",
  "other",
]);
const prdLinkTypes = new Set(["issue", "standard", "spec", "schema", "evidence", "policy", "incident", "design", "other"]);
const prdIssueRelationships = new Set([
  "relates_to",
  "references",
  "depends_on",
  "blocks",
  "supersedes",
  "duplicates",
  "fixes",
  "closes",
  "resolves",
]);
const prdEvidenceClasses = new Set([
  "platform_check",
  "local_command",
  "manual_review",
  "screenshot",
  "benchmark",
  "linked_report",
  "render_manifest",
  "not_available",
]);
const prdEvidenceResults = new Set(["passed", "failed", "observed", "linked", "skipped", "not_run", "not_available"]);
const prdDisplayPolicies = new Set([
  "hide_when_passed",
  "show_always",
  "show_when_failed_or_missing",
  "show_when_review_action_needed",
]);
const prdQuestionAnswerSurfaces = new Set([
  "title",
  "Summary",
  "Context",
  "Changes",
  "Impact",
  "Links",
  "Evidence",
  "Risk / Rollback",
  "Migration / Rollout",
  "Security / Privacy",
  "Visual Evidence",
  "Non-Claims",
  "Review Focus",
  "review_scope",
  "change_profiles",
  "readiness_state",
  "decision_tree",
]);
const kernelClasses = new Set(["kernel", "artifact", "adoption", "validation", "semantic"]);
const kernelEnforcementTypes = new Set([
  "normative_standard",
  "schema",
  "ci",
  "semantic_review",
  "producer_skill",
  "human_review",
  "exception_protocol",
]);

function fail(message) {
  console.error(message);
  failed = true;
}

function rel(path) {
  return relative(root, path);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readYaml(path) {
  const output = execFileSync(
    "ruby",
    ["-ryaml", "-rjson", "-e", "puts JSON.generate(YAML.load_file(ARGV[0]))", path],
    { encoding: "utf8" },
  );
  return JSON.parse(output);
}

function walkFiles(dir, predicate, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walkFiles(path, predicate, out);
    } else if (predicate(path)) {
      out.push(path);
    }
  }
  return out.sort();
}

function pathExists(pathValue, owner) {
  if (typeof pathValue === "string" && !existsSync(join(root, pathValue))) {
    fail(`${owner} points to missing path: ${pathValue}`);
  }
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function rejectUnexpectedKeys(value, allowedKeys, owner) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${owner} is not an object`);
    return;
  }
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      fail(`${owner} has unexpected key: ${key}`);
    }
  }
}

function validatePrdLinks(links, owner) {
  if (!Array.isArray(links)) return;
  for (const [index, link] of links.entries()) {
    const label = `${owner}.links[${index}]`;
    rejectUnexpectedKeys(link, ["type", "relationship", "target", "note"], label);
    if (!prdLinkTypes.has(link.type)) {
      fail(`${label} has invalid type: ${link.type}`);
    }
    if (link.type === "issue") {
      if (!prdIssueRelationships.has(link.relationship)) {
        fail(`${label} has invalid or missing issue relationship: ${link.relationship}`);
      }
    } else if (link.relationship !== undefined) {
      fail(`${label} has relationship but type is not issue`);
    }
    if (!isNonEmptyString(link.target)) {
      fail(`${label} has invalid target`);
    }
  }
}

function validatePrdEvidence(evidence, owner) {
  if (!Array.isArray(evidence)) return;
  for (const [index, item] of evidence.entries()) {
    const label = `${owner}.evidence[${index}]`;
    rejectUnexpectedKeys(
      item,
      [
        "gate_id",
        "evidence_class",
        "claim",
        "result",
        "scope",
        "command",
        "evidence_ref",
        "required_by",
        "display_policy",
        "blocker",
        "note",
      ],
      label,
    );
    for (const key of ["gate_id", "claim"]) {
      if (!isNonEmptyString(item[key])) {
        fail(`${label} has invalid ${key}`);
      }
    }
    if (!prdEvidenceClasses.has(item.evidence_class)) {
      fail(`${label} has invalid evidence_class: ${item.evidence_class}`);
    }
    if (!prdEvidenceResults.has(item.result)) {
      fail(`${label} has invalid result: ${item.result}`);
    }
    if (!prdDisplayPolicies.has(item.display_policy)) {
      fail(`${label} has invalid display_policy: ${item.display_policy}`);
    }
    rejectUnexpectedKeys(item.scope, ["head_ref", "base_ref", "head_sha"], `${label}.scope`);
    if (!isNonEmptyString(item.scope?.head_ref)) {
      fail(`${label}.scope has invalid head_ref`);
    }
    if (item.required_by !== undefined) {
      if (!Array.isArray(item.required_by) || item.required_by.some((entry) => !isNonEmptyString(entry))) {
        fail(`${label} has invalid required_by`);
      }
    }
  }
}

function validatePrdReviewQuestions(agentContract, owner) {
  const questions = agentContract?.review_questions;
  if (questions === undefined) return;
  rejectUnexpectedKeys(questions, ["universal", "conditional"], `${owner}.agent_contract.review_questions`);
  const seen = new Set();
  for (const group of ["universal", "conditional"]) {
    if (!Array.isArray(questions[group]) || questions[group].length === 0) {
      fail(`${owner}.agent_contract.review_questions.${group} must be a non-empty array`);
      continue;
    }
    for (const [index, item] of questions[group].entries()) {
      const label = `${owner}.agent_contract.review_questions.${group}[${index}]`;
      const allowedKeys =
        group === "universal"
          ? ["id", "question", "answered_by", "failure_mode"]
          : ["id", "trigger", "question", "answered_by", "omit_when", "failure_mode"];
      rejectUnexpectedKeys(item, allowedKeys, label);
      if (!/^PRD-RQ-[0-9]{3,}$/.test(item.id ?? "")) {
        fail(`${label} has invalid id: ${item.id}`);
      }
      if (seen.has(item.id)) {
        fail(`${label} has duplicate id: ${item.id}`);
      }
      seen.add(item.id);
      if (!isNonEmptyString(item.question) || !item.question.endsWith("?")) {
        fail(`${label} has invalid question`);
      }
      if (!Array.isArray(item.answered_by) || item.answered_by.length === 0) {
        fail(`${label} has no answered_by surfaces`);
      } else {
        const surfaces = new Set();
        for (const surface of item.answered_by) {
          if (!prdQuestionAnswerSurfaces.has(surface)) {
            fail(`${label} has invalid answered_by surface: ${surface}`);
          }
          if (surfaces.has(surface)) {
            fail(`${label} has duplicate answered_by surface: ${surface}`);
          }
          surfaces.add(surface);
        }
      }
      if (!isNonEmptyString(item.failure_mode)) {
        fail(`${label} has invalid failure_mode`);
      }
      if (group === "conditional") {
        if (!isNonEmptyString(item.trigger)) {
          fail(`${label} has invalid trigger`);
        }
        if (!isNonEmptyString(item.omit_when)) {
          fail(`${label} has invalid omit_when`);
        }
      }
    }
  }
}

function validatePrdDraft(path) {
  const draft = readYaml(path);
  const owner = rel(path);
  rejectUnexpectedKeys(
    draft,
    [
      "schema_version",
      "artifact_type",
      "title",
      "summary",
      "context",
      "review_scope",
      "change_profiles",
      "readiness_state",
      "impact",
      "changes",
      "links",
      "evidence",
      "risk_and_rollback",
      "migration_rollout",
      "security_privacy",
      "visual_evidence",
      "non_claims",
      "review_focus",
    ],
    owner,
  );
  for (const key of ["schema_version", "artifact_type", "title", "summary", "context"]) {
    if (!isNonEmptyString(draft[key])) {
      fail(`${owner} has invalid ${key}`);
    }
  }
  if (draft.schema_version !== "agent-operating-standards.pull-request-description/v1") {
    fail(`${owner} has invalid schema_version`);
  }
  if (draft.artifact_type !== "pull_request_description") {
    fail(`${owner} has invalid artifact_type`);
  }
  if (!Array.isArray(draft.review_scope) || draft.review_scope.length === 0) {
    fail(`${owner} has no review_scope`);
  } else {
    for (const surface of draft.review_scope) {
      rejectUnexpectedKeys(surface, ["surface", "change_type", "note"], `${owner}.review_scope entry`);
      if (!isNonEmptyString(surface.surface) || !prdReviewSurfaceTypes.has(surface.change_type)) {
        fail(`${owner} has invalid review_scope entry`);
      }
    }
  }
  if (!Array.isArray(draft.change_profiles) || draft.change_profiles.length === 0) {
    fail(`${owner} has no change_profiles`);
  } else {
    const seenProfiles = new Set();
    for (const profile of draft.change_profiles) {
      if (!prdProfiles.has(profile)) {
        fail(`${owner} has invalid change_profile: ${profile}`);
      }
      if (seenProfiles.has(profile)) {
        fail(`${owner} has duplicate change_profile: ${profile}`);
      }
      seenProfiles.add(profile);
    }
  }
  if (!prdReadinessStates.has(draft.readiness_state)) {
    fail(`${owner} has invalid readiness_state`);
  }
  if (draft.impact !== undefined) {
    rejectUnexpectedKeys(draft.impact, ["audience", "description"], `${owner}.impact`);
    if (!Array.isArray(draft.impact.audience) || draft.impact.audience.length === 0) {
      fail(`${owner}.impact has invalid audience`);
    } else {
      const seenAudience = new Set();
      const allowedAudience = new Set(["users", "business", "operators", "developers", "support"]);
      for (const audience of draft.impact.audience) {
        if (!allowedAudience.has(audience)) {
          fail(`${owner}.impact has invalid audience: ${audience}`);
        }
        if (seenAudience.has(audience)) {
          fail(`${owner}.impact has duplicate audience: ${audience}`);
        }
        seenAudience.add(audience);
      }
    }
    if (!isNonEmptyString(draft.impact.description)) {
      fail(`${owner}.impact has invalid description`);
    }
  }
  if (draft.risk_and_rollback !== undefined) {
    rejectUnexpectedKeys(draft.risk_and_rollback, ["risk", "rollback"], `${owner}.risk_and_rollback`);
    if (!isNonEmptyString(draft.risk_and_rollback.risk) || !isNonEmptyString(draft.risk_and_rollback.rollback)) {
      fail(`${owner}.risk_and_rollback has invalid risk or rollback`);
    }
  }
  if (draft.change_profiles?.includes("security") && !isNonEmptyString(draft.security_privacy)) {
    fail(`${owner} security profile requires security_privacy`);
  }
  if (draft.change_profiles?.includes("migration")) {
    if (!isNonEmptyString(draft.migration_rollout)) {
      fail(`${owner} migration profile requires migration_rollout`);
    }
    if (!draft.risk_and_rollback?.risk || !draft.risk_and_rollback?.rollback) {
      fail(`${owner} migration profile requires risk_and_rollback`);
    }
  }
  if (draft.change_profiles?.includes("generated")) {
    if (!Array.isArray(draft.links) || draft.links.length === 0) {
      fail(`${owner} generated profile requires links`);
    }
    if ((!Array.isArray(draft.evidence) || draft.evidence.length === 0) && (!Array.isArray(draft.non_claims) || draft.non_claims.length === 0)) {
      fail(`${owner} generated profile requires evidence or non_claims`);
    }
  }
  if (draft.change_profiles?.includes("release")) {
    if (!isNonEmptyString(draft.migration_rollout)) {
      fail(`${owner} release profile requires migration_rollout`);
    }
    if (!draft.risk_and_rollback?.risk || !draft.risk_and_rollback?.rollback) {
      fail(`${owner} release profile requires risk_and_rollback`);
    }
    if ((!Array.isArray(draft.evidence) || draft.evidence.length === 0) && (!Array.isArray(draft.non_claims) || draft.non_claims.length === 0)) {
      fail(`${owner} release profile requires evidence or non_claims`);
    }
  }
  if (draft.readiness_state === "emergency") {
    if (!draft.risk_and_rollback?.risk || !draft.risk_and_rollback?.rollback) {
      fail(`${owner} emergency readiness requires risk_and_rollback`);
    }
    if ((!Array.isArray(draft.evidence) || draft.evidence.length === 0) && (!Array.isArray(draft.non_claims) || draft.non_claims.length === 0)) {
      fail(`${owner} emergency readiness requires evidence or non_claims`);
    }
  }
  if (draft.readiness_state === "blocked" || draft.readiness_state === "draft") {
    if (!Array.isArray(draft.review_focus) || draft.review_focus.length === 0) {
      fail(`${owner} ${draft.readiness_state} readiness requires review_focus`);
    }
    if (!Array.isArray(draft.non_claims) || draft.non_claims.length === 0) {
      fail(`${owner} ${draft.readiness_state} readiness requires non_claims`);
    }
  }
  validatePrdLinks(draft.links, owner);
  validatePrdLinks(draft.visual_evidence, owner);
  validatePrdEvidence(draft.evidence, owner);
}

function validateStringArray(value, allowedSet, owner, field, { minItems = 1, unique = true } = {}) {
  if (!Array.isArray(value) || value.length < minItems) {
    fail(`${owner}.${field} must be an array with at least ${minItems} item(s)`);
    return;
  }
  const seen = new Set();
  for (const item of value) {
    if (!isNonEmptyString(item)) {
      fail(`${owner}.${field} has a non-string or empty item`);
      continue;
    }
    if (allowedSet && !allowedSet.has(item)) {
      fail(`${owner}.${field} has invalid item: ${item}`);
    }
    if (unique && seen.has(item)) {
      fail(`${owner}.${field} has duplicate item: ${item}`);
    }
    seen.add(item);
  }
}

function validateKernelLedger(path) {
  const ledger = readYaml(path);
  const owner = rel(path);
  rejectUnexpectedKeys(ledger, ["schema_version", "artifact_type", "invariants", "exceptions", "non_claims"], owner);
  if (ledger.schema_version !== "agent-operating-standards.agent-operating-kernel/v1") {
    fail(`${owner} has invalid schema_version`);
  }
  if (ledger.artifact_type !== "agent_operating_kernel") {
    fail(`${owner} has invalid artifact_type`);
  }
  validateStringArray(ledger.non_claims, null, owner, "non_claims");
  if (!Array.isArray(ledger.invariants) || ledger.invariants.length === 0) {
    fail(`${owner} has no invariants`);
    return;
  }
  const ids = new Set();
  for (const [index, invariant] of ledger.invariants.entries()) {
    const label = `${owner}.invariants[${index}]`;
    rejectUnexpectedKeys(
      invariant,
      [
        "id",
        "class",
        "statement",
        "owner_surface",
        "enforcement",
        "applies_to",
        "agent_effect",
        "failure_mode",
        "proof_location",
      ],
      label,
    );
    if (!/^KERNEL-[0-9]{3,}$/.test(invariant.id ?? "")) {
      fail(`${label} has invalid id: ${invariant.id}`);
    }
    if (ids.has(invariant.id)) {
      fail(`${label} has duplicate id: ${invariant.id}`);
    }
    ids.add(invariant.id);
    validateStringArray(invariant.class, kernelClasses, label, "class");
    validateStringArray(invariant.enforcement, kernelEnforcementTypes, label, "enforcement");
    validateStringArray(invariant.applies_to, null, label, "applies_to");
    for (const key of ["statement", "owner_surface", "agent_effect", "failure_mode"]) {
      if (!isNonEmptyString(invariant[key])) {
        fail(`${label} has invalid ${key}`);
      }
    }
    pathExists(invariant.owner_surface, `${label}.owner_surface`);
  }
  if (ledger.exceptions !== undefined) {
    if (!Array.isArray(ledger.exceptions)) {
      fail(`${owner}.exceptions must be an array`);
    } else {
      for (const [index, exception] of ledger.exceptions.entries()) {
        const label = `${owner}.exceptions[${index}]`;
        rejectUnexpectedKeys(exception, ["id", "scope", "owner_surface"], label);
        for (const key of ["id", "scope", "owner_surface"]) {
          if (!isNonEmptyString(exception[key])) {
            fail(`${label} has invalid ${key}`);
          }
        }
        pathExists(exception.owner_surface, `${label}.owner_surface`);
      }
    }
  }
}

function markdownHeadings(path) {
  return readText(path)
    .split("\n")
    .map((line) => line.match(/^## (.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function compareSets(actual, expected, owner) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  for (const value of expectedSet) {
    if (!actualSet.has(value)) {
      fail(`${owner} missing heading: ${value}`);
    }
  }
  for (const value of actualSet) {
    if (!expectedSet.has(value)) {
      fail(`${owner} has unexpected heading: ${value}`);
    }
  }
}

const catalogPath = join(root, "standards.catalog.yaml");
const bindingPath = join(root, "docs/DOCS_CONTRACT.yaml");
const catalog = readYaml(catalogPath);
const binding = readYaml(bindingPath);

const catalogIds = new Set();
for (const entry of catalog.standards ?? []) {
  if (catalogIds.has(entry.id)) {
    fail(`duplicate catalog id: ${entry.id}`);
  }
  catalogIds.add(entry.id);
  for (const key of ["path", "owner_surface", "canonical_schema", "agent_entrypoint", "semantic_rules"]) {
    pathExists(entry[key], `catalog entry ${entry.id}.${key}`);
  }
}

for (const adopted of binding.adopted_standards ?? []) {
  if (!catalogIds.has(adopted.standard)) {
    fail(`binding adopts absent standard: ${adopted.standard}`);
  }
  pathExists(adopted.owner_surface, `binding ${adopted.standard}.owner_surface`);
}

for (const jsonPath of walkFiles(root, (path) => path.endsWith(".json"))) {
  readJson(jsonPath);
}

for (const yamlPath of walkFiles(root, (path) => path.endsWith(".yaml") || path.endsWith(".yml"))) {
  readYaml(yamlPath);
}

const standardManifests = walkFiles(join(root, "standards"), (path) => path.endsWith("/standard.yaml"));
for (const standardPath of standardManifests) {
  const manifest = readYaml(standardPath);
  const owner = rel(standardPath);
  pathExists(manifest.owner_surface, `${owner}.owner_surface`);
  pathExists(manifest.agent_entrypoint, `${owner}.agent_entrypoint`);
  for (const key of ["schema", "semantic_rules", "template"]) {
    pathExists(manifest.validation?.[key], `${owner}.validation.${key}`);
  }

  const catalogEntry = (catalog.standards ?? []).find((entry) => entry.id === manifest.id);
  if (!catalogEntry) {
    fail(`${owner} is not admitted in standards.catalog.yaml`);
  } else if (catalogEntry.agent_entrypoint !== rel(standardPath)) {
    fail(`${owner} does not match catalog agent_entrypoint for ${manifest.id}`);
  }

  if (catalogEntry?.semantic_rules && manifest.validation?.semantic_rules !== catalogEntry.semantic_rules) {
    fail(`${owner} semantic_rules does not match catalog routing mirror`);
  }
  if (manifest.id === "artifact.pull-request-description.v1") {
    validatePrdReviewQuestions(manifest.agent_contract, owner);
  }
}

for (const rulesPath of walkFiles(join(root, "standards"), (path) => path.endsWith("/semantic-rules.yaml"))) {
  const rulesFile = readYaml(rulesPath);
  if (!catalogIds.has(rulesFile.standard)) {
    fail(`${rel(rulesPath)} references absent standard: ${rulesFile.standard}`);
  }
  const ids = new Set();
  for (const rule of rulesFile.rules ?? []) {
    if (!/^[A-Z0-9]+-SEM-[0-9]{3,}$/.test(rule.id ?? "")) {
      fail(`${rel(rulesPath)} has invalid semantic rule id: ${rule.id}`);
    }
    if (ids.has(rule.id)) {
      fail(`${rel(rulesPath)} has duplicate semantic rule id: ${rule.id}`);
    }
    ids.add(rule.id);
    for (const key of ["invariant", "check", "failure_mode"]) {
      if (typeof rule[key] !== "string" || rule[key].length === 0) {
        fail(`${rel(rulesPath)} rule ${rule.id} has invalid ${key}`);
      }
    }
    if (!Array.isArray(rule.applies_to) || rule.applies_to.length === 0) {
      fail(`${rel(rulesPath)} rule ${rule.id} has no applies_to fields`);
    }
  }
}

const prTemplateSource = join(root, "standards/artifacts/pull-request-description/v1/github-template.md");
const prTemplateProjection = join(root, ".github/pull_request_template.md");
if (existsSync(prTemplateSource) && existsSync(prTemplateProjection)) {
  if (readText(prTemplateSource) !== readText(prTemplateProjection)) {
    fail(".github/pull_request_template.md is stale against pull-request-description github-template.md");
  }
  const prdStandard = readYaml(join(root, "standards/artifacts/pull-request-description/v1/standard.yaml"));
  const expectedHeadings = [
    ...(prdStandard.agent_contract?.required_sections ?? []),
    ...(prdStandard.agent_contract?.optional_sections ?? []),
  ];
  compareSets(markdownHeadings(prTemplateSource), expectedHeadings, rel(prTemplateSource));
  compareSets(markdownHeadings(prTemplateProjection), expectedHeadings, rel(prTemplateProjection));
}

for (const prdDraftPath of [
  join(root, "standards/artifacts/pull-request-description/v1/template.yaml"),
  ...walkFiles(join(root, "standards/artifacts/pull-request-description/v1/examples"), (path) =>
    path.endsWith(".yaml") || path.endsWith(".yml"),
  ),
]) {
  if (existsSync(prdDraftPath)) {
    validatePrdDraft(prdDraftPath);
  }
}

for (const kernelLedgerPath of [
  join(root, "standards/meta/agent-operating-kernel/v1/template.yaml"),
  ...walkFiles(join(root, "standards/meta/agent-operating-kernel/v1/examples"), (path) =>
    path.endsWith(".yaml") || path.endsWith(".yml"),
  ),
]) {
  if (existsSync(kernelLedgerPath)) {
    validateKernelLedger(kernelLedgerPath);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("validation ok");
}
