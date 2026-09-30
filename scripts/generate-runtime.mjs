import {
  closeSync,
  fchmodSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { basename, dirname, isAbsolute, resolve, win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { parseDocument, stringify } from "yaml";
import { localPath, readData, unique } from "./lib/io.mjs";
import { projectCore, prdPath } from "./lib/runtime.mjs";
import { schemaRegistry } from "./lib/schema.mjs";

const manifestPath = prdPath + "standard.yaml";
const packageSchema = "standards/meta/standard-package/v1/schema.json";
const rulesSchema = "standards/meta/semantic-rules/v1/schema.json";

function outputDestination(root, path, sources) {
  if (
    typeof path !== "string" ||
    !path ||
    isAbsolute(path) ||
    win32.isAbsolute(path) ||
    path.includes("\\") ||
    path.includes("\0") ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw new Error(`Invalid repository-relative output path: ${path}`);
  const parts = path.split("/");
  let full = resolve(root), existing;
  for (const [index, part] of parts.entries()) {
    full = resolve(full, part);
    const last = index === parts.length - 1;
    const stat = lstatSync(full, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink())
      throw new Error(`Symbolic links are not admitted in output: ${path}`);
    if (!last && !stat?.isDirectory())
      throw new Error(`Output parent must be an existing directory: ${path}`);
    if (last) {
      if (stat && !stat.isFile())
        throw new Error(`Output must be absent or a regular file: ${path}`);
      existing = stat;
    }
  }
  for (const source of sources) {
    const sourceFull = localPath(root, source);
    const sourceStat = lstatSync(sourceFull);
    if (
      full === sourceFull ||
      (existing &&
        existing.dev === sourceStat.dev &&
        existing.ino === sourceStat.ino)
    )
      throw new Error(`Output aliases source ${source}: ${path}`);
  }
  return { full, mode: existing ? existing.mode & 0o7777 : undefined };
}

function replaceOutput({ full, mode }, bytes) {
  const temporary = resolve(
    dirname(full),
    `.${basename(full)}.${randomUUID()}.tmp`,
  );
  let fd, ownedTemporary = false;
  const errors = [];
  try {
    fd = openSync(temporary, "wx+", mode ?? 0o666);
    ownedTemporary = true;
    writeFileSync(fd, bytes);
    const actual = Buffer.alloc(bytes.length);
    let offset = 0;
    while (offset < actual.length) {
      const count = readSync(fd, actual, offset, actual.length - offset, offset);
      if (!count) throw new Error("Temporary output is incomplete");
      offset += count;
    }
    if (fstatSync(fd).size !== bytes.length || !actual.equals(bytes))
      throw new Error("Temporary output differs from validated bytes");
    if (mode !== undefined) fchmodSync(fd, mode);
    const closing = fd;
    fd = undefined;
    closeSync(closing);
    renameSync(temporary, full);
    ownedTemporary = false;
  } catch (error) {
    errors.push(error);
  } finally {
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch (error) {
        errors.push(error);
      }
    }
    if (ownedTemporary) {
      try {
        unlinkSync(temporary);
      } catch (error) {
        errors.push(error);
      }
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1)
    throw new AggregateError(errors, "Generation failed, including cleanup");
}

export function generateRuntime(root = process.cwd()) {
  const manifest = readData(root, manifestPath);
  const schema = schemaRegistry(root);
  schema.validate(manifest, packageSchema, manifestPath);
  if (
    manifest.id !== "artifact.pull-request-description.v1" ||
    manifest.agent_entrypoint !== manifestPath ||
    manifest.owner_surface !== prdPath + "standard.md" ||
    manifest.validation.schema !== prdPath + "schema.json" ||
    manifest.validation.semantic_rules !== prdPath + "semantic-rules.yaml" ||
    manifest.validation.justifications !== prdPath + "proofs.yaml" ||
    !manifest.runtime_contracts
  )
    throw new Error(`${manifestPath}: generator identity/routing mismatch`);
  const rules = readData(root, manifest.validation.semantic_rules);
  schema.validate(rules, rulesSchema, manifest.validation.semantic_rules);
  if (rules.standard !== manifest.id)
    throw new Error("Semantic rules name a different standard");
  unique(rules.rules.map((rule) => rule.id), "Semantic rule IDs");
  for (const rule of rules.rules)
    if (rule.justification_ref.split("#")[0] !== manifest.validation.justifications)
      throw new Error(`Semantic rule ${rule.id} names a foreign proof owner`);
  schema.compile(manifest.validation.schema);
  const sources = new Set([
    manifestPath,
    packageSchema,
    rulesSchema,
    manifest.owner_surface,
    ...Object.values(manifest.validation).filter((path) => path !== null),
    ...Object.values(manifest.runtime_contracts.roles),
  ]);
  const destination = outputDestination(root, manifest.runtime_contracts.core, sources);
  const expected = projectCore(manifest, rules);
  const serialized =
    "# Generated by npm run generate. Edit the declared source owners.\n" +
    stringify(expected, { lineWidth: 110, aliasDuplicateObjects: false });
  const document = parseDocument(serialized, {
    version: "1.2",
    uniqueKeys: true,
    strict: true,
    stringKeys: true,
  });
  if (
    document.errors.length ||
    document.warnings.length ||
    !isDeepStrictEqual(document.toJS({ maxAliasCount: 0 }), expected)
  )
    throw new Error("Serialized output differs from the complete runtime core");
  replaceOutput(destination, Buffer.from(serialized));
  return manifest.runtime_contracts.core;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateRuntime();
}
