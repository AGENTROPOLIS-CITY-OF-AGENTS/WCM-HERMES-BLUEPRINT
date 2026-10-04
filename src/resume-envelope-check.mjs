/**
 * Pure invariant check for a Hermes resume against its ORIGINAL Execution Envelope.
 * Reference semantics for the planned Policy gate; no runtime in this repository calls it.
 * Returns a list of violation codes; an empty list means the resume stays inside the envelope.
 */
export function resumeViolations(envelope, resume, now = new Date()) {
  const violations = [];
  if (resume.original_envelope_id !== envelope.envelope_id) violations.push('RESUME_ENVELOPE_MISMATCH');
  if (resume.job_id !== envelope.job_id) violations.push('RESUME_JOB_MISMATCH');
  if (resume.policy_reentry !== 'required') violations.push('RESUME_POLICY_REENTRY_MISSING');

  const allowed = new Set(envelope.allowed_capabilities);
  const denied = new Set(envelope.denied_capabilities);
  for (const cap of resume.requested_capabilities) {
    if (denied.has(cap)) violations.push('RESUME_CAPABILITY_DENIED');
    else if (!allowed.has(cap)) violations.push('RESUME_CAPABILITY_WIDENED');
  }

  const consumed = resume.budget_consumed;
  const requested = resume.budget_requested;
  if (consumed.actions + requested.actions > envelope.budget.max_actions) violations.push('RESUME_BUDGET_EXCEEDED');
  if (consumed.reasoning_tokens + requested.reasoning_tokens > envelope.budget.max_reasoning_tokens) violations.push('RESUME_BUDGET_EXCEEDED');

  const expires = Date.parse(envelope.expires_at);
  const resumedAt = Date.parse(resume.resumed_at);
  if (!(resumedAt < expires) || !(now.getTime() < expires)) violations.push('RESUME_ENVELOPE_EXPIRED');

  return [...new Set(violations)];
}
