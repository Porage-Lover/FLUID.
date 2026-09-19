## 2025-01-01 - Avoid toLowerCase().includes() in Hot Loops
**Learning:** Evaluating string manipulations like `.toLowerCase().includes()` inside hot loops, array mappings, or React render cycles creates unnecessary string allocations and garbage collection overhead.
**Action:** Pre-compile and hoist case-insensitive regular expressions (e.g., `/pattern/i.test(str)`) to replace these string manipulations. Use a conditional or ternary check (e.g., `obj?.title ? REGEX.test(obj.title) : false`) to ensure strict boolean returns and prevent type errors or undefined evaluations in React/TypeScript.
