export const envelope = Object.freeze({
  envelope_id: 'env_job42_original',
  job_id: 'job-42',
  issuer: 'AEGIS',
  allowed_capabilities: ['read_files', 'web_research', 'write_workspace'],
  denied_capabilities: ['write_production', 'publish_external', 'spend_funds'],
  approval_required: false,
  budget: { max_actions: 100, max_reasoning_tokens: 50000 },
  issued_at: '2026-09-21T04:00:00.000Z',
  expires_at: '2026-09-21T06:00:00.000Z'
});

export const resume = Object.freeze({
  resume_id: 'res_job42_after_connect',
  original_envelope_id: 'env_job42_original',
  job_id: 'job-42',
  acquired_capabilities: ['web_research'],
  requested_capabilities: ['web_research', 'write_workspace'],
  budget_consumed: { actions: 40, reasoning_tokens: 20000 },
  budget_requested: { actions: 10, reasoning_tokens: 5000 },
  policy_reentry: 'required',
  authority_source: 'original_envelope',
  resumed_at: '2026-09-21T05:00:00.000Z'
});

export const proposal = Object.freeze({
  proposal_id: 'fp_job42_field_match',
  envelope_id: 'env_job42_original',
  job_id: 'job-42',
  specialist: 'identity-form-matcher',
  capability: 'write_workspace',
  confidence: 0.98,
  validator: { outcome: 'passed' },
  authority_class: 'PROPOSAL',
  executable: false,
  requires_policy_gate: true
});

export const now = new Date('2026-09-21T05:00:30.000Z');
