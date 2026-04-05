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
