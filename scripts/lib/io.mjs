import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { parseDocument } from "yaml";

export function localPath(root, path) {
  if (
    typeof path !== "string" ||
    !path ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.split("/").some((x) => !x || x === "." || x === "..")
  )
    throw new Error(`Invalid repository-relative path: ${path}`);
  const full = resolve(root, path);
  if (relative(root, full).startsWith(`..${sep}`))
    throw new Error(`Path escapes repository: ${path}`);
  let current = resolve(root);
  for (const component of path.split("/")) {
    current = resolve(current, component);
    if (lstatSync(current).isSymbolicLink())
      throw new Error(`Symbolic links are not admitted: ${path}`);
  }
  if (!lstatSync(full).isFile())
    throw new Error(`Expected a regular file: ${path}`);
  return full;
}

export function readData(root, path) {
  const source = readFileSync(localPath(root, path), "utf8");
  const document = parseDocument(source, {
    version: "1.2",
    uniqueKeys: true,
    strict: true,
    stringKeys: true,
  });
  if (document.errors.length || document.warnings.length)
    throw new Error(
      `${path}: ${[...document.errors, ...document.warnings].map((e) => e.message).join("; ")}`,
    );
  const value = document.toJS({ maxAliasCount: 0 });
  if (path.endsWith(".json")) JSON.parse(source);
  return value;
}

export function sourceFiles(root, directory = "") {
  const result = [];
  for (const name of readdirSync(resolve(root, directory)).sort()) {
    if ([".git", "node_modules"].includes(name)) continue;
    const path = directory ? `${directory}/${name}` : name;
    const stat = lstatSync(resolve(root, path));
    if (stat.isSymbolicLink())
      throw new Error(`Symbolic links are not admitted: ${path}`);
    if (stat.isDirectory()) result.push(...sourceFiles(root, path));
    else if (stat.isFile()) result.push(path);
  }
  return result;
}

export function unique(values, label) {
  if (new Set(values).size !== values.length)
    throw new Error(`${label}: duplicate values`);
}
