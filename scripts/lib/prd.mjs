export const fieldForSection = Object.freeze({
  Summary: "summary",
  Context: "context",
  Impact: "impact",
  Changes: "changes",
  Links: "links",
  Evidence: "evidence",
  "Risk / Rollback": "risk_and_rollback",
  "Migration / Rollout": "migration_rollout",
  "Security / Privacy": "security_privacy",
  "Visual Evidence": "visual_evidence",
  "Non-Claims": "non_claims",
  "Review Focus": "review_focus",
});

const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function modelError(message) {
  throw new Error(`PR decision model: ${message}`);
}

function vocabularyError(message) {
  throw new Error(`Unsupported PR schema vocabulary profile: ${message}`);
}

function stringSet(values, label, fail, allowEmpty = false, allowDuplicates = false) {
  if (
    !Array.isArray(values) ||
    (!allowEmpty && values.length === 0) ||
    values.some((value) => typeof value !== "string" || !value.trim()) ||
    (!allowDuplicates && new Set(values).size !== values.length)
  )
    fail(`${label} must be an array of unique nonblank strings`);
  return new Set(values);
}

function directEnum(node, label) {
  const allowed = new Set([
    "enum", "type", "title", "description", "$comment", "default", "examples",
    "deprecated", "readOnly", "writeOnly",
  ]);
  if (!record(node) || Object.keys(node).some((key) => !allowed.has(key)))
    vocabularyError(`${label} must declare a direct enum without composition`);
  return stringSet(node.enum, label, vocabularyError);
}

function prdVocabulary(schema) {
  if (
    !record(schema) ||
    schema.type !== "object" ||
    !record(schema.properties) ||
    "$ref" in schema || "$dynamicRef" in schema
  )
    vocabularyError("expected direct top-level object properties");
  const properties = schema.properties;
  const facts = properties.review_facts;
  if (
    !record(facts) || facts.type !== "object" || !record(facts.properties) ||
    ["$ref", "$dynamicRef", "allOf", "anyOf", "oneOf", "if", "then", "else", "not"]
      .some((key) => key in facts)
  )
    vocabularyError("expected direct review_facts object properties");
  const factNames = stringSet(Object.keys(facts.properties), "review_facts", vocabularyError);
  for (const [name, node] of Object.entries(facts.properties)) {
    if (
      !record(node) || !Array.isArray(node.enum) || node.enum.length !== 3 ||
      ![true, false, "unknown"].every((value) => node.enum.includes(value)) ||
      Object.keys(node).some((key) => !["enum", "title", "description", "$comment"].includes(key))
    )
      vocabularyError(`review_facts.${name} must declare exactly true, false and unknown`);
  }
  const profiles = properties.change_profiles;
  if (
    !record(profiles) || profiles.type !== "array" ||
    ["$ref", "$dynamicRef", "allOf", "anyOf", "oneOf", "if", "then", "else", "not"]
      .some((key) => key in profiles)
  )
    vocabularyError("expected direct change_profiles.items.enum");
  return {
    fact: factNames,
    profile: directEnum(profiles.items, "change_profiles.items.enum"),
    readiness: directEnum(properties.readiness_state, "readiness_state.enum"),
    urgency: directEnum(properties.urgency, "urgency.enum"),
    absent: new Set(Object.keys(properties)),
  };
}

