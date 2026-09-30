import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { readData, sourceFiles } from "../scripts/lib/io.mjs";
import { schemaRegistry } from "../scripts/lib/schema.mjs";
import { validateRepository } from "../scripts/validate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const R = "standards/artifacts/roadmap/v1/";
const K = "standards/meta/agent-operating-kernel/v1/";
const P = "standards/artifacts/pull-request-description/v1/";
const S = "standards/meta/standard-package/v1/";
const B = "standards/meta/repository-binding/v1/";
const C = "standards/meta/standards-catalog/v1/";
const E = "standards/authority/exception-protocol/v1/";
const workflowPath = ".github/workflows/validate.yml";

function write(dir, path, value) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), path.endsWith(".json")
    ? JSON.stringify(value, null, 2) + "\n"
    : stringify(value, { aliasDuplicateObjects: false }));
}

function change(dir, path, mutate) {
  const value = readData(dir, path);
  mutate(value);
  write(dir, path, value);
}

function fixture(run) {
  const dir = mkdtempSync(join(tmpdir(), "validation-hardening-test-"));
  try {
    for (const path of sourceFiles(root)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), readFileSync(join(root, path)));
    }
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function rejected(path, mutate, diagnostic) {
  fixture((dir) => {
    change(dir, path, mutate);
    assert.throws(() => validateRepository(dir), diagnostic);
  });
}

test("the admitted repository is the positive control for isolated mutations", () => {
  assert.equal(validateRepository(root).standards, 11);
});

