import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
let failed = false;

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

if (failed) {
  process.exitCode = 1;
} else {
  console.log("validation ok");
}
