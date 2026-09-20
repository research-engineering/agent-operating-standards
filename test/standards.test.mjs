import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { readData, sourceFiles } from "../scripts/lib/io.mjs";
import { schemaRegistry } from "../scripts/lib/schema.mjs";
import { checkProof, evaluate } from "../scripts/lib/logic.mjs";
import {
  selectedSections,
  validatePrd,
  triggerValue,
} from "../scripts/lib/prd.mjs";
import {
  exceptionValidity,
  validateException,
} from "../scripts/lib/exception.mjs";
import {
  aggregate,
  sha256,
  validateRenderManifest,
} from "../scripts/lib/rendered.mjs";
import { validateRepository } from "../scripts/validate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = "standards/artifacts/pull-request-description/v1/";
const K = "standards/meta/agent-operating-kernel/v1/";
const R = "standards/artifacts/roadmap/v1/";
const V = "standards/artifacts/rendered-view/v1/";
const E = "standards/authority/exception-protocol/v1/";
const S = "standards/meta/standard-package/v1/";
const schemas = schemaRegistry(root),
  get = (p) => readData(root, p),
  clone = structuredClone;
const contract = get(P + "standard.yaml").agent_contract;
const base = get(P + "examples/minimal.yaml");
function write(root, path, value) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(
    join(root, path),
    stringify(value, { aliasDuplicateObjects: false }),
  );
}
function copyRepository(run) {
  const dir = mkdtempSync(join(tmpdir(), "operating-standards-test-"));
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
function mutated(path, change, pattern) {
  copyRepository((dir) => {
    const d = readData(dir, path);
    change(d);
    write(dir, path, d);
    assert.throws(() => validateRepository(dir), pattern);
  });
}
function draft(overrides = {}) {
  const d = clone(base);
  delete d.links;
  d.review_facts.external_owner = false;
  return Object.assign(d, overrides);
}

// Positive end-to-end gate and independent schema regression witnesses.
test("every declared owner/artifact/proof validates", () => {
  const result = validateRepository(root);
  assert.equal(result.standards, 11);
  assert.equal(result.conditionalProofs, 51);
  assert.ok(result.schemaPairs >= 29);
});
test("the real PR manifest satisfies the closed package schema", () =>
  schemas.validate(get(P + "standard.yaml"), S + "schema.json"));
for (const [field, value] of [
  ["changes", 42],
  ["links", "not-an-array"],
  ["evidence", []],
  ["review_focus", 42],
]) {
  test(`F07 schema rejects ${field} with a formerly accepted wrong shape`, () => {
    const d = draft({ [field]: value });
    assert.throws(() => schemas.validate(d, P + "schema.json"));
  });
}
test("F07 whole repository rejects missing roadmap items", () =>
  mutated("docs/planning/roadmap.yaml", (d) => delete d.items, /items/));
test("F11 optional roadmap fields have real schemas", () => {
  const d = get(R + "examples/minimal.yaml");
  d.risks = [
    {
      id: "risk-1",
      description: "Unknown downstream timing.",
      owner: "maintainer",
    },
  ];
  d.dependencies = [{ item: "RM-001", depends_on: "external-owner" }];
  d.rendering = { format: "markdown", output: "ROADMAP.md" };
  schemas.validate(d, R + "schema.json");
  d.rendering.unrecognized = true;
  assert.throws(
    () => schemas.validate(d, R + "schema.json"),
    /additional properties/,
  );
});
test("F12 exact scheduling dates need a basis", () =>
  mutated(
    "docs/planning/roadmap.yaml",
    (d) => (d.items[0].planning_claim = "Plan the change for 2027-01-02."),
    /date requires a basis/,
  ));
test("F12 last_reviewed is not a scheduling commitment", () =>
  schemas.validate(get(R + "examples/minimal.yaml"), R + "schema.json"));
test("F15 named missing catalog is rejected", () =>
  mutated(
    "docs/DOCS_CONTRACT.yaml",
    (d) => (d.catalog = "missing-catalog.yaml"),
    /ENOENT/,
  ));
test("F15 an explicitly selected alternate catalog is actually used", () =>
  copyRepository((dir) => {
    const c = readData(dir, "standards.catalog.yaml");
    c.catalog_owner = "docs/alternate-catalog.yaml";
    write(dir, "docs/alternate-catalog.yaml", c);
    const b = readData(dir, "docs/DOCS_CONTRACT.yaml");
    b.catalog = c.catalog_owner;
    b.adopted_standards.find(
      (x) => x.standard === "meta.standards-catalog.v1",
    ).canonical_artifact = c.catalog_owner;
    write(dir, "docs/DOCS_CONTRACT.yaml", b);
    assert.equal(validateRepository(dir).standards, 11);
  }));
for (const value of [null, undefined])
  test(`F16 ${value === null ? "null" : "absent"} mirror cannot hide a rule owner`, () =>
    mutated(
      "standards.catalog.yaml",
      (d) => {
        const e = d.standards.find(
          (x) => x.id === "artifact.pull-request-description.v1",
        );
        if (value === undefined) delete e.semantic_rules;
        else e.semantic_rules = value;
      },
      /mirror mismatch/,
    ));
test("binding cannot silently change a catalog owner", () =>
  mutated(
    "docs/DOCS_CONTRACT.yaml",
    (d) => (d.adopted_standards[0].owner_surface = "README.md"),
    /owner differs/,
  ));
test("catalog cannot route an executable entrypoint to prose", () =>
  mutated(
    "standards.catalog.yaml",
    (d) => (d.standards[0].agent_entrypoint = "README.md"),
    /expected|data|README|mapping|collection|scalar/i,
  ));

// Independent expected policy, deliberately not obtained from the selection helper.
for (const readiness of ["draft", "blocked", "ready_for_review"])
  for (const urgency of ["normal", "emergency"]) {
    test(`F08/F17 readiness=${readiness}, urgency=${urgency}`, () => {
      const d = draft({ readiness_state: readiness, urgency });
      const expected = ["Summary", "Context"];
      if (readiness !== "ready_for_review")
        expected.push("Non-Claims", "Review Focus");
      if (urgency === "emergency")
        expected.push("Risk / Rollback", "Non-Claims");
      assert.deepEqual(
        new Set(selectedSections(contract, d).selected),
        new Set(expected),
      );
      if (readiness !== "ready_for_review") {
        d.non_claims = ["Work is not ready."];
        d.review_focus = ["Review the proposal; implementation is pending."];
      }
      if (urgency === "emergency") {
        d.risk_and_rollback = {
          risk: "Limited incident verification.",
          rollback: "Revert the change.",
        };
        d.non_claims = ["Emergency review does not imply full validation."];
      }
      schemas.validate(d, P + "schema.json");
      validatePrd(d, contract);
    });
  }
test("F09 trivial reversible user-facing/dependency work has no automatic risk section", () => {
  const d = draft({ change_profiles: ["dependency"] });
  d.review_facts.impact = true;
  d.impact = { audience: ["users"], description: "Corrects a visible label." };
  assert.ok(
    !selectedSections(contract, d).selected.includes("Risk / Rollback"),
  );
  validatePrd(d, contract);
  d.risk_and_rollback = { risk: "Routine filler.", rollback: "Revert." };
  assert.throws(() => validatePrd(d, contract), /Untriggered.*Risk/);
});
test("explicit material risk has one positive decision", () => {
  const d = draft();
  d.review_facts.risk = true;
  assert.ok(selectedSections(contract, d).selected.includes("Risk / Rollback"));
  assert.throws(() => validatePrd(d, contract), /Missing.*Risk/);
});
for (const profile of ["migration", "release", "generated", "security"])
  test(`profile ${profile} composes with normal ready work`, () => {
    const d = draft({ change_profiles: [profile] });
    const selected = new Set(selectedSections(contract, d).selected);
    if (["migration", "release"].includes(profile)) {
      assert.ok(selected.has("Risk / Rollback"));
      assert.ok(selected.has("Migration / Rollout"));
      assert.ok(selected.has("Non-Claims"));
    }
    if (profile === "generated") {
      assert.ok(selected.has("Links"));
      assert.ok(selected.has("Non-Claims"));
    }
    if (profile === "security") assert.ok(selected.has("Security / Privacy"));
  });
test("all 16 profile combinations preserve the union of independent obligations", () => {
  const profiles = ["security", "migration", "release", "generated"];
  for (let mask = 0; mask < 16; mask++) {
    const chosen = profiles.filter((_, i) => mask & (1 << i)),
      d = draft({ change_profiles: chosen.length ? chosen : ["other"] });
    const expected = new Set(["Summary", "Context"]);
    if (chosen.includes("security")) expected.add("Security / Privacy");
    if (chosen.some((p) => p === "migration" || p === "release")) {
      expected.add("Risk / Rollback");
      expected.add("Migration / Rollout");
      expected.add("Non-Claims");
    }
    if (chosen.includes("generated")) {
      expected.add("Links");
      expected.add("Non-Claims");
    }
    assert.deepEqual(new Set(selectedSections(contract, d).selected), expected);
  }
});
test("F17 old emergency labels are rejected instead of silently bypassing obligations", () => {
  for (const change of [
    { change_profiles: ["emergency"] },
    { readiness_state: "emergency" },
  ])
    assert.throws(() => schemas.validate(draft(change), P + "schema.json"));
});
test("F10 routine passing evidence can be retained without being displayed", () => {
  const d = draft({
    evidence: [
      {
        gate_id: "unit",
        evidence_class: "platform_check",
        claim: "The bounded unit suite passed.",
        result: "passed",
        scope: {
          repository: "example/repository",
          head_ref: "feature/test",
          head_sha: "a".repeat(40),
        },
        evidence_ref: "https://example.org/evidence/immutable-run-1",
      },
    ],
  });
  schemas.validate(d, P + "schema.json");
  validatePrd(d, contract);
  assert.ok(!selectedSections(contract, d).selected.includes("Evidence"));
  d.review_facts.visible_evidence = true;
  assert.ok(selectedSections(contract, d).selected.includes("Evidence"));
  validatePrd(d, contract);
});
test("F19 positive evidence needs immutable target identity and a resolvable reference shape", () => {
  const d = draft({
    evidence: [
      {
        gate_id: "test",
        evidence_class: "local_command",
        claim: "Passed.",
        result: "passed",
        scope: { head_ref: "feature/test" },
      },
    ],
  });
  assert.throws(() => schemas.validate(d, P + "schema.json"));
  d.evidence[0].scope = {
    repository: "example/repo",
    head_ref: "feature/test",
    head_sha: "b".repeat(40),
  };
  assert.throws(() => schemas.validate(d, P + "schema.json"), /evidence_ref/);
  d.evidence[0].evidence_ref = "https://example.org/run/42";
  schemas.validate(d, P + "schema.json");
});
test("unknown facts remain unresolved, and a true disjunct can resolve a section", () => {
  const d = draft();
  d.review_facts.risk = "unknown";
  assert.throws(() => validatePrd(d, contract), /Unresolved.*Risk/);
  d.urgency = "emergency";
  assert.ok(
    !selectedSections(contract, d).unresolved.includes("Risk / Rollback"),
  );
  assert.equal(triggerValue({ all: [false, { fact: "risk" }] }, d), false);
  assert.equal(triggerValue({ any: [true, { fact: "risk" }] }, d), true);
});
test("F08 core equals complete agent instructions and all semantic rules without using the producer projection helper", () => {
  const c = get(P + "runtime/core.contract.yaml");
  assert.deepEqual(c.agent_contract, get(P + "standard.yaml").agent_contract);
  assert.deepEqual(c.semantic_rules, get(P + "semantic-rules.yaml").rules);
  for (const role of ["producer", "reviewer", "renderer"])
    assert.equal(
      get(P + `runtime/${role}.overlay.yaml`).requires.schema,
      P + "schema.json",
    );
});
test("F08 deleting a draft trigger from generated core is detected", () =>
  mutated(
    P + "runtime/core.contract.yaml",
    (d) =>
      (d.agent_contract.decision_tree = d.agent_contract.decision_tree.filter(
        (x) => x.id !== "focus",
      )),
    /runtime core differs/,
  ));
test("F08 changing one semantic core sentence is detected", () =>
  mutated(
    P + "runtime/core.contract.yaml",
    (d) => (d.semantic_rules[0].check = "Ignore the context."),
    /runtime core differs/,
  ));
test("an overlay cannot declare its own validity rules", () =>
  mutated(
    P + "runtime/reviewer.overlay.yaml",
    (d) => (d.rules = ["Require an arbitrary new section."]),
    /additional properties/,
  ));

// Proof kernels: negative consequences and inconsistency cannot pass by shape.
test("F02 every registered proof has a non-vacuous finite model", () => {
  const catalog = get("standards.catalog.yaml");
  for (const entry of catalog.standards) {
    const b = get(entry.justifications);
    assert.deepEqual(
      new Set(entry.invariant_ids),
      new Set(b.proofs.map((x) => x.id)),
    );
    for (const p of b.proofs) assert.ok(checkProof(p).satisfying > 0);
  }
});
test("F02 missing proof location is rejected", () =>
  mutated(
    K + "template.yaml",
    (d) => delete d.invariants[0].proof_location,
    /proof_location/,
  ));
test("F02 deleting an invariant justification is detected", () =>
  mutated(
    K + "proofs.yaml",
    (d) => d.proofs.pop(),
    /incomplete invariant justification coverage/,
  ));
test("a false conclusion cannot be certified", () => {
  const p = get(K + "proofs.yaml").proofs[0];
  p.conclusion = false;
  assert.throws(() => checkProof(p), /countermodel/);
});
test("an inconsistent premise set is not a proof", () => {
  const p = get(K + "proofs.yaml").proofs[0];
  p.premises.push({
    formula: false,
    basis: "accepted_policy",
    rationale: "Contradiction.",
  });
  assert.throws(() => checkProof(p), /vacuous/);
});
test("a fabricated countermodel is rejected", () => {
  const p = get(K + "proofs.yaml").proofs[0];
  p.countermodel.assignment.use = false;
  assert.throws(() => checkProof(p), /countermodel/);
});
test("F01 protocol existence and agent compliance are not a biconditional", () => {
  assert.equal(
    evaluate(
      { implies: ["consistent", "protocol"] },
      { consistent: true, protocol: false },
    ),
    false,
  );
  assert.equal(
    evaluate(
      { implies: ["protocol", "consistent"] },
      { consistent: false, protocol: true },
    ),
    false,
  );
});
test("F04 deterministic reachability proves a semantic property", () => {
  const relation = [
      [0, 0],
      [1, 1],
    ],
    reached = new Set([0]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [a, b] of relation)
      if (reached.has(a) && !reached.has(b)) {
        reached.add(b);
        changed = true;
      }
  }
  assert.deepEqual([...reached], [0]);
  assert.ok(!reached.has(1));
});