for (const extension of ["yaml", "yml", "json"]) {
  test(`declared alternate ${extension} template is validated without a marker`, () => fixture((dir) => {
    const path = `docs/selected-template.${extension}`;
    const artifact = readData(dir, R + "template.yaml");
    delete artifact.schema_version;
    write(dir, path, artifact);
    change(dir, R + "standard.yaml", (data) => { data.validation.template = path; });
    assert.throws(() => validateRepository(dir), (error) => {
      assert.ok(error.message.includes(path));
      assert.ok(error.message.includes(R + "schema.json"));
      assert.match(error.message, /validation\.template/);
      assert.match(error.message, /schema_version/);
      return true;
    });
    artifact.schema_version = "agent-operating-standards.roadmap/v1";
    write(dir, path, artifact);
    assert.doesNotThrow(() => validateRepository(dir));
  }));

  test(`nested ${extension} example is selected without a marker`, () => fixture((dir) => {
    const path = R + `examples/nested/declared.${extension}`;
    const artifact = readData(dir, R + "examples/minimal.yaml");
    delete artifact.schema_version;
    write(dir, path, artifact);
    assert.throws(() => validateRepository(dir), (error) => {
      assert.ok(error.message.includes(path));
      assert.ok(error.message.includes(R + "schema.json"));
      assert.match(error.message, /examples\//);
      assert.match(error.message, /schema_version/);
      return true;
    });
    artifact.schema_version = "agent-operating-standards.roadmap/v1";
    write(dir, path, artifact);
    assert.doesNotThrow(() => validateRepository(dir));
  }));
}

test("a selected null template does not invent a conventional template obligation", () => fixture((dir) => {
  change(dir, R + "standard.yaml", (data) => { data.validation.template = null; });
  write(dir, R + "template.yaml", { unselected: true });
  assert.doesNotThrow(() => validateRepository(dir));
}));

test("a moved template selection does not also select the conventional file", () => fixture((dir) => {
  const path = "docs/selected-roadmap.json";
  write(dir, path, readData(dir, R + "template.yaml"));
  change(dir, R + "standard.yaml", (data) => { data.validation.template = path; });
  write(dir, R + "template.yaml", { unselected: true });
  assert.doesNotThrow(() => validateRepository(dir));
}));

test("a declared missing template identifies its path, schema and selection", () => fixture((dir) => {
  change(dir, R + "standard.yaml", (data) => { data.validation.template = "missing.yaml"; });
  assert.throws(() => validateRepository(dir), (error) => {
    assert.match(error.message, /missing\.yaml/);
    assert.ok(error.message.includes(R + "schema.json"));
    assert.match(error.message, /validation\.template/);
    return true;
  });
}));

test("declared example parse errors retain the selected schema and origin", () => fixture((dir) => {
  const path = R + "examples/malformed.json";
  writeFileSync(join(dir, path), '{"schema_version":');
  assert.throws(() => validateRepository(dir), (error) => {
    assert.ok(error.message.includes(path));
    assert.ok(error.message.includes(R + "schema.json"));
    assert.ok(error.message.includes(R + "examples/"));
    return true;
  });
}));

test("a prose-only conventional template retains its selected schema", () =>
  rejected(E + "template.yaml", (data) => { delete data.id; }, /prose conventional template.*required property 'id'/));

test("a prose-only package without its optional conventional template remains valid", () => fixture((dir) => {
  rmSync(join(dir, E + "template.yaml"));
  assert.doesNotThrow(() => validateRepository(dir));
}));

test("a schemaless package does not acquire a schema from its examples directory", () => fixture((dir) => {
  write(dir, "standards/authority/claim-types/v1/examples/nested/free.json", { custom: true });
  assert.doesNotThrow(() => validateRepository(dir));
}));

test("canonical artifact declaration supplies a schema even when its marker is missing", () =>
  rejected("docs/planning/roadmap.yaml", (data) => { delete data.schema_version; }, /canonical_artifact.*schema_version/));

test("an equivalent allOf marker schema preserves declared JSON admission", () => fixture((dir) => {
  const original = readData(dir, R + "schema.json");
  const equivalent = structuredClone(original);
  const marker = equivalent.properties.schema_version;
  equivalent.properties.schema_version = {};
  equivalent.allOf = [...(equivalent.allOf ?? []), { properties: { schema_version: marker } }];
  const path = R + "examples/nested/equivalent.json";
  const artifact = readData(dir, R + "examples/minimal.yaml");
  // Both independently selected schemas accept the same valid control.
  for (const candidate of [original, equivalent]) {
    write(dir, R + "schema.json", candidate);
    schemaRegistry(dir).validate(artifact, R + "schema.json");
    write(dir, path, artifact);
    assert.doesNotThrow(() => validateRepository(dir));
    const invalid = structuredClone(artifact);
    delete invalid.schema_version;
    write(dir, path, invalid);
    assert.throws(() => validateRepository(dir), /equivalent\.json.*schema_version/);
  }
}));

test("supplemental marker discovery remains available outside declared routes", () => fixture((dir) => {
  const artifact = readData(dir, R + "examples/minimal.yaml");
  delete artifact.items;
  write(dir, "docs/unbound-roadmap.json", artifact);
  assert.throws(() => validateRepository(dir), /unbound-roadmap\.json.*schema_version.*items/);
}));

test("deduplicated path/schema assignments retain all declaration origins", () => fixture((dir) => {
  const before = validateRepository(dir).schemaPairs;
  change(dir, R + "standard.yaml", (data) => { data.validation.template = R + "examples/minimal.yaml"; });
  assert.equal(validateRepository(dir).schemaPairs, before);
  change(dir, R + "examples/minimal.yaml", (data) => { delete data.items; });
  assert.throws(() => validateRepository(dir), (error) => {
    assert.match(error.message, /validation\.template/);
    assert.ok(error.message.includes(`${R}examples/`));
    assert.match(error.message, /schema_version/);
    assert.match(error.message, /items/);
    return true;
  });
}));

test("a later compatible schema assignment cannot erase an earlier distinct obligation", () => fixture((dir) => {
  const path = R + "examples/minimal.yaml";
  // The catalog remains structurally usable; its schema accepts this second artifact.
  const catalogSchema = readData(dir, C + "schema.json");
  write(dir, C + "schema.json", { $schema: catalogSchema.$schema, $id: catalogSchema.$id, type: "object" });
  change(dir, "docs/DOCS_CONTRACT.yaml", (data) => {
    data.adopted_standards.find((entry) => entry.standard === "meta.standards-catalog.v1").canonical_artifact = path;
  });
  assert.doesNotThrow(() => validateRepository(dir));
  change(dir, path, (data) => { delete data.items; });
  assert.throws(() => validateRepository(dir), (error) => {
    assert.ok(error.message.includes(R + "schema.json"));
    assert.match(error.message, /items/);
    return true;
  });
}));

for (const path of [S + "standard.yaml", S + "template.yaml"])
  test(`package authority intersection is rejected in ${path}`, () =>
    rejected(path, (data) => { data.authority.forbidden_claim_types.push(data.authority.owned_claim_types[0]); }, /package authority owned\/forbidden overlap/));

test("disjoint custom claim names remain a semantic vocabulary review concern", () => fixture((dir) => {
  change(dir, S + "template.yaml", (data) => { data.authority.owned_claim_types.push("custom_reviewed_claim"); });
  assert.doesNotThrow(() => validateRepository(dir));
}));

test("kernel ledger owner is independently compared with the selected catalog owner", () =>
  rejected(K + "examples/minimal.yaml", (data) => { data.invariants[0].owner_surface = "README.md"; }, /kernel owner differs from selected catalog owner/));

test("kernel owner equality follows a relocated selected owner", () => fixture((dir) => {
  const selected = "docs/selected-kernel-owner.md";
  writeFileSync(join(dir, selected), readFileSync(join(dir, K + "standard.md")));
  change(dir, "standards.catalog.yaml", (data) => {
    const entry = data.standards.find((entry) => entry.id === "meta.agent-operating-kernel.v1");
    entry.path = selected;
    entry.owner_surface = selected;
  });
  change(dir, "docs/DOCS_CONTRACT.yaml", (data) => {
    data.adopted_standards.find((entry) => entry.standard === "meta.agent-operating-kernel.v1").owner_surface = selected;
  });
  change(dir, K + "standard.yaml", (data) => { data.owner_surface = selected; });
  for (const path of [K + "template.yaml", K + "examples/minimal.yaml"])
    change(dir, path, (data) => { for (const row of data.invariants) row.owner_surface = selected; });
  assert.doesNotThrow(() => validateRepository(dir));
}));

for (const name of [
  "canonical_artifacts_win_over_generated_projections",
  "admitted_catalog_entries_only",
  "generated_markdown_is_not_normative_unless_declared",
])
  test(`binding default ${name} is not a disabling switch`, () =>
    rejected("docs/DOCS_CONTRACT.yaml", (data) => { data.default_policy[name] = false; }, /non-disableable declaration/));

test("binding template policy is checked as well as the active binding", () =>
  rejected(B + "template.yaml", (data) => { data.default_policy.admitted_catalog_entries_only = false; }, /non-disableable declaration/));

test("repository validation diagnoses the selected PR model before runtime drift", () =>
  rejected(P + "standard.yaml", (data) => { data.agent_contract.decision_tree[0].include_sections = ["Unknown Section"]; }, /PR decision model/));

for (const [scope, select] of [
  ["job", (workflow) => workflow.jobs.validate],
  ...[0, 1, 2, 3].map((index) => [`step ${index + 1}`, (workflow) => workflow.jobs.validate.steps[index]]),
]) {
  test(`workflow ${scope} condition is independently rejected`, () =>
    rejected(workflowPath, (data) => { select(data).if = false; }, /conditional execution drift/));
  test(`workflow ${scope} result suppression is independently rejected`, () =>
    rejected(workflowPath, (data) => { select(data)["continue-on-error"] = true; }, /result suppression drift/));
}

for (const field of ["ref", "repository", "path"])
  test(`checkout ${field} override is independently rejected`, () =>
    rejected(workflowPath, (data) => { data.jobs.validate.steps[0].with[field] = "alternate"; }, new RegExp(`checkout target drift: ${field}`)));

for (const [scope, select] of [
  ["workflow", (workflow) => workflow],
  ["job", (workflow) => workflow.jobs.validate],
])
  for (const [field, value] of [["env", { NODE_OPTIONS: "--require ./alternate.cjs" }], ["defaults", { run: { "working-directory": "alternate" } }]])
    test(`${scope} ${field} cannot change the command environment`, () =>
      rejected(workflowPath, (data) => { select(data)[field] = value; }, /command environment drift/));

for (const index of [0, 1, 2, 3])
  test(`step ${index + 1} env cannot change command execution`, () =>
    rejected(workflowPath, (data) => { data.jobs.validate.steps[index].env = { NODE_OPTIONS: "--require ./alternate.cjs" }; }, /command environment drift/));

for (const index of [2, 3])
  for (const [field, value] of [["shell", "bash {0}"], ["working-directory", "alternate"]])
    test(`step ${index + 1} ${field} override is independently rejected`, () =>
      rejected(workflowPath, (data) => { data.jobs.validate.steps[index][field] = value; }, /command environment drift/));

for (const name of ["check", "validate", "test", "generate"])
  test(`package ${name} cannot replace its required leaf command`, () =>
    rejected("package.json", (data) => { data.scripts[name] = "node -e 'process.exit(0)'"; }, new RegExp(`package command drift: ${name}`)));

for (const hook of [
  "precheck", "postcheck", "prevalidate", "postvalidate", "pretest", "posttest",
  "pregenerate", "postgenerate", "preinstall", "install", "postinstall",
  "prepublish", "preprepare", "prepare", "postprepare",
  "predependencies", "dependencies", "postdependencies",
])
  test(`package lifecycle ${hook} cannot wrap the checked command chain`, () =>
    rejected("package.json", (data) => { data.scripts[hook] = "node -e 'process.exit(0)'"; }, new RegExp(`lifecycle hook drift: ${hook}`)));

test("an unrelated explicit npm script remains allowed", () => fixture((dir) => {
  change(dir, "package.json", (data) => { data.scripts.lint = "node --check scripts/validate.mjs"; });
  assert.doesNotThrow(() => validateRepository(dir));
}));

for (const [index, action] of [[0, "checkout"], [1, "setup-node"]]) {
  test(`${action} requires a full SHA`, () =>
    rejected(workflowPath, (data) => { data.jobs.validate.steps[index].uses = `actions/${action}@v7`; }, /execution profile drift/));
  test(`${action} requires its official repository`, () =>
    rejected(workflowPath, (data) => { data.jobs.validate.steps[index].uses = `other/${action}@${"a".repeat(40)}`; }, /execution profile drift/));
}

test("full official Action SHA syntax does not claim release provenance", () => fixture((dir) => {
  change(dir, workflowPath, (data) => {
    data.jobs.validate.steps[0].uses = `actions/checkout@${"a".repeat(40)}`;
    data.jobs.validate.steps[1].uses = `actions/setup-node@${"B".repeat(40)}`;
  });
  assert.doesNotThrow(() => validateRepository(dir));
}));

test("setup-node cannot reenable implicit package-manager caching", () =>
  rejected(workflowPath, (data) => { data.jobs.validate.steps[1].with["package-manager-cache"] = true; }, /execution profile drift/));

test("workflow uses the selected Node 24 runtime", () =>
  rejected(workflowPath, (data) => { data.jobs.validate.steps[1].with["node-version"] = "22"; }, /execution profile drift/));

test("package runtime support matches the admitted Node minimum", () =>
  rejected("package.json", (data) => { data.engines.node = ">=20"; }, /package Node engine drift/));
