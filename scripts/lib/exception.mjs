export function validateException(record) {
  if (
    record.allowed_claim_types.some((x) =>
      record.forbidden_claim_types.includes(x),
    )
  )
    throw new Error("Exception allowed and forbidden claim types overlap");
}
// The caller supplies independently verified authority/scope/event facts.
export function exceptionValidity(
  record,
  { now, approvalVerified, scopeMatches, claimType, triggerReached } = {},
) {
  validateException(record);
  if (record.status !== "approved") return "invalid";
  if (
    typeof record.approval_ref !== "string" ||
    !record.approval_ref.trim() ||
    typeof record.approval_authority !== "string" ||
    !record.approval_authority.trim()
  )
    return "invalid";
  if (
    approvalVerified === false ||
    scopeMatches === false ||
    triggerReached === true
  )
    return "invalid";
  if (
    claimType !== undefined &&
    (!record.allowed_claim_types.includes(claimType) ||
      record.forbidden_claim_types.includes(claimType))
  )
    return "invalid";
  const time = Date.parse(now),
    expiry = Date.parse(record.valid_until);
  const review =
    record.review_by === undefined
      ? Infinity
      : Date.parse(`${record.review_by}T00:00:00Z`);
  if (
    !Number.isFinite(time) ||
    !Number.isFinite(expiry) ||
    Number.isNaN(review)
  )
    return "unresolved";
  if (time >= Math.min(expiry, review)) return "invalid";
  if (
    approvalVerified !== true ||
    scopeMatches !== true ||
    typeof claimType !== "string" ||
    triggerReached !== false
  )
    return "unresolved";
  return "valid";
}
