import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { localPath, unique } from "./io.mjs";
export const sha256 = (bytes) =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
export function aggregate(entries) {
  unique(
    entries.map((x) => x.path),
    "render paths",
  );
  const pairs = entries
    .map((x) => [x.path, x.digest])
    .sort((a, b) => Buffer.compare(Buffer.from(a[0]), Buffer.from(b[0])));
  return sha256(JSON.stringify(pairs));
}
// Validates local bytes and identity consistency, not remote attestation truth.
export function validateRenderManifest(manifest, root) {
  unique(
    manifest.sources.map((x) => x.path),
    "render sources",
  );
  unique(
    manifest.outputs.map((x) => x.path),
    "render outputs",
  );
  if (manifest.freshness.status !== "current") return;
  const v = manifest.freshness.verification;
  if (!v)
    throw new Error(
      "Current freshness requires a render relation verification",
    );
  const source = aggregate(manifest.sources),
    output = aggregate(manifest.outputs);
  if (
    source !== manifest.freshness.source_digest ||
    output !== manifest.freshness.output_digest ||
    v.source_digest !== source ||
    v.output_digest !== output ||
    v.renderer_digest !== manifest.renderer.identity_digest ||
    v.config_digest !== manifest.renderer.config_digest
  )
    throw new Error("Render relation identity mismatch");
  for (const item of [...manifest.sources, ...manifest.outputs])
    if (sha256(readFileSync(localPath(root, item.path))) !== item.digest)
      throw new Error(`Render byte mismatch: ${item.path}`);
}
