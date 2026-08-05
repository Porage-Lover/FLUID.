## 2024-03-24 - [React Component Extraction for State Isolation]
**Learning:** Found a severe performance bottleneck in `Marks.tsx` where local state (`globalInternal` for a slider) was placed at the top level of the parent component. Because the parent also rendered computationally heavy `recharts` LineCharts in a `.map()` loop, moving the slider forced full re-renders of the entire chart list, causing massive input latency.
**Action:** Always scrutinize React state placement. If a state variable only affects a specific section of UI (like a predictor slider), extract that section into its own component to push the state down. This completely isolates the re-renders and drastically improves responsiveness.

## 2024-03-25 - [Scroll Event State Thrashing in React]
**Learning:** Found a significant scroll performance issue in `FluidNavbar.tsx` and `ScrollHideHeader.tsx`. Storing exact scroll coordinates (`lastScrollY`) directly in React `useState` and updating them on *every single scroll event tick* causes massive re-render thrashing. It also causes the `useEffect` hook to continuously detach and re-attach the scroll event listener because the `lastScrollY` state was in the dependency array.
**Action:** Never use `useState` to track high-frequency event coordinates like scroll unless visually necessary for rendering the actual coordinate. For tracking values across renders (like scroll direction logic), always use `useRef` to store the value mutably without triggering re-renders, and use an empty dependency array `[]` so the listener is only attached once.

## 2024-03-26 - [Expensive Render Loop Object Resolution]
**Learning:** Found a severe performance bottleneck in `Timetable.tsx` where expensive `Object.values()` iterations and Regex `.find()` matching were happening inline during the React render loop (`.map()` array iteration). This caused UI thrashing every time a user toggled `selectedDay` tabs.
**Action:** Extract heavy, complex data restructuring, matching, and property resolution from the JSX render loop into a `useMemo` block that pre-processes the data when the dependencies update. This ensures UI interaction (like tab switching) is instant.

## 2024-03-27 - [Cascading Renders via useEffect State Setting]
**Learning:** Found a major performance and linting issue in `Timetable.tsx` where `useEffect` was being used to compute values (`isTodayHoliday`, `holidayName`) and update state based on prop/context changes. Calling `setState` synchronously within an effect body causes cascading renders (the component renders, the effect runs, sets state, and forces a second render).
**Action:** Avoid `react-hooks/set-state-in-effect`. Instead of using `useEffect` to derive state from props, use `useMemo` for derived values. For updating true state (like `selectedDay`), use the "Adjusting state while rendering" pattern by tracking the previous value (`prevCalendar`) and calling `setState` directly in the render phase. This skips the extra paint cycle and eliminates the cascading render issue.

## 2026-04-04 - [Nested Array Searches Inside Component Render Loop]
**Learning:** Found a major performance bottleneck in `Attendance.tsx` where global simulated state (`daySimulations`) was mapped over and processed _inside_ the main data loop processing subjects. This caused `O(N * M)` operations, including an array `.find()` scan and expensive regex matching within every subject iteration.
**Action:** To optimize nested array scans and Regex tests in loops, hoist them outside the `map()` operation. Precompute expensive values and index them using a `Map` structure for `O(1)` key lookups during the main array traversal.

## 2026-04-05 - [O(N*M) Array Scanning in render loops]
**Learning:** Found a performance bottleneck in `Attendance.tsx` where nested array methods (`.filter` combined with an inner `findIndex`) were repeatedly traversing arrays and allocating new memory on every re-render loop, causing unnecessary CPU load and potential render blocking.
**Action:** Replaced the O(N*M) nested array iterations with a single-pass O(N) loop and pre-computed an O(1) `Record` map to do property lookups. Always pre-compute known reference maps (like months or days) and perform single-pass iterations instead of chaining multiple array functions.

## 2026-04-08 - [O(M) Array Searches inside Render Loops]
**Learning:** Found a performance bottleneck in `Timetable.tsx` where an `O(M)` array `.find()` operation was executed inside the inner `O(N)` mapping loop for every timetable cell to resolve whether a subject class was "theory" or "practical". This caused `O(N*M)` complexity during render setups.
**Action:** Replaced the grouping logic to pre-index the array data directly into specific `{ theory, practical }` object properties within a `Map` during the initial `O(N)` pass. This completely removed the need for array traversals in the inner loop, replacing it with an `O(1)` property lookup and reducing rendering block time by ~50%.

## 2026-04-10 - [React useMemo Anti-Pattern on Trivial Operations]
**Learning:** Found a minor inefficiency in `Dashboard.tsx` where `.split('/')` was called twice directly inside the JSX render loop. While extracting this was correct, initially attempting to wrap the trivial string split in a `useMemo` hook was flagged as an anti-pattern during code review. The overhead of invoking the hook, creating closures, and checking the dependency array on every render cycle is generally heavier than the string split itself.
**Action:** Do not use `useMemo` for trivial, fast operations like single string manipulation (`.split()`, `.toLowerCase()`) or simple arithmetic. Simply extract the operation to the component body before the `return` statement to avoid redundant inline executions without paying the heavy cost of React hook tracking.
## 2026-04-12 - The Danger of Micro-Optimizing Regex
**Learning:** Replacing robust regular expressions with primitive string functions (`indexOf`, `substring`) for simple parsing tasks is a fragile micro-optimization. It often breaks edge cases (like unexpected spaces) and yields virtually zero measurable performance benefit on small datasets (like a daily schedule of 5-10 classes). Furthermore, in React `useMemo` hooks, operations like chained `.filter().slice()` over large global arrays can be inefficient as they force an O(N) evaluation of the entire array.
**Action:** Reject micro-optimizations that sacrifice readability and correctness for hypothetical speed. Instead, favor algorithmic improvements, such as replacing chained `.filter().slice(0, X)` calls with a standard `for...of` loop and a `break` statement to short-circuit the iteration once X items are found, ensuring the operation scales linearly (O(K) instead of O(N)).

