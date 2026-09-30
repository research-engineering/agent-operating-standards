import test from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stringify } from "yaml";
import { readData } from "../scripts/lib/io.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generator = join(root, "scripts/generate-runtime.mjs");
const P = "standards/artifacts/pull-request-description/v1/";
const manifestPath = P + "standard.yaml";
const corePath = P + "runtime/core.contract.yaml";
const packageSchema = "standards/meta/standard-package/v1/schema.json";
const rulesSchema = "standards/meta/semantic-rules/v1/schema.json";
const manifest = readData(root, manifestPath);
const inputPaths = [...new Set([
  manifestPath,
  packageSchema,
  rulesSchema,
  manifest.owner_surface,
  ...Object.values(manifest.validation).filter((path) => path !== null),
  ...Object.values(manifest.runtime_contracts.roles),
])];
const inputs = new Map(inputPaths.map((path) => [path, readFileSync(join(root, path))]));

function write(dir, path, value) {
  const full = join(dir, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, typeof value === "string" ? value :
    path.endsWith(".json") ? JSON.stringify(value, null, 2) : stringify(value));
}

function fixture(run) {
  const dir = mkdtempSync(join(tmpdir(), "runtime-generation-"));
  try {
    for (const [path, bytes] of inputs) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), bytes);
    }
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function change(dir, path, mutate) {
  const value = readData(dir, path);
  mutate(value);
  write(dir, path, value);
}

function run(dir, preload = "", args = [generator]) {
  const options = [];
  if (preload) {
    write(dir, "preload.mjs", preload);
    options.push("--import", pathToFileURL(join(dir, "preload.mjs")).href);
  }
  return spawnSync(process.execPath, [...options, ...args], {
    cwd: dir,
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, NODE_OPTIONS: "" },
  });
}

function passed(result) {
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
}

function rejected(dir, pattern) {
  const result = run(dir, `
    import fs from "node:fs";
    import { syncBuiltinESMExports } from "node:module";
    const open = fs.openSync;
    fs.openSync = function(path, flags, ...args) {
      if (String(flags).includes("w")) {
        fs.writeFileSync("unexpected-output-open", "reached");
        throw new Error("OUTPUT_OPEN_REACHED");
      }
      return open(path, flags, ...args);
    };
    syncBuiltinESMExports();
  `);
  assert.ifError(result.error);
  assert.notEqual(result.status, 0, "invalid input was accepted");
  assert.match(result.stderr, pattern);
  assert.equal(existsSync(join(dir, "unexpected-output-open")), false);
}

function assertCore(dir) {
  const core = readData(dir, corePath);
  const source = readData(dir, manifestPath);
  assert.deepEqual(core.agent_contract, source.agent_contract);
  assert.deepEqual(core.semantic_rules, readData(dir, P + "semantic-rules.yaml").rules);
  assert.equal(core.schema_version, "agent-operating-standards.runtime-contract/v1");
  assert.equal(core.standard, "artifact.pull-request-description.v1");
  assert.equal(core.contract_type, "normative_core");
  assert.equal(core.role, "core");
  assert.equal(core.source_manifest, manifestPath);
  assert.equal(core.artifact_schema, P + "schema.json");
  assert.deepEqual(core.non_claims, [
    "This generated core preserves declared rules; it does not prove facts, authorizations, or compliance of an external agent.",
  ]);
}

