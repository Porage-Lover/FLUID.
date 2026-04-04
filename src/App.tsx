import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { FluidNavbar } from './components/FluidNavbar';
import { ScrollToTop } from './components/ScrollToTop';

// ⚡ LCP Bolt Optimization: Route-Level Code Splitting
// Decouples massive application bundles ensuring instantaneous initial loads on the /login route.
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Attendance = React.lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const Timetable = React.lazy(() => import('./pages/Timetable').then(m => ({ default: m.Timetable })));
const Marks = React.lazy(() => import('./pages/Marks').then(m => ({ default: m.Marks })));
const Calendar = React.lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));

// Global wave aesthetic decoupled to prevent render blocking
const GlobalWave = React.lazy(() => import('./components/GlobalWave').then(m => ({ default: m.GlobalWave })));

// Note: Code health analyzers might flag useEffect as unused if they don't trace component instantiation deeply.
// It is required here to prevent scroll position regressions on route changes.
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedLayout() {
  const isAuth = !!sessionStorage.getItem('academia_id') || !!localStorage.getItem('academia_id');
  if (!isAuth) {
    // 🛡️ Sentinel: Ensure stale/unauthorized caches are wiped if auth is lost
    sessionStorage.removeItem('academia_cache');
    return <Navigate to="/login" replace />;
  }
  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '140px', paddingTop: '80px' }}>
      <FluidNavbar />
      <div style={{ flex: 1, paddingBottom: '20vh', zIndex: 10, position: 'relative' }}>
         <Suspense fallback={null}>
           <Outlet />
         </Suspense>
      </div>
      <ScrollToTop />
    </div>
  );
}

function DelayedGlobalWave() {
  const [show, setShow] = React.useState(false);
  useEffect(() => {
    // ⚡ Extreme LCP Bolt Optimization: Wait for the main thread to become entirely idle
    // and the window to fully load before initializing the massive 3D background engine.
    const initWave = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setShow(true), { timeout: 2000 });
      } else {
        setTimeout(() => setShow(true), 1500);
      }
    };

    if (document.readyState === 'complete') {
      initWave();
    } else {
      window.addEventListener('load', initWave);
      return () => window.removeEventListener('load', initWave);
    }
  }, []);
  
  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <GlobalWave />
    </Suspense>
  );
}

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <ScrollReset />
        <DelayedGlobalWave />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/marks" element={<Marks />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
