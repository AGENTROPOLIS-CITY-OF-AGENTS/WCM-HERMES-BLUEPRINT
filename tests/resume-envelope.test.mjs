import test from 'node:test';
import assert from 'node:assert/strict';
import { compile, errorsOf } from './helpers/schema.mjs';
import { resumeViolations } from '../src/resume-envelope-check.mjs';
import { envelope, resume, proposal, now } from './fixtures/hermes.mjs';

const validEnvelope = compile('hermes-execution-envelope.schema.json');
const validResume = compile('hermes-resume-request.schema.json');
const validProposal = compile('hermes-fastpath-proposal.schema.json');

test('fixtures validate against their schemas', () => {
  assert.ok(validEnvelope(envelope), errorsOf(validEnvelope));
  assert.ok(validResume(resume), errorsOf(validResume));
  assert.ok(validProposal(proposal), errorsOf(validProposal));
  assert.deepEqual(resumeViolations(envelope, resume, now), []);
});

test('execution envelope is AEGIS-issued and bounded', () => {
  assert.equal(validEnvelope({ ...envelope, issuer: 'HERMES' }), false);
  assert.equal(validEnvelope({ ...envelope, issuer: 'FASTPATH' }), false);
  const { expires_at, ...noExpiry } = envelope;
  assert.equal(validEnvelope(noExpiry), false);
  const { budget, ...noBudget } = envelope;
  assert.equal(validEnvelope(noBudget), false);
  assert.equal(validEnvelope({ ...envelope, allowed_capabilities: ['*'] }), false);
});

test('FASTPATH output is a non-executable proposal that requires the Policy gate', () => {
  assert.equal(validProposal({ ...proposal, executable: true }), false);
  assert.equal(validProposal({ ...proposal, authority_class: 'EXECUTION' }), false);
  assert.equal(validProposal({ ...proposal, requires_policy_gate: false }), false);
  assert.equal(validProposal({ ...proposal, validator: { outcome: 'passed' }, confidence: 1.5 }), false);
  const { envelope_id, ...unbound } = proposal;
  assert.equal(validProposal(unbound), false);
});

test('resume request must reference the original envelope and re-enter Policy', () => {
  const { original_envelope_id, ...detached } = resume;
  assert.equal(validResume(detached), false);
  assert.equal(validResume({ ...resume, policy_reentry: 'skipped' }), false);
  assert.equal(validResume({ ...resume, policy_reentry: 'cached' }), false);
  assert.equal(validResume({ ...resume, authority_source: 'acquired_capability' }), false);
});

test('resume request cannot carry its own authority fields', () => {
  assert.equal(validResume({ ...resume, allowed_capabilities: ['spend_funds'] }), false);
  assert.equal(validResume({ ...resume, denied_capabilities: [] }), false);
  assert.equal(validResume({ ...resume, expires_at: '2030-01-01T00:00:00.000Z' }), false);
  assert.equal(validResume({ ...resume, budget: { max_actions: 999999, max_reasoning_tokens: 1 } }), false);
  assert.equal(validResume({ ...resume, approval_required: false }), false);
});

test('resume cannot widen scope beyond the original envelope', () => {
  const widened = { ...resume, acquired_capabilities: ['publish_external'], requested_capabilities: ['web_research', 'publish_external'] };
  assert.ok(validResume(widened), 'widened request is well-formed; the check must catch it');
  assert.deepEqual(resumeViolations(envelope, widened, now), ['RESUME_CAPABILITY_DENIED']);

  const novel = { ...resume, acquired_capabilities: ['send_email'], requested_capabilities: ['send_email'] };
  assert.deepEqual(resumeViolations(envelope, novel, now), ['RESUME_CAPABILITY_WIDENED']);

  const otherEnvelope = { ...resume, original_envelope_id: 'env_job42_replacement' };
  assert.deepEqual(resumeViolations(envelope, otherEnvelope, now), ['RESUME_ENVELOPE_MISMATCH']);
});

test('resume cannot exceed the original budget', () => {
  const overActions = { ...resume, budget_requested: { actions: 61, reasoning_tokens: 0 } };
  assert.deepEqual(resumeViolations(envelope, overActions, now), ['RESUME_BUDGET_EXCEEDED']);
  const overTokens = { ...resume, budget_requested: { actions: 0, reasoning_tokens: 30001 } };
  assert.deepEqual(resumeViolations(envelope, overTokens, now), ['RESUME_BUDGET_EXCEEDED']);
  assert.equal(validResume({ ...resume, budget_requested: { actions: -5, reasoning_tokens: 0 } }), false);
});

test('resume cannot outlive the original envelope expiry', () => {
  const late = { ...resume, resumed_at: '2026-09-21T06:00:01.000Z' };
  assert.deepEqual(resumeViolations(envelope, late, new Date('2026-09-21T06:00:02.000Z')), ['RESUME_ENVELOPE_EXPIRED']);
  assert.deepEqual(resumeViolations(envelope, resume, new Date('2026-09-21T07:00:00.000Z')), ['RESUME_ENVELOPE_EXPIRED']);
});
