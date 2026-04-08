<!--
## Sync Impact Report
- **Version change**: 0.0.0 → 1.0.0 (initial ratification)
- **Added principles**:
  - I. Code Quality
  - II. Testing Standards
  - III. User Experience Consistency
  - IV. Performance Requirements
- **Added sections**:
  - Quality Gates
  - Development Workflow
  - Governance
- **Removed sections**: None (initial version)
- **Templates requiring updates**:
  - `.specify/templates/plan-template.md` ✅ aligned (Constitution Check section exists)
  - `.specify/templates/spec-template.md` ✅ aligned (success criteria and acceptance scenarios match principles)
  - `.specify/templates/tasks-template.md` ✅ aligned (phase structure supports quality gates)
- **Follow-up TODOs**: None
-->

# CS2 Util Help Constitution

## Core Principles

### I. Code Quality

All code MUST be clear, maintainable, and self-documenting. Specific rules:

- Every function and module MUST have a single, well-defined responsibility
- No magic numbers or hardcoded strings — use named constants for all configuration values and thresholds
- No commented-out code in commits; use version control history instead
- Public APIs MUST include type annotations (or equivalent type safety for the language in use)
- Code duplication across modules MUST be extracted into shared utilities only when used in three or more locations; fewer than three usages MUST remain inline
- Linting and formatting MUST pass before any code is merged; CI MUST enforce this gate automatically
- Dependencies MUST be pinned to exact versions; upgrades require a dedicated review

### II. Testing Standards

Every user-facing behavior MUST be covered by at least one automated test. Specific rules:

- Unit tests MUST cover all business logic; edge cases and error paths are not optional
- Integration tests MUST cover every cross-boundary interaction (API calls, database queries, file I/O, external services)
- Tests MUST be deterministic — no flaky tests permitted in the main branch; a flaky test MUST be fixed or quarantined within 24 hours of detection
- Test names MUST describe the scenario and expected outcome (e.g., `test_search_returns_empty_list_when_no_matches`)
- Mocks MUST only be used at system boundaries (network, filesystem, clock); internal modules MUST NOT be mocked
- Code coverage MUST NOT drop below the established baseline on any PR; new code MUST meet or exceed 80% line coverage
- Contract tests MUST exist for every public API endpoint or shared interface

### III. User Experience Consistency

The application MUST present a coherent, predictable interface across all features. Specific rules:

- All user-facing text MUST follow a single, documented tone and terminology guide; synonyms for the same concept are not permitted
- Error messages MUST be actionable — they MUST tell the user what went wrong and what they can do about it; raw stack traces or internal codes MUST NOT be exposed
- Loading states, empty states, and error states MUST be handled explicitly for every view or command output
- Navigation patterns and information hierarchy MUST be consistent across all features; a user familiar with one part of the application MUST be able to predict behavior in another
- Accessibility requirements MUST be treated as functional requirements, not enhancements — WCAG 2.1 AA compliance is the baseline where applicable
- All user-facing changes MUST be reviewed for consistency with existing patterns before merge; deviations require documented justification

### IV. Performance Requirements

The application MUST meet defined performance targets and MUST NOT regress. Specific rules:

- Response time targets MUST be defined for every user-facing operation before implementation begins; the default target is < 200ms for interactive operations and < 2s for batch operations
- Memory usage MUST remain bounded — no unbounded caches, no leaked resources; every allocation with a lifecycle MUST have an explicit cleanup path
- Performance-critical paths MUST have benchmarks that run in CI; a regression beyond 10% on any benchmark MUST block the merge
- Database queries (or equivalent data access) MUST be reviewed for N+1 patterns, missing indexes, and unbounded result sets
- Startup time MUST NOT exceed 3 seconds on the target platform under normal conditions
- Large data sets MUST be handled with pagination or streaming; loading an entire collection into memory is not permitted unless the maximum size is known and bounded

## Quality Gates

All pull requests MUST pass the following gates before merge:

1. **Lint & Format**: Zero warnings, zero errors from the configured linter and formatter
2. **Test Suite**: All tests pass; no skipped tests without a tracked issue
3. **Coverage**: No drop below baseline; new files meet minimum threshold
4. **Performance**: Benchmark suite shows no regressions beyond tolerance
5. **UX Review**: User-facing changes reviewed against consistency principles
6. **Code Review**: At least one approval from a team member who did not author the change

Bypassing any gate requires a documented exception approved by the project lead.

## Development Workflow

All changes MUST follow the Explore → Plan → Implement → Commit cycle:

1. **Explore**: Understand the existing code, related tests, and UX patterns before proposing changes
2. **Plan**: For non-trivial changes, produce a written plan and get alignment before writing code
3. **Implement**: Write tests first where applicable, then implement, then verify all quality gates pass
4. **Commit**: Use clear, descriptive commit messages; one logical change per commit; branch naming follows `feat/`, `fix/`, `chore/` conventions

Hotfixes for production incidents MAY skip the Plan step but MUST NOT skip testing or quality gates.

## Governance

This constitution is the authoritative source of engineering standards for the CS2 Util Help project. All other guidance documents, templates, and workflows MUST align with the principles defined here.

- **Amendments**: Any change to this constitution MUST be proposed as a PR, reviewed by at least one maintainer, and documented with a version bump and rationale
- **Versioning**: This constitution follows semantic versioning — MAJOR for principle removals or redefinitions, MINOR for new principles or material expansions, PATCH for clarifications and wording fixes
- **Compliance**: All PRs and code reviews MUST verify compliance with these principles; the Constitution Check section in plan templates MUST reference the current version
- **Conflict resolution**: If a template or workflow document conflicts with this constitution, the constitution takes precedence

**Version**: 1.0.0 | **Ratified**: 2026-04-05 | **Last Amended**: 2026-04-05
