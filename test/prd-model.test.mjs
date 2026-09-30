import test from "node:test";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readData } from "../scripts/lib/io.mjs";
import { schemaRegistry } from "../scripts/lib/schema.mjs";
import {
  selectedSections,
  triggerValue,
  validatePrd,
  validatePrdModel,
} from "../scripts/lib/prd.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = "standards/artifacts/pull-request-description/v1/";
const contract = readData(root, P + "standard.yaml").agent_contract;
const schema = readData(root, P + "schema.json");
const base = readData(root, P + "examples/minimal.yaml");
const schemas = schemaRegistry(root);
const clone = structuredClone;

test("the selected PR model and meaningful starter draft remain valid", () => {
  assert.equal(validatePrdModel(contract, schema), true);
  assert.doesNotThrow(() => schemas.validate(base, P + "schema.json"));
  assert.deepEqual(validatePrd(base, contract), ["Summary", "Context", "Links"]);
});

test("all predicate kinds compose within the selected owner domains", () => {
  const model = clone(contract);
  model.decision_tree[1].when = {
    all: [
      true,
      { profile: "documentation" },
      { readiness: "ready_for_review" },
      { urgency: "normal" },
      { absent: "evidence" },
      { any: [false, { fact: "impact" }] },
    ],
  };
  assert.equal(validatePrdModel(model, schema), true);
});

for (const [label, expression] of [
  ["null", null],
  ["missing", undefined],
  ["number", 1],
  ["string", "true"],
  ["array", []],
  ["empty object", {}],
  ["multiple operators", { fact: "impact", profile: "ci" }],
  ["unknown operator", { not: { fact: "impact" } }],
  ["non-array any", { any: true }],
  ["empty all", { all: [] }],
  ["invalid branch behind true", { any: [true, null] }],
  ["invalid branch behind false", { all: [false, { fact: "missing" }] }],
]) {
  test(`model admission rejects ${label} before any draft exists`, () => {
    const model = clone(contract);
    model.decision_tree[0].when = expression;
    assert.throws(() => validatePrdModel(model, schema), /PR decision model/);
  });
}

for (const [operator, value] of [
  ["fact", "expanded_reviews"],
  ["profile", "emergency"],
  ["readiness", "emergency"],
  ["urgency", "draft"],
  ["absent", "validation"],
  ["fact", true],
]) {
  test(`model admission rejects unknown ${operator} leaf ${value}`, () => {
    const model = clone(contract);
    model.decision_tree[1].when = { [operator]: value };
    assert.throws(() => validatePrdModel(model, schema), /unknown .* leaf/);
  });
}

test("schema-owned vocabulary is read from the selected schema", () => {
  const model = clone(contract);
  const selectedSchema = clone(schema);
  selectedSchema.properties.change_profiles.items.enum.push("owner_extension");
  model.decision_tree[1].when = { profile: "owner_extension" };
  assert.equal(validatePrdModel(model, selectedSchema), true);
  assert.throws(() => validatePrdModel(model, schema), /unknown profile leaf/);
});

for (const [label, change] of [
  ["undeclared selected section", (model) => {
    model.decision_tree[0].include_sections.push("Unknown Section");
  }],
  ["unmapped declared section", (model) => {
    model.optional_sections.push("Unknown Section");
    model.decision_tree[0].include_sections.push("Unknown Section");
  }],
  ["undeclared mapped section", (model) => {
    model.optional_sections = model.optional_sections.filter((section) => section !== "Changes");
  }],
  ["required optional overlap", (model) => model.optional_sections.push("Summary")],
  ["duplicate declaration", (model) => model.required_sections.push("Summary")],
  ["section without a rule", (model) => {
    model.decision_tree = model.decision_tree.filter((rule) => rule.id !== "changes");
  }],
  ["missing rule body", (model) => { model.decision_tree[0] = null; }],
  ["empty decision tree", (model) => { model.decision_tree = []; }],
  ["empty section selection", (model) => { model.decision_tree[0].include_sections = []; }],
]) {
  test(`model admission rejects ${label}`, () => {
    const model = clone(contract);
    change(model);
    assert.throws(() => validatePrdModel(model, schema), /PR decision model/);
  });
}

test("repeated section selections preserve the existing union semantics", () => {
  const model = clone(contract);
  model.decision_tree[0].include_sections.push("Summary");
  assert.equal(validatePrdModel(model, schema), true);
  assert.deepEqual(validatePrd(base, model), ["Summary", "Context", "Links"]);
});

test("every mapped section must have a field in the selected schema", () => {
  const selectedSchema = clone(schema);
  delete selectedSchema.properties.summary;
  assert.throws(() => validatePrdModel(contract, selectedSchema), /missing artifact field: summary/);
});

