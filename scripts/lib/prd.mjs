export const fieldForSection = {
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
};
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
