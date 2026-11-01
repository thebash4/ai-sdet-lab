
# AI SDET Lab — Shared Agent Instructions

## Project Goal
Build an AI-native SDET workflow using Playwright and TypeScript.

## Engineering Rules
- Investigate before implementing.
- Reuse existing helpers and patterns.
- Keep code changes focused.
- Never claim a test passed unless it was executed.
- Separate verified facts from assumptions.
- Do not commit or push without approval.

## Standard Workflow
1. Investigate the feature.
2. Identify test scenarios and risks.
3. Create a coverage matrix.
4. Wait for approval before implementing.
5. Implement Playwright automation.
6. Run tests and collect evidence.
7. Review changes and report results.

## Playwright Standards
- Use TypeScript.
- Prefer semantic locators.
- Avoid arbitrary waits.
- Keep tests independent.
- Use reliable assertions.

## Reporting
Always report:
- Findings
- Files changed
- Tests executed and results
- Remaining risks