test("importing the generator does not read or mutate a checkout", () => {
  const dir = mkdtempSync(join(tmpdir(), "runtime-import-"));
  try {
    passed(run(dir, "", ["--input-type=module", "--eval", `await import(${JSON.stringify(pathToFileURL(generator).href)})`]));
    assert.deepEqual(readdirSync(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI creates an absent core, repairs stale output and is byte-idempotent", () => fixture((dir) => {
  assert.equal(existsSync(join(dir, corePath)), false);
  passed(run(dir));
  assertCore(dir);
  const expected = readFileSync(join(dir, corePath));
  write(dir, corePath, "stale: projection\n");
  passed(run(dir));
  assert.deepEqual(readFileSync(join(dir, corePath)), expected);
  passed(run(dir));
  assert.deepEqual(readFileSync(join(dir, corePath)), expected);
}));

for (const kind of ["absolute", "traversal", "dot", "backslash", "empty component"]) {
  test(`CLI rejects ${kind} output before opening it`, () => fixture((dir) => {
    const sentinel = join(dir, "sentinel");
    writeFileSync(sentinel, "preserve");
    const path = {
      absolute: sentinel,
      traversal: "sub/../sentinel",
      dot: "./sentinel",
      backslash: "sub\\sentinel",
      "empty component": "sub//sentinel",
    }[kind];
    change(dir, manifestPath, (data) => { data.runtime_contracts.core = path; });
    rejected(dir, /Invalid repository-relative output path/);
    assert.equal(readFileSync(sentinel, "utf8"), "preserve");
  }));
}

for (const kind of ["leaf", "parent", "dangling leaf"]) {
  test(`CLI rejects a symlink ${kind} without changing its target`, () => fixture((dir) => {
    write(dir, "targets/sentinel", "preserve");
    const output = kind === "parent" ? "link/sentinel" : "link";
    const target = kind === "parent" ? "targets" : kind === "leaf" ? "targets/sentinel" : "targets/absent";
    symlinkSync(target, join(dir, "link"));
    change(dir, manifestPath, (data) => { data.runtime_contracts.core = output; });
    rejected(dir, /Symbolic links are not admitted in output/);
    assert.equal(readFileSync(join(dir, "targets/sentinel"), "utf8"), "preserve");
    assert.equal(existsSync(join(dir, "targets/absent")), false);
  }));
}

for (const kind of ["missing parent", "file parent", "directory leaf"]) {
  test(`CLI rejects an output with ${kind}`, () => fixture((dir) => {
    write(dir, "file", "preserve");
    const output = { "missing parent": "absent/core.yaml", "file parent": "file/core.yaml", "directory leaf": P + "runtime" }[kind];
    change(dir, manifestPath, (data) => { data.runtime_contracts.core = output; });
    rejected(dir, /existing directory|absent or a regular file/);
    assert.equal(readFileSync(join(dir, "file"), "utf8"), "preserve");
    assert.equal(existsSync(join(dir, "absent")), false);
  }));
}

for (const source of inputPaths) {
  for (const alias of ["path", "hard link"]) {
    test(`CLI rejects ${alias} output alias of ${source}`, () => fixture((dir) => {
      const output = alias === "path" ? source : corePath;
      change(dir, manifestPath, (data) => { data.runtime_contracts.core = output; });
      if (alias === "hard link") linkSync(join(dir, source), join(dir, output));
      const before = readFileSync(join(dir, source));
      rejected(dir, /Output aliases source/);
      assert.deepEqual(readFileSync(join(dir, source)), before);
      assert.deepEqual(readFileSync(join(dir, output)), before);
    }));
  }
}

for (const [label, path, mutate, error] of [
  ["manifest shape", manifestPath, (data) => { delete data.agent_contract; }, /agent_contract/],
  ["manifest identity", manifestPath, (data) => { data.id = "artifact.other.v1"; }, /identity\/routing mismatch/],
  ["manifest entrypoint", manifestPath, (data) => { data.agent_entrypoint = P + "other.yaml"; }, /identity\/routing mismatch/],
  ["schema routing", manifestPath, (data) => { data.validation.schema = packageSchema; }, /identity\/routing mismatch/],
  ["rules routing", manifestPath, (data) => { data.validation.semantic_rules = "elsewhere.yaml"; }, /identity\/routing mismatch/],
  ["rules shape", P + "semantic-rules.yaml", (data) => { data.rules[0].check = null; }, /must be string/],
  ["rules identity", P + "semantic-rules.yaml", (data) => { data.standard = "artifact.other.v1"; }, /different standard/],
  ["duplicate rule IDs", P + "semantic-rules.yaml", (data) => { data.rules[1].id = data.rules[0].id; }, /duplicate values/],
  ["foreign proof owner", P + "semantic-rules.yaml", (data) => { data.rules[0].justification_ref = "foreign.yaml#PRD-SEM-001"; }, /foreign proof owner/],
  ["artifact schema", P + "schema.json", (data) => { data.type = "not-a-type"; }, /schema is invalid/],
]) {
  test(`CLI rejects invalid ${label} before output opens`, () => fixture((dir) => {
    write(dir, corePath, "preserve\n");
    change(dir, path, mutate);
    rejected(dir, error);
    assert.equal(readFileSync(join(dir, corePath), "utf8"), "preserve\n");
  }));
}

test("CLI rejects duplicate raw manifest keys before output opens", () => fixture((dir) => {
  write(dir, corePath, "preserve\n");
  write(dir, manifestPath, readFileSync(join(dir, manifestPath), "utf8") + "id: artifact.other.v1\n");
  rejected(dir, /unique/);
  assert.equal(readFileSync(join(dir, corePath), "utf8"), "preserve\n");
}));

test("CLI preserves an existing mode despite restrictive umask", () => fixture((dir) => {
  write(dir, corePath, "stale\n");
  chmodSync(join(dir, corePath), 0o640);
  passed(run(dir, "process.umask(0o077);"));
  assertCore(dir);
  assert.equal(statSync(join(dir, corePath)).mode & 0o7777, 0o640);
  passed(run(dir, "process.umask(0o077);"));
  assert.equal(statSync(join(dir, corePath)).mode & 0o7777, 0o640);
}));

test("CLI creation mode respects process umask", () => fixture((dir) => {
  passed(run(dir, "process.umask(0o027);"));
  assert.equal(statSync(join(dir, corePath)).mode & 0o7777, 0o640);
}));

for (const mode of [0o000, 0o200]) {
  test(`CLI preserves mode ${mode.toString(8)} without requiring pathname read access`, () => fixture((dir) => {
    write(dir, corePath, "previous\n");
    chmodSync(join(dir, corePath), mode);
    passed(run(dir));
    assert.equal(statSync(join(dir, corePath)).mode & 0o7777, mode);
    chmodSync(join(dir, corePath), 0o600);
    assertCore(dir);
  }));
}

test("exclusive temporary collision preserves a file the attempt does not own", () => fixture((dir) => {
  write(dir, corePath, "previous\n");
  const collision = join(dirname(join(dir, corePath)), ".core.contract.yaml.occupied.tmp");
  writeFileSync(collision, "not owned");
  const result = run(dir, `
    import crypto from "node:crypto";
    import { syncBuiltinESMExports } from "node:module";
    crypto.randomUUID = () => "occupied";
    syncBuiltinESMExports();
  `);
  assert.ifError(result.error);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /EEXIST/);
  assert.equal(readFileSync(collision, "utf8"), "not owned");
  assert.equal(readFileSync(join(dir, corePath), "utf8"), "previous\n");
}));

for (const failure of ["partial write", "rename", "readback"]) {
  test(`CLI ${failure} failure preserves previous bytes and mode, cleans only its temporary`, () => fixture((dir) => {
    write(dir, corePath, "previous complete output\n");
    chmodSync(join(dir, corePath), 0o604);
    const sibling = dirname(join(dir, corePath));
    writeFileSync(join(sibling, ".core.contract.yaml.unrelated.tmp"), "keep unrelated");
    const before = readdirSync(sibling).sort();
    const preload = `
      import fs from "node:fs";
      import { syncBuiltinESMExports } from "node:module";
      const failure = ${JSON.stringify(failure)};
      const originalWrite = fs.writeFileSync;
      const originalRead = fs.readSync;
      const originalOpen = fs.openSync;
      let outputFd;
      fs.openSync = function(path, flags, ...args) {
        const fd = originalOpen(path, flags, ...args);
        if (String(flags).includes("w")) outputFd = fd;
        return fd;
      };
      fs.writeFileSync = function(path, ...args) {
        if (failure === "partial write" && typeof path === "number") {
          fs.writeSync(path, "partial output");
          throw new Error("INJECTED_PARTIAL_WRITE");
        }
        return originalWrite(path, ...args);
      };
      if (failure === "rename") fs.renameSync = () => { throw new Error("INJECTED_RENAME"); };
      fs.readSync = function(fd, buffer, offset, length, position) {
        if (failure === "readback" && fd === outputFd) {
          buffer.fill(0, offset, offset + length);
          return length;
        }
        return originalRead(fd, buffer, offset, length, position);
      };
      syncBuiltinESMExports();
    `;
    const result = run(dir, preload);
    assert.ifError(result.error);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /INJECTED_PARTIAL_WRITE|INJECTED_RENAME|Temporary output differs/);
    assert.equal(readFileSync(join(dir, corePath), "utf8"), "previous complete output\n");
    assert.equal(statSync(join(dir, corePath)).mode & 0o7777, 0o604);
    assert.deepEqual(readdirSync(sibling).sort(), before);
    assert.equal(readFileSync(join(sibling, ".core.contract.yaml.unrelated.tmp"), "utf8"), "keep unrelated");
  }));
}
