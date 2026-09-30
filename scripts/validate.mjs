import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { readData, localPath, sourceFiles, unique } from "./lib/io.mjs";
import { schemaRegistry } from "./lib/schema.mjs";
import { checkProof } from "./lib/logic.mjs";
import { validatePrd, validatePrdModel } from "./lib/prd.mjs";
import { validateRenderManifest } from "./lib/rendered.mjs";
import { validateException } from "./lib/exception.mjs";
import { prdPath, projectCore } from "./lib/runtime.mjs";

const standardPackage = "standards/meta/standard-package/v1/";

function validatePackageAuthority(data, path) {
  const overlap = data.authority.owned_claim_types.filter((claim) =>
    data.authority.forbidden_claim_types.includes(claim),
  );
  if (overlap.length)
    throw new Error(`${path}: package authority owned/forbidden overlap: ${overlap.join(", ")}`);
}

function validateBindingPolicy(data, path) {
  for (const [name, enabled] of Object.entries(data.default_policy))
    if (enabled !== true)
      throw new Error(`${path}: default_policy.${name} is a non-disableable declaration`);
}

export function validateRepository(root) {
  const schema = schemaRegistry(root),
    files = sourceFiles(root),
    parsed = new Map(),
    schemaPairs = new Map();
  const get = (path) => {
    if (!parsed.has(path)) {
      try {
        parsed.set(path, readData(root, path));
      } catch (error) {
        const declarations = [...schemaPairs.values()].filter((row) => row.path === path);
        if (declarations.length)
          throw new Error(`${declarations.map(assignmentLabel).join("; ")}: ${error.message}`);
        throw error;
      }
    }
    return parsed.get(path);
  };
  for (const path of files.filter(
    (x) => x.endsWith(".schema.json") || x.endsWith("/schema.json"),
  ))
    schema.compile(path);
  const bindingPath = "docs/DOCS_CONTRACT.yaml",
    binding = get(bindingPath);
  schema.validate(
    binding,
    "standards/meta/repository-binding/v1/schema.json",
    bindingPath,
  );
  validateBindingPolicy(binding, bindingPath);
  if (binding.binding_owner !== bindingPath)
    throw new Error("Binding owner differs from the selected binding");
  localPath(root, binding.catalog);
  const catalog = get(binding.catalog);
  schema.validate(
    catalog,
    "standards/meta/standards-catalog/v1/schema.json",
    binding.catalog,
  );
  if (catalog.catalog_owner !== binding.catalog)
    throw new Error("Catalog owner differs from binding.catalog");
  unique(
    catalog.standards.map((x) => x.id),
    "catalog IDs",
  );
  const byId = new Map(catalog.standards.map((x) => [x.id, x]));
  unique(
    binding.adopted_standards.map((x) => x.standard),
    "binding standard IDs",
  );
  const schemaByVersion = new Map(),
    proofIds = new Map(),
    proofBundles = new Map();
  let proofs = 0;
  function assignSchema(path, targetSchema, standard, origin) {
    const key = `${path}\0${targetSchema}`;
    if (!schemaPairs.has(key))
      schemaPairs.set(key, { path, targetSchema, origins: new Set() });
    const assignment = schemaPairs.get(key);
    assignment.origins.add(`${standard}: ${origin}`);
    try {
      localPath(root, path);
    } catch (error) {
      throw new Error(`${assignmentLabel(assignment)}: ${error.message}`);
    }
  }
  function assignmentLabel({ path, targetSchema, origins }) {
    return `${path} (schema ${targetSchema}; selected by ${[...origins].join("; ")})`;
  }
  function reference(ref) {
    const [path, fragment, extra] = ref.split("#");
    if (extra !== undefined || !fragment || !proofIds.get(path)?.has(fragment))
      throw new Error(`Missing exact proof: ${ref}`);
  }
  for (const entry of catalog.standards) {
    let manifest;
    for (const key of [
      "path",
      "owner_surface",
      "canonical_schema",
      "agent_entrypoint",
      "semantic_rules",
      "justifications",
    ])
      if (entry[key] != null) localPath(root, entry[key]);
    if (entry.path !== entry.owner_surface)
      throw new Error(`${entry.id}: split prose owner`);
    const bundle = get(entry.justifications);
    schema.validate(
      bundle,
      standardPackage + "justification.schema.json",
      entry.justifications,
    );
    if (bundle.standard !== entry.id)
      throw new Error(`${entry.id}: foreign proof bundle`);
    if (bundle.model_ref !== "docs/FORMAL_MODEL.md")
      throw new Error(`${entry.id}: unknown proof model`);
    localPath(root, bundle.model_ref);
    unique(
      bundle.proofs.map((x) => x.id),
      `${entry.id} proof IDs`,
    );
    if (
      !isDeepStrictEqual(
        [...entry.invariant_ids].sort(),
        bundle.proofs.map((x) => x.id).sort(),
      )
    )
      throw new Error(
        `${entry.id}: incomplete invariant justification coverage`,
      );
    proofIds.set(entry.justifications, new Set(bundle.proofs.map((x) => x.id)));
    proofBundles.set(entry.id, bundle);
    for (const proof of bundle.proofs) {
      checkProof(proof);
      proofs++;
    }
    if (entry.agent_entrypoint) {
      manifest = get(entry.agent_entrypoint);
      schema.validate(
        manifest,
        standardPackage + "schema.json",
        entry.agent_entrypoint,
      );
      if (
        manifest.id !== entry.id ||
        manifest.agent_entrypoint !== entry.agent_entrypoint
      )
        throw new Error(`${entry.id}: invalid selected entrypoint`);
      if (
        (entry.semantic_rules ?? null) !== manifest.validation.semantic_rules ||
        entry.canonical_schema !== manifest.validation.schema ||
        entry.justifications !== manifest.validation.justifications
      )
        throw new Error(`${entry.id}: catalog validation mirror mismatch`);
      validatePackageAuthority(manifest, entry.agent_entrypoint);
    }
    if (entry.canonical_schema) {
      const version = get(entry.canonical_schema).properties?.schema_version
        ?.const;
      if (version) {
        if (
          schemaByVersion.has(version) &&
          schemaByVersion.get(version) !== entry.canonical_schema
        )
          throw new Error(`Ambiguous schema version: ${version}`);
        schemaByVersion.set(version, entry.canonical_schema);
      }
      const folder = entry.path.slice(0, entry.path.lastIndexOf("/") + 1);
      const template = manifest
        ? manifest.validation.template
        : files.includes(folder + "template.yaml")
          ? folder + "template.yaml"
          : null;
      if (template && /\.(json|ya?ml)$/.test(template))
        assignSchema(
          template,
          entry.canonical_schema,
          entry.id,
          manifest ? `${entry.agent_entrypoint} validation.template` : "prose conventional template",
        );
      for (const path of files.filter(
        (x) =>
          x.startsWith(folder + "examples/") && /\.(json|ya?ml)$/.test(x),
      ))
        assignSchema(path, entry.canonical_schema, entry.id, `${folder}examples/`);
    }
  }
  for (const adopted of binding.adopted_standards) {
    const entry = byId.get(adopted.standard);
    if (!entry)
      throw new Error(`Binding adopts absent standard: ${adopted.standard}`);
    if (adopted.owner_surface !== entry.owner_surface)
      throw new Error(
        `Binding owner differs from catalog: ${adopted.standard}`,
      );
    if (adopted.canonical_artifact) {
      if (entry.canonical_schema)
        assignSchema(
          adopted.canonical_artifact,
          entry.canonical_schema,
          entry.id,
          `${bindingPath} canonical_artifact`,
        );
      else localPath(root, adopted.canonical_artifact);
    }
    if (adopted.generated_projection)
      localPath(root, adopted.generated_projection);
  }
  const prdEntry = byId.get("artifact.pull-request-description.v1"),
    prdManifest = get(prdEntry.agent_entrypoint);
  validatePrdModel(prdManifest.agent_contract, get(prdEntry.canonical_schema));
  for (const path of files.filter((x) => /\.(json|ya?ml)$/.test(x))) {
    const data = get(path);
    if (path.endsWith("/standard.yaml")) {
      schema.validate(data, standardPackage + "schema.json", path);
      const entry = byId.get(data.id);
      if (
        !entry ||
        entry.agent_entrypoint !== path ||
        data.agent_entrypoint !== path ||
        entry.owner_surface !== data.owner_surface ||
        entry.status !== data.lifecycle
      )
        throw new Error(`${path}: manifest/catalog identity mismatch`);
      if (
        (entry.semantic_rules ?? null) !== data.validation.semantic_rules ||
        entry.canonical_schema !== data.validation.schema ||
        entry.justifications !== data.validation.justifications
      )
        throw new Error(`${path}: catalog validation mirror mismatch`);
      for (const value of Object.values(data.validation))
        if (value !== null) localPath(root, value);
      for (const row of data.agent_contract.invariants ?? [])
        reference(row.justification_ref);
      if (
        data.id === "meta.agent-operating-kernel.v1" &&
        !isDeepStrictEqual(
          data.agent_contract.invariants.map((x) => x.id).sort(),
          [...entry.invariant_ids].sort(),
        )
      )
        throw new Error("Kernel entrypoint loses an invariant");
      if (data.runtime_contracts) {
        const actual = get(data.runtime_contracts.core),
          expected = projectCore(data, get(data.validation.semantic_rules));
        if (!isDeepStrictEqual(actual, expected))
          throw new Error(
            `${path}: runtime core differs from complete canonical contract`,
          );
        for (const [role, overlayPath] of Object.entries(
          data.runtime_contracts.roles,
        )) {
          const overlay = get(overlayPath);
          schema.validate(
            overlay,
            standardPackage + "runtime.schema.json",
            overlayPath,
          );
          if (
            overlay.role !== role ||
            overlay.standard !== data.id ||
            overlay.requires.core !== data.runtime_contracts.core ||
            overlay.requires.schema !== data.validation.schema
          )
            throw new Error(`${overlayPath}: role/core/schema mismatch`);
          for (const value of Object.values(overlay.requires))
            localPath(root, value);
        }
      }
    }
    if (path.endsWith("/semantic-rules.yaml")) {
      schema.validate(
        data,
        "standards/meta/semantic-rules/v1/schema.json",
        path,
      );
      const entry = byId.get(data.standard);
      if (!entry || entry.semantic_rules !== path)
        throw new Error(
          `${path}: semantic rules are not delegated by their owner`,
        );
      unique(
        data.rules.map((x) => x.id),
        `${path} rule IDs`,
      );
      for (const rule of data.rules) {
        reference(rule.justification_ref);
        if (rule.justification_ref.split("#")[0] !== entry.justifications)
          throw new Error(`${path}: foreign justification owner`);
      }
    }
    const targetSchema = schemaByVersion.get(data?.schema_version);
    if (targetSchema)
      assignSchema(path, targetSchema, "schema_version", data.schema_version);
  }
  for (const assignment of schemaPairs.values()) {
    const { path, targetSchema } = assignment;
    const data = get(path);
    schema.validate(data, targetSchema, assignmentLabel(assignment));
    if (targetSchema === byId.get("meta.standard-package.v1").canonical_schema)
      validatePackageAuthority(data, path);
    if (targetSchema === byId.get("meta.repository-binding.v1").canonical_schema)
      validateBindingPolicy(data, path);
    if (data.artifact_type === "pull_request_description")
      validatePrd(data, prdManifest.agent_contract);
    if (data.artifact_type === "rendered_view")
      validateRenderManifest(data, root);
    if (
      targetSchema === "standards/authority/exception-protocol/v1/schema.json"
    )
      validateException(data);
    if (data.doc_type === "roadmap") {
      unique(
        data.items.map((x) => x.id),
        `${path} item IDs`,
      );
      for (const item of data.items)
        if (
          /\b\d{4}-\d{2}-\d{2}\b/.test(item.planning_claim) &&
          !item.commitment_basis &&
          !data.external_board
        )
          throw new Error(`${path}: exact planning date requires a basis`);
    }
    if (data.artifact_type === "agent_operating_kernel") {
      unique(
        data.invariants.map((x) => x.id),
        `${path} invariant IDs`,
      );
      const kernelEntry = byId.get("meta.agent-operating-kernel.v1"),
        canonical = get(kernelEntry.agent_entrypoint).agent_contract.invariants;
      for (const invariant of data.invariants) {
        if (invariant.owner_surface !== kernelEntry.owner_surface)
          throw new Error(`${path}: kernel owner differs from selected catalog owner`);
        reference(invariant.proof_location);
        const rule = canonical.find((x) => x.id === invariant.id);
        if (
          !rule ||
          rule.statement !== invariant.statement ||
          rule.justification_ref !== invariant.proof_location
        )
          throw new Error(`${path}: kernel statement/proof drift`);
      }
    }
  }
  for (const entry of catalog.standards)
    if (
      !readFileSync(localPath(root, entry.owner_surface), "utf8").includes(
        entry.justifications,
      )
    )
      throw new Error(`${entry.id}: prose does not link its proof owner`);
  for (let i = 1; i <= 10; i++) {
    const id = `KERNEL-${String(i).padStart(3, "0")}`;
    if (
      !proofBundles
        .get("meta.agent-operating-kernel.v1")
        .proofs.some((x) => x.id === id)
    )
      throw new Error(`Missing kernel justification ${id}`);
  }
  const source = readFileSync(
    localPath(root, prdPath + "github-template.md"),
    "utf8",
  );
  if (
    source !==
    readFileSync(localPath(root, ".github/pull_request_template.md"), "utf8")
  )
    throw new Error("Stale PR template projection");
  const required = new Set([
    ...prdManifest.agent_contract.required_sections,
    ...prdManifest.agent_contract.optional_sections,
  ]);
  const headings = new Set(
    [...source.matchAll(/^## (.+)$/gm)].map((x) => x[1]),
  );
  if (!isDeepStrictEqual(headings, required))
    throw new Error("PR template headings differ from contract");
  const workflow = get(".github/workflows/validate.yml");
  if (
    !byId.has("workflow.repository-validation.v1") ||
    !binding.adopted_standards.some(
      (x) => x.standard === "workflow.repository-validation.v1",
    )
  )
    throw new Error("Validation workflow lacks an adopted owner");
  if (
    !isDeepStrictEqual(workflow.permissions, { contents: "read" }) ||
    !isDeepStrictEqual(workflow.on, {
      pull_request: { branches: ["main"] },
      push: { branches: ["main"] },
    })
  )
    throw new Error("Validation workflow trigger/permission drift");
  const job = workflow.jobs.validate;
  for (const [scope, value] of [
    ["job", job],
    ...job.steps.map((step, index) => [`step ${index + 1}`, step]),
  ]) {
    if (Object.hasOwn(value, "if"))
      throw new Error(`Validation workflow conditional execution drift: ${scope}`);
    if (Object.hasOwn(value, "continue-on-error"))
      throw new Error(`Validation workflow result suppression drift: ${scope}`);
  }
  for (const [scope, value] of [
    ["workflow", workflow],
    ["job", job],
    ...job.steps.map((step, index) => [`step ${index + 1}`, step]),
  ])
    for (const field of ["env", "defaults", "shell", "working-directory"])
      if (Object.hasOwn(value, field))
        throw new Error(`Validation workflow command environment drift: ${scope}.${field}`);
  for (const field of ["ref", "repository", "path"])
    if (Object.hasOwn(job.steps[0].with ?? {}, field))
      throw new Error(`Validation workflow checkout target drift: ${field}`);
  if (
    !isDeepStrictEqual(
      job.steps.filter((x) => x.run).map((x) => x.run),
      ["npm ci", "npm run check"],
    )
  )
    throw new Error("Validation workflow command drift");
  if (
    Object.keys(workflow.jobs).length !== 1 ||
    job["runs-on"] !== "ubuntu-latest" ||
    job["timeout-minutes"] !== 10 ||
    job.steps.length !== 4 ||
    !/^actions\/checkout@[0-9a-fA-F]{40}$/.test(job.steps[0].uses) ||
    !isDeepStrictEqual(job.steps[0].with, { "persist-credentials": false }) ||
    !/^actions\/setup-node@[0-9a-fA-F]{40}$/.test(job.steps[1].uses) ||
    !isDeepStrictEqual(job.steps[1].with, {
      "node-version": "24",
      "package-manager-cache": false,
    }) ||
    job.steps.slice(0, 2).some((step) => step.run !== undefined) ||
    job.steps.slice(2).some((step) => step.uses !== undefined) ||
    job.permissions !== undefined ||
    !isDeepStrictEqual(workflow.concurrency, {
      group: "validate-${{ github.workflow }}-${{ github.ref }}",
      "cancel-in-progress": true,
    })
  )
    throw new Error("Validation workflow execution profile drift");
  const packageManifest = get("package.json");
  for (const [name, expected] of Object.entries({
    generate: "node scripts/generate-runtime.mjs",
    validate: "node scripts/validate.mjs",
    test: "node --test",
    check: "npm run validate && npm test",
  }))
    if (packageManifest.scripts?.[name] !== expected)
      throw new Error(`Validation package command drift: ${name}`);
  for (const hook of [
    "precheck", "postcheck", "prevalidate", "postvalidate", "pretest", "posttest",
    "pregenerate", "postgenerate", "preinstall", "install", "postinstall",
    "prepublish", "preprepare", "prepare", "postprepare",
    "predependencies", "dependencies", "postdependencies",
  ])
    if (Object.hasOwn(packageManifest.scripts, hook))
      throw new Error(`Validation package lifecycle hook drift: ${hook}`);
  if (packageManifest.engines?.node !== ">=24")
    throw new Error("Validation package Node engine drift");
  return {
    standards: catalog.standards.length,
    schemaPairs: schemaPairs.size,
    conditionalProofs: proofs,
    nonClaims: [
      "Finite models do not prove their factual premises or natural-language adequacy.",
      "Structural/identity checks do not establish external evidence truth, approvals, or agent execution.",
    ],
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(
      JSON.stringify({
        status: "validation ok",
        ...validateRepository(process.cwd()),
      }),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
