export const prdPath = "standards/artifacts/pull-request-description/v1/";
export function projectCore(manifest, rules) {
  return {
    schema_version: "agent-operating-standards.runtime-contract/v1",
    standard: manifest.id,
    contract_type: "normative_core",
    role: "core",
    source_manifest: manifest.agent_entrypoint,
    artifact_schema: manifest.validation.schema,
    agent_contract: manifest.agent_contract,
    semantic_rules: rules.rules,
    non_claims: [
      "This generated core preserves declared rules; it does not prove facts, authorizations, or compliance of an external agent.",
    ],
  };
}
