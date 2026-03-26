## 2024-03-24 - [React Component Extraction for State Isolation]
**Learning:** Found a severe performance bottleneck in `Marks.tsx` where local state (`globalInternal` for a slider) was placed at the top level of the parent component. Because the parent also rendered computationally heavy `recharts` LineCharts in a `.map()` loop, moving the slider forced full re-renders of the entire chart list, causing massive input latency.
**Action:** Always scrutinize React state placement. If a state variable only affects a specific section of UI (like a predictor slider), extract that section into its own component to push the state down. This completely isolates the re-renders and drastically improves responsiveness.

## 2024-03-25 - [Scroll Event State Thrashing in React]
**Learning:** Found a significant scroll performance issue in `FluidNavbar.tsx` and `ScrollHideHeader.tsx`. Storing exact scroll coordinates (`lastScrollY`) directly in React `useState` and updating them on *every single scroll event tick* causes massive re-render thrashing. It also causes the `useEffect` hook to continuously detach and re-attach the scroll event listener because the `lastScrollY` state was in the dependency array.
**Action:** Never use `useState` to track high-frequency event coordinates like scroll unless visually necessary for rendering the actual coordinate. For tracking values across renders (like scroll direction logic), always use `useRef` to store the value mutably without triggering re-renders, and use an empty dependency array `[]` so the listener is only attached once.

## 2024-03-26 - [Expensive Render Loop Object Resolution]
**Learning:** Found a severe performance bottleneck in `Timetable.tsx` where expensive `Object.values()` iterations and Regex `.find()` matching were happening inline during the React render loop (`.map()` array iteration). This caused UI thrashing every time a user toggled `selectedDay` tabs.
**Action:** Extract heavy, complex data restructuring, matching, and property resolution from the JSX render loop into a `useMemo` block that pre-processes the data when the dependencies update. This ensures UI interaction (like tab switching) is instant.
