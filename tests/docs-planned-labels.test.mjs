import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const doc = readFileSync(new URL('../docs/HERMES-FASTPATH-CAPABILITY-GATE.md', import.meta.url), 'utf8');

test('FASTPATH path routes through a Policy gate before execute', () => {
  assert.match(doc, /FASTPATH specialist -> validator\s*\n\s*-> POLICY GATE/);
  assert.doesNotMatch(doc, /validator -> execute/);
});

test('resume re-enters Policy against the original envelope', () => {
  assert.match(doc, /RESUME re-enters POLICY GATE/);
  assert.match(doc, /ORIGINAL envelope \(same scope, budget, expiry\)/);
  assert.doesNotMatch(doc, /connect -> resume\s*$/m);
});

test('runtime-unenforced controls are labeled planned, not claimed as enforced', () => {
  assert.match(doc, /POLICY GATE \(envelope check\)\s+\[planned\]/);
  assert.match(doc, /ORIGINAL envelope \(same scope, budget, expiry\)\s+\[planned\]/);
  assert.ok((doc.match(/Status: \*\*planned\*\*/g) ?? []).length >= 2);
  assert.doesNotMatch(doc, /\benforced at runtime\b(?! .*planned)/);
});
