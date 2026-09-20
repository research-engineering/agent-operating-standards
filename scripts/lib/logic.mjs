const operations = new Set(["all", "any", "not", "implies"]);
function atoms(expression, result = new Set()) {
  if (typeof expression === "string") result.add(expression);
  else if (typeof expression !== "boolean") {
    if (
      !expression ||
      Array.isArray(expression) ||
      Object.keys(expression).length !== 1
    )
      throw new Error("Invalid formula");
    const [op] = Object.keys(expression);
    if (!operations.has(op)) throw new Error(`Unknown logical operator: ${op}`);
    const terms = op === "not" ? [expression[op]] : expression[op];
    if (
      !Array.isArray(terms) ||
      !terms.length ||
      (op === "implies" && terms.length !== 2)
    )
      throw new Error(`Invalid ${op} operands`);
    for (const term of terms) atoms(term, result);
  }
  return result;
}
export function evaluate(expression, assignment) {
  if (typeof expression === "boolean") return expression;
  if (typeof expression === "string") {
    if (typeof assignment[expression] !== "boolean")
      throw new Error(`Missing Boolean atom: ${expression}`);
    return assignment[expression];
  }
  if ("all" in expression)
    return expression.all.every((x) => evaluate(x, assignment));
  if ("any" in expression)
    return expression.any.some((x) => evaluate(x, assignment));
  if ("not" in expression) return !evaluate(expression.not, assignment);
  if ("implies" in expression)
    return (
      !evaluate(expression.implies[0], assignment) ||
      evaluate(expression.implies[1], assignment)
    );
  throw new Error("Unknown formula");
}
export function checkProof(proof) {
  const used = new Set();
  for (const premise of proof.premises) atoms(premise.formula, used);
  atoms(proof.conclusion, used);
  const names = [...used].sort();
  if (names.length > 12) throw new Error(`${proof.id}: model exceeds 12 atoms`);
  if (
    JSON.stringify(names) !==
    JSON.stringify(Object.keys(proof.definitions).sort())
  )
    throw new Error(
      `${proof.id}: definitions do not exactly cover formula atoms`,
    );
  let satisfying = 0;
  for (let bits = 0; bits < 2 ** names.length; bits++) {
    const assignment = Object.fromEntries(
      names.map((name, i) => [name, Boolean(bits & (2 ** i))]),
    );
    if (proof.premises.every((p) => evaluate(p.formula, assignment))) {
      satisfying++;
      if (!evaluate(proof.conclusion, assignment))
        throw new Error(
          `${proof.id}: countermodel ${JSON.stringify(assignment)}`,
        );
    }
  }
  if (!satisfying)
    throw new Error(`${proof.id}: vacuous proof from inconsistent premises`);
  const witness = proof.countermodel,
    index = witness.removed_premise;
  if (!Number.isInteger(index) || index < 0 || index >= proof.premises.length)
    throw new Error(`${proof.id}: invalid removed premise`);
  if (
    JSON.stringify(Object.keys(witness.assignment).sort()) !==
    JSON.stringify(names)
  )
    throw new Error(`${proof.id}: countermodel atoms differ`);
  if (
    evaluate(proof.conclusion, witness.assignment) ||
    evaluate(proof.premises[index].formula, witness.assignment) ||
    !proof.premises.every(
      (p, i) => i === index || evaluate(p.formula, witness.assignment),
    )
  )
    throw new Error(`${proof.id}: invalid countermodel for removed premise`);
  return { satisfying, valuations: 2 ** names.length };
}