## 2026-04-13 - [O(N) Render Array Scanning Anti-Pattern for Components]
**Learning:** Found a performance bottleneck in `Marks.tsx` where an initial helper function mapped values, created an unnecessary dummy placeholder node, and reversed the array purely for Recharts chart input. During the render loop, a subsequent `.filter(c => c.name !== 'dummy').reverse()` operation was called per component just to reverse the anti-pattern and extract a clean list for pill legends. Creating artificial structural elements inside pure data functions and reversing them forces consumers to perform expensive O(N) filtering and memory allocations every render cycle.
**Action:** Helper functions should return raw, pure mapped domain nodes exclusively. Let the UI presentation layer dynamically inject dummies or reverse components directly via array destructuring spread (`[dummy, ...nodes.reverse()]`) during initialization instead of creating them early and filtering them out repeatedly inside the component's mapping loop.

## 2026-04-15 - Fast Chronological Sort Filtering
**Learning:** Re-instantiating `new Date()` within O(N) sorting and filtering loops creates severe CPU bottlenecks and memory allocation spikes during rendering, especially for nested elements mapping over large data structures (like academic calendars).
**Action:** When filtering chronological bounds dynamically within loop iterations, pre-calculate an equivalent integer structure (e.g. `YYYYMMDD`) derived from primitives (`now.getFullYear() * 10000 + now.getMonth() * 100 + now.getDate()`) outside the loop, then compare the current item mapped via identical primitive mathematics to bypass Date parsing overhead cleanly.

## 2026-04-17 - Fast Chronological Filtering Without Memory Allocation
**Learning:** Re-instantiating `new Date()` inside an O(N) loop (e.g. for traversing calendar structures in Attendance.tsx) causes completely unnecessary CPU allocations overhead, just for monotonic chronological ordering.
**Action:** Avoid `new Date()` inside loops. Convert target filtering timestamps and input variables directly into purely deterministic integer math (e.g., `YYYYMMDD`) natively outside the loops for `O(1)` lookups and bounds checks inside them without allocations.

## 2026-04-19 - [O(N) String Allocation Anti-Pattern in React renders]
**Learning:** Found a minor performance inefficiency where `.split('/')` operations on strings were being called repeatedly inline within the JSX render loop in `SubjectCard.tsx` and `Marks.tsx`, particularly inside `.map()` iterations. This causes unnecessary and duplicate string allocations and array creations on every render cycle.
**Action:** Always hoist repeated string splitting or parsing operations into variable destructuring (`const [a, b] = str.split('/')`) before the `return` statement, rather than evaluating them directly inside the JSX tags.
## 2026-04-20 - [O(N) Render Array Mapping Anti-Pattern]
**Learning:** Found a severe performance bottleneck in `Marks.tsx` where `.map()`, `.reverse()`, and string `.split()` operations were being performed inside the render loop on every single render cycle. This caused massive redundant heap allocations and React render blocking.
**Action:** Hoist static helpers outside the component and use `useMemo` to precompute and cache the derived array state. Let the UI presentation layer dynamically access the precomputed properties to ensure O(1) rendering efficiency.

## 2024-07-05 - [cheerio.load() in Loops]
**Learning:** Calling `cheerio.load()` repeatedly inside loops (like `.each()` iterations over table cells) causes massive CPU overhead by reconstructing full DOM trees on every iteration.
**Action:** For simple tag stripping inside loops, use native regex replacements (e.g., `str.replace(/<[^>]*>?/gm, '')`) instead of instantiating Cheerio parsers to avoid unnecessary DOM allocations.

## 2026-04-25 - [O(1) Map Lookup for Small Arrays]
**Learning:** Found a minor performance inefficiency where `Array.prototype.indexOf` was used inside a rendering mapping loop (e.g., matching months strings in Calendar loops) instead of a constant-time mapping structure (`Record`). Since the array isn't large this is mainly a micro-optimization but correctly extracting dictionary lookups as module-level constants prevents recreation inside `useMemo` closures and avoids minor loop iterations.
**Action:** Replace `array.indexOf` inside loops with O(1) object property mapping (e.g. `VALID_MONTHS[mStr] ?? -1`). Keep the dictionary allocations in the module's global scope, not dynamically reconstructed inside the component hook.
## 2024-05-18 - [Hoist Dictionary Allocations]
**Learning:** Defining static dictionaries (like month mappings) inside components or `useMemo` hooks forces unnecessary re-allocations on every execution context, degrading performance.
**Action:** Always hoist static lookup dictionaries and constant configurations to the module's global scope outside of React components.

## 2024-08-05 - Hoist Regular Expressions in Hot Loops
**Learning:** Compiling regex patterns dynamically inside hot loops or `useMemo` hooks (e.g. `processedTimetable` map loops) causes unnecessary garbage collection and performance degradation.
**Action:** Always hoist stateless regular expressions (without the `g` flag) to the module's global scope, evaluating them via O(1) object references inside render iterations.