for (const [label, change] of [
  ["top-level properties behind allOf", (selectedSchema) => {
    selectedSchema.allOf.push({ properties: selectedSchema.properties });
    delete selectedSchema.properties;
  }],
  ["profile enum behind allOf", (selectedSchema) => {
    const items = selectedSchema.properties.change_profiles.items;
    selectedSchema.properties.change_profiles.items = { allOf: [items] };
  }],
  ["fact properties behind a reference", (selectedSchema) => {
    selectedSchema.$defs.facts = selectedSchema.properties.review_facts;
    selectedSchema.properties.review_facts = { $ref: "#/$defs/facts" };
  }],
  ["readiness enum behind oneOf", (selectedSchema) => {
    selectedSchema.properties.readiness_state = { oneOf: [{ const: "draft" }] };
  }],
  ["changed fact truth domain", (selectedSchema) => {
    selectedSchema.properties.review_facts.properties.impact.enum = [true, false];
  }],
  ["missing urgency vocabulary", (selectedSchema) => {
    delete selectedSchema.properties.urgency;
  }],
]) {
  test(`unsupported vocabulary profile fails closed: ${label}`, () => {
    const selectedSchema = clone(schema);
    change(selectedSchema);
    assert.throws(() => validatePrdModel(contract, selectedSchema), /Unsupported PR schema vocabulary profile/);
  });
}

test("the vocabulary profile accepts reordered truth enums and schema annotations", () => {
  const selectedSchema = clone(schema);
  selectedSchema.properties.review_facts.properties.impact.enum = ["unknown", false, true];
  selectedSchema.properties.readiness_state.description = "The review readiness domain.";
  assert.equal(validatePrdModel(contract, selectedSchema), true);
});

for (const field of ["title", "summary", "context"]) {
  test(`mandatory ${field} rejects whitespace while meaningful text remains accepted`, () => {
    const draft = clone(base);
    draft[field] = " \t\n ";
    // minLength admits these bytes; the semantic answer requirement rejects them.
    assert.doesNotThrow(() => schemas.validate(draft, P + "schema.json"));
    assert.throws(() => validatePrd(draft, contract), /PRD-SEM-001.*nonblank/);
    draft[field] = " Explain the selected change. ";
    assert.doesNotThrow(() => validatePrd(draft, contract));
  });
}

test("true OR unknown and false AND unknown retain their independent expected values", () => {
  const draft = clone(base);
  draft.review_facts.impact = "unknown";
  assert.equal(triggerValue({ any: [true, { fact: "impact" }] }, draft), true);
  assert.equal(triggerValue({ all: [false, { fact: "impact" }] }, draft), false);
  assert.equal(triggerValue({ any: [false, { fact: "impact" }] }, draft), "unknown");
  assert.equal(triggerValue({ all: [true, { fact: "impact" }] }, draft), "unknown");
});

test("unknown risk resolved by migration does not block a compliant draft", () => {
  const draft = clone(base);
  draft.change_profiles = ["migration"];
  draft.review_facts.risk = "unknown";
  draft.risk_and_rollback = { risk: "Migration sequencing.", rollback: "Restore prior data." };
  draft.migration_rollout = "Migrate before switching readers.";
  draft.non_claims = ["This description does not prove deployment readiness."];
  assert.doesNotThrow(() => schemas.validate(draft, P + "schema.json"));
  assert.deepEqual(validatePrd(draft, contract), [
    "Summary", "Context", "Links", "Risk / Rollback", "Migration / Rollout", "Non-Claims",
  ]);
});

test("an unknown rule for a section is resolved by another true rule", () => {
  const draft = clone(base);
  draft.review_facts.impact = "unknown";
  const model = { decision_tree: [
    { when: { fact: "impact" }, include_sections: ["Impact"] },
    { when: true, include_sections: ["Impact"] },
  ] };
  assert.deepEqual(selectedSections(model, draft), { selected: ["Impact"], unresolved: [] });
});

test("an unresolved section still blocks a compliance claim", () => {
  const draft = clone(base);
  draft.review_facts.impact = "unknown";
  assert.throws(() => validatePrd(draft, contract), /Unresolved section facts: Impact/);
});

test("v1 preserves the independent evidence class and result domains", () => {
  const classes = [
    "platform_check", "local_command", "manual_review", "screenshot", "benchmark",
    "linked_report", "render_manifest", "not_available",
  ];
  const results = ["passed", "failed", "observed", "linked", "skipped", "not_run", "not_available"];
  for (const evidence_class of classes) {
    for (const result of results) {
      const draft = clone(base);
      draft.evidence = [{
        gate_id: "compatibility-control",
        evidence_class,
        result,
        claim: "A record for structural compatibility review; external truth is not asserted by this test.",
        scope: { repository: "example/repository", head_ref: "main", head_sha: "a".repeat(40) },
        evidence_ref: "https://example.org/evidence/control",
      }];
      assert.doesNotThrow(() => schemas.validate(draft, P + "schema.json"), `${evidence_class}/${result}`);
      assert.deepEqual(validatePrd(draft, contract), ["Summary", "Context", "Links"]);
    }
  }
});
