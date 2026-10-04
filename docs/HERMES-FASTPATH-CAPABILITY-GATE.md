# Hermes FASTPATH + Capability Acquisition

Hermes remains planner and exception handler. Bounded repetitive decisions should be delegated instead of repeatedly consuming the general reasoning loop.

Neither FASTPATH nor capability acquisition is a source of authority. Authority comes only from the job's Execution Envelope (`allowed_capabilities`, `denied_capabilities`, `approval_required`, budget, expiry — see `HERMES_BUZZ_INTEGRATION.md`) as evaluated by Policy. Specialist output, validator output, cognitive profile, confidence, reputation, UI state and external evidence are Policy inputs only; they never grant authority.

## Runtime pattern

```text
TASK
 -> HERMES PLAN
 -> AEGIS Execution Envelope issued (scope, budget, expiry)      [planned]
 -> known bounded decision?
      yes -> FASTPATH specialist -> validator
                -> POLICY GATE (envelope check)                   [planned]
                     allow  -> execute
                     deny   -> Hermes (exception)
      no  -> Hermes reasoning -> POLICY GATE -> execute
 -> missing capability?
      yes -> Capability Acquisition Gate -> human approve -> connect
                -> RESUME re-enters POLICY GATE against the
                   ORIGINAL envelope (same scope, budget, expiry)  [planned]
                     inside envelope   -> continue
                     outside envelope  -> Hermes (exception)
 -> verify result
 -> exception only -> Hermes
```

### FASTPATH never bypasses Policy

A validated specialist decision is a *proposal*. Every action that would be executed, whether it came from a FASTPATH specialist or from Hermes reasoning, passes through the same Policy gate that checks the action against the job's Execution Envelope before execution. The validator checks that the proposal is well-formed and matches the task; it does not authorize anything.

Status: **planned**. This repository is a blueprint; the gate is not enforced by any runtime in this repository. The wire shape the gate consumes is machine-checked here by `schemas/hermes-execution-envelope.schema.json` and `tests/resume-envelope.test.mjs`.

### Capability acquisition never widens authority

Connecting a new capability makes an operation *available*; it does not make it *allowed*. On resume:

1. The resumed action re-enters Policy evaluation. Nothing that happened before the pause is treated as pre-authorized.
2. Policy evaluates the resumed action against the **original** Execution Envelope, not a new one. The resume request must reference the original envelope by id, and:
   - `allowed_capabilities` of the resumed action ⊆ original `allowed_capabilities`;
   - nothing in original `denied_capabilities` becomes allowed;
   - budget consumed + requested ≤ original budget;
   - the original `expires_at` still applies; a resume after expiry fails closed.
3. If the newly connected capability is not already in the original `allowed_capabilities`, the resume is refused and returned to Hermes as an exception. Widening scope requires a new Execution Envelope issued by AEGIS with human approval; a resume can never widen authority.

Status: **planned** for runtime enforcement. The resume invariants (same scope, same budget ceiling, same expiry, mandatory Policy re-entry) are machine-checked at the schema level in this repository by `schemas/hermes-resume-request.schema.json` and `tests/resume-envelope.test.mjs`, so a blueprint change that relaxes them fails CI.

## First specialist class

Identity and form matching:

- email
- name
- phone
- organization
- known URLs
- file paths
- supplied dropdown values
- routine settings

Hermes should retrieve known values from structured context and avoid re-deriving them.

## Escalation

Return to Hermes when:

- multiple fields are plausible
- confidence falls below policy threshold
- validation fails
- the Policy gate denies a FASTPATH proposal
- a resume falls outside the original Execution Envelope
- layout drift changes semantics
- a consequential action appears
- credentials or authority would be widened
- a new capability requests broader scope than the task requires

## Drift benchmark

Run the same task after field reorder, label rename, layout change, optional/required field changes, control-type changes, and injected error states.

Track wrong-field rate, retries, actions, reasoning calls, reasoning tokens, completion time, validation failures, recovery success, and layout fingerprint drift.
