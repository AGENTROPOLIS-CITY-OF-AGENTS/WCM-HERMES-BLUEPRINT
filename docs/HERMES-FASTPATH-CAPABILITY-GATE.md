# Hermes FASTPATH + Capability Acquisition

Hermes remains planner and exception handler. Bounded repetitive decisions should be delegated instead of repeatedly consuming the general reasoning loop.

## Runtime pattern

```text
TASK
 -> HERMES PLAN
 -> known bounded decision?
      yes -> FASTPATH specialist -> validator -> execute
      no  -> Hermes reasoning
 -> missing capability?
      yes -> Capability Acquisition Gate -> approve -> connect -> resume
 -> verify result
 -> exception only -> Hermes
```

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
- layout drift changes semantics
- a consequential action appears
- credentials or authority would be widened
- a new capability requests broader scope than the task requires

## Drift benchmark

Run the same task after field reorder, label rename, layout change, optional/required field changes, control-type changes, and injected error states.

Track wrong-field rate, retries, actions, reasoning calls, reasoning tokens, completion time, validation failures, recovery success, and layout fingerprint drift.