// Freshness separates knowledge, identity and externally verified relation truth.
test("F13 unknown manifest is accepted without falsely asserting stale", () => {
  const d = get(V + "examples/minimal.yaml");
  schemas.validate(d, V + "schema.json");
  validateRenderManifest(d, root);
  assert.equal(d.freshness.status, "unknown");
});
test("F14 old arbitrary current digest strings are rejected", () => {
  const d = get(V + "examples/minimal.yaml");
  Object.assign(d.freshness, {
    status: "current",
    checked_at: "2026-09-20T10:00:00Z",
    source_digest: "sha256:" + "0".repeat(64),
    output_digest: "sha256:" + "1".repeat(64),
  });
  assert.throws(() => schemas.validate(d, V + "schema.json"));
});
test("render aggregate is independently specified and insensitive to input enumeration order", () => {
  const entries = [
    { path: "b", digest: "sha256:" + "b".repeat(64) },
    { path: "a", digest: "sha256:" + "a".repeat(64) },
  ];
  assert.equal(
    aggregate(entries),
    sha256(
      JSON.stringify([
        ["a", "sha256:" + "a".repeat(64)],
        ["b", "sha256:" + "b".repeat(64)],
      ]),
    ),
  );
  assert.equal(aggregate(entries), aggregate([...entries].reverse()));
  assert.throws(() => aggregate([...entries, entries[0]]), /duplicate/);
});
test("F14 current relation checks each independent operand and output bytes", () => {
  const dir = mkdtempSync(join(tmpdir(), "render-relation-test-"));
  try {
    writeFileSync(join(dir, "source.txt"), "source");
    writeFileSync(join(dir, "output.txt"), "output");
    const d = get(V + "examples/minimal.yaml");
    d.sources = [
      { path: "source.txt", role: "canonical", digest: sha256("source") },
    ];
    d.outputs = [
      { path: "output.txt", format: "other", digest: sha256("output") },
    ];
    d.renderer.identity_digest = sha256("renderer");
    d.renderer.config_digest = sha256("{}");
    const source = aggregate(d.sources),
      output = aggregate(d.outputs);
    d.freshness = {
      status: "current",
      checked_at: "2026-09-20T10:00:00Z",
      source_digest: source,
      output_digest: output,
      verification: {
        method: "independent_reproduction",
        verifier: "external-verifier",
        evidence_ref: "https://example.org/attestation/1",
        source_digest: source,
        output_digest: output,
        renderer_digest: d.renderer.identity_digest,
        config_digest: d.renderer.config_digest,
      },
    };
    schemas.validate(d, V + "schema.json");
    validateRenderManifest(d, dir);
    for (const field of [
      "source_digest",
      "output_digest",
      "renderer_digest",
      "config_digest",
    ]) {
      const bad = clone(d);
      bad.freshness.verification[field] = sha256("different");
      assert.throws(
        () => validateRenderManifest(bad, dir),
        /identity mismatch/,
      );
    }
    writeFileSync(join(dir, "output.txt"), "changed");
    assert.throws(() => validateRenderManifest(d, dir), /byte mismatch/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Exception records are not authorization, even when structurally valid.
test("F18 intersecting permission sets are rejected", () => {
  const d = get(E + "template.yaml");
  d.forbidden_claim_types.push("intent");
  schemas.validate(d, E + "schema.json");
  assert.throws(() => validateException(d), /overlap/);
});
test("F18 event-only lifetime has no schema admission", () => {
  const d = get(E + "template.yaml");
  delete d.valid_until;
  assert.throws(() => schemas.validate(d, E + "schema.json"), /valid_until/);
});
test("F18 explicit approval, action scope, event and time are independent necessary operands", () => {
  const d = get(E + "template.yaml");
  Object.assign(d, {
    status: "approved",
    approval_ref: "https://example.org/approval/1",
    approval_authority: "authorized-owner",
  });
  schemas.validate(d, E + "schema.json");
  const context = {
    now: "2026-09-20T10:00:00Z",
    approvalVerified: true,
    scopeMatches: true,
    claimType: "intent",
    triggerReached: false,
  };
  assert.equal(exceptionValidity(d, context), "valid");
  for (const field of [
    "approvalVerified",
    "scopeMatches",
    "claimType",
    "triggerReached",
    "now",
  ]) {
    const unknown = { ...context };
    delete unknown[field];
    assert.equal(exceptionValidity(d, unknown), "unresolved");
  }
  for (const change of [
    { approvalVerified: false },
    { scopeMatches: false },
    { claimType: "security" },
    { triggerReached: true },
    { now: d.valid_until },
  ])
    assert.equal(exceptionValidity(d, { ...context, ...change }), "invalid");
  for (const status of ["proposed", "revoked", "expired"])
    assert.equal(exceptionValidity({ ...d, status }, context), "invalid");
  assert.equal(
    exceptionValidity({ ...d, review_by: "2026-09-20" }, context),
    "invalid",
  );
});
test("F20 removing the adopted workflow owner fails", () =>
  mutated(
    "docs/DOCS_CONTRACT.yaml",
    (d) =>
      (d.adopted_standards = d.adopted_standards.filter(
        (x) => x.standard !== "workflow.repository-validation.v1",
      )),
    /workflow lacks/,
  ));
test("F20 an unadmitted write permission fails", () =>
  mutated(
    ".github/workflows/validate.yml",
    (d) => (d.permissions.contents = "write"),
    /permission drift/,
  ));
test("parsers reject duplicate keys in both YAML and JSON", () => {
  const dir = mkdtempSync(join(tmpdir(), "parse-test-"));
  try {
    for (const [file, text] of [
      ["a.yaml", "a: 1\na: 2\n"],
      ["a.json", '{"a":1,"a":2}'],
    ]) {
      writeFileSync(join(dir, file), text);
      assert.throws(() => readData(dir, file), /unique/);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("catalog references cannot escape through traversal or symlinks", () => {
  copyRepository((dir) => {
    const b = readData(dir, "docs/DOCS_CONTRACT.yaml");
    b.catalog = "../outside.yaml";
    write(dir, "docs/DOCS_CONTRACT.yaml", b);
    assert.throws(() => validateRepository(dir), /Invalid repository-relative/);
  });
  const dir = mkdtempSync(join(tmpdir(), "symlink-test-"));
  try {
    symlinkSync(join(root, "standards.catalog.yaml"), join(dir, "alias.yaml"));
    assert.throws(() => readData(dir, "alias.yaml"), /Symbolic links/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the obsolete per-evidence display switch cannot contradict section selection", () => {
  const d = draft({
    evidence: [
      {
        gate_id: "unit",
        evidence_class: "not_available",
        claim: "Not run.",
        result: "not_available",
        scope: {
          repository: "example/repo",
          head_ref: "feature/x",
          head_sha: "a".repeat(40),
        },
        display_policy: "show_always",
      },
    ],
  });
  assert.throws(
    () => schemas.validate(d, P + "schema.json"),
    /additional properties/,
  );
});
test("the admitted workflow runtime and checkout boundaries cannot silently drift", () => {
  mutated(
    ".github/workflows/validate.yml",
    (d) => (d.jobs.validate.steps[1].with["node-version"] = "22"),
    /execution profile drift/,
  );
  mutated(
    ".github/workflows/validate.yml",
    (d) => (d.jobs.validate.steps[0].with["persist-credentials"] = true),
    /execution profile drift/,
  );
});

test("a comparison evidence record cannot bind only a mutable base reference", () => {
  const d = draft({
    evidence: [
      {
        gate_id: "comparison",
        evidence_class: "linked_report",
        claim: "Compared the two revisions.",
        result: "linked",
        scope: {
          repository: "example/repo",
          head_ref: "feature/x",
          head_sha: "a".repeat(40),
          base_ref: "main",
        },
        evidence_ref: "https://example.org/run/1",
      },
    ],
  });
  assert.throws(() => schemas.validate(d, P + "schema.json"), /base_sha/);
  d.evidence[0].scope.base_sha = "b".repeat(40);
  schemas.validate(d, P + "schema.json");
});
test("an approved label without an approval record cannot grant exception authority", () => {
  const d = get(E + "template.yaml");
  d.status = "approved";
  assert.equal(
    exceptionValidity(d, {
      now: "2026-09-20T10:00:00Z",
      approvalVerified: true,
      scopeMatches: true,
      claimType: "intent",
      triggerReached: false,
    }),
    "invalid",
  );
});
