## 2024-05-24 - Pre-compiled RegExp over String Allocations in Hot Loops
**Learning:** Evaluated inline `.toLowerCase() === '...'` inside `useMemo` iterations and maps during render cycles creates unnecessary temporary string allocations on the heap, triggering frequent garbage collection, particularly when scaling to O(N*M).
**Action:** Replace dynamic `.toLowerCase()` string manipulations with hoisted RegExp test operations (e.g., `/^practical$/i.test(str)`) during hot loops (like table building or list mapping). Ensure boolean return types to avoid runtime crashes.