export function validatePrdModel(contract, artifactSchema) {
  const vocabulary = prdVocabulary(artifactSchema);
  if (!record(contract)) modelError("expected an agent contract");
  const required = stringSet(contract.required_sections, "required_sections", modelError);
  const optional = stringSet(contract.optional_sections, "optional_sections", modelError, true);
  const sections = new Set([...required, ...optional]);
  if (sections.size !== required.size + optional.size)
    modelError("required and optional sections must be disjoint");
  const mappedFields = new Set();
  for (const section of sections) {
    if (!Object.hasOwn(fieldForSection, section))
      modelError(`unmapped section: ${section}`);
    const field = fieldForSection[section];
    if (!vocabulary.absent.has(field))
      modelError(`section ${section} maps to missing artifact field: ${field}`);
    if (mappedFields.has(field)) modelError(`duplicate section field: ${field}`);
    mappedFields.add(field);
  }
  for (const section of Object.keys(fieldForSection))
    if (!sections.has(section)) modelError(`mapped section is undeclared: ${section}`);

  function predicate(expression, location) {
    if (typeof expression === "boolean") return;
    if (!record(expression) || Object.keys(expression).length !== 1)
      modelError(`${location} must be Boolean or a single-operator predicate`);
    const [[operator, value]] = Object.entries(expression);
    if (operator === "any" || operator === "all") {
      if (!Array.isArray(value) || value.length === 0)
        modelError(`${location}.${operator} must contain at least one predicate`);
      value.forEach((child, index) => predicate(child, `${location}.${operator}[${index}]`));
    } else if (!Object.hasOwn(vocabulary, operator)) {
      modelError(`${location} has unknown predicate operator: ${operator}`);
    } else if (typeof value !== "string" || !vocabulary[operator].has(value)) {
      modelError(`${location} has unknown ${operator} leaf: ${String(value)}`);
    }
  }

  if (!Array.isArray(contract.decision_tree) || contract.decision_tree.length === 0)
    modelError("decision_tree must contain at least one rule");
  const covered = new Set();
  contract.decision_tree.forEach((rule, index) => {
    const location = `decision_tree[${index}]`;
    if (!record(rule)) modelError(`${location} must be a rule object`);
    predicate(rule.when, `${location}.when`);
    for (const section of stringSet(rule.include_sections, `${location}.include_sections`, modelError, false, true)) {
      if (!sections.has(section)) modelError(`${location} selects undeclared section: ${section}`);
      covered.add(section);
    }
  });
  for (const section of sections)
    if (!covered.has(section)) modelError(`section has no decision rule: ${section}`);
  return true;
}

export function triggerValue(expression, draft) {
  if (typeof expression === "boolean") return expression;
  if ("any" in expression) {
    const values = expression.any.map((x) => triggerValue(x, draft));
    return values.includes(true)
      ? true
      : values.includes("unknown")
        ? "unknown"
        : false;
  }
  if ("all" in expression) {
    const values = expression.all.map((x) => triggerValue(x, draft));
    return values.includes(false)
      ? false
      : values.includes("unknown")
        ? "unknown"
        : true;
  }
  if ("fact" in expression)
    return draft.review_facts?.[expression.fact] ?? "unknown";
  if ("profile" in expression)
    return draft.change_profiles.includes(expression.profile);
  if ("readiness" in expression)
    return draft.readiness_state === expression.readiness;
  if ("urgency" in expression) return draft.urgency === expression.urgency;
  if ("absent" in expression) return draft[expression.absent] === undefined;
  throw new Error("Unknown section predicate");
}
export function selectedSections(contract, draft) {
  const state = new Map();
  for (const rule of contract.decision_tree) {
    const value = triggerValue(rule.when, draft);
    for (const section of rule.include_sections) {
      const previous = state.get(section) ?? false;
      state.set(
        section,
        previous === true || value === true
          ? true
          : previous === "unknown" || value === "unknown"
            ? "unknown"
            : false,
      );
    }
  }
  return {
    selected: [...state].filter(([, v]) => v === true).map(([k]) => k),
    unresolved: [...state].filter(([, v]) => v === "unknown").map(([k]) => k),
  };
}
export function validatePrd(draft, contract) {
  for (const field of ["title", "summary", "context"])
    if (typeof draft[field] !== "string" || !draft[field].trim())
      throw new Error(`PRD-SEM-001: ${field} must contain a nonblank answer`);
  const { selected, unresolved } = selectedSections(contract, draft);
  if (unresolved.length)
    throw new Error(`Unresolved section facts: ${unresolved.join(", ")}`);
  for (const [section, field] of Object.entries(fieldForSection)) {
    if (selected.includes(section) && draft[field] === undefined)
      throw new Error(`Missing triggered section: ${section}`);
    if (
      !selected.includes(section) &&
      field !== "evidence" &&
      draft[field] !== undefined
    )
      throw new Error(`Untriggered visible section: ${section}`);
  }
  return selected;
}
