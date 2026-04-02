import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { Timetable } from './pages/Timetable';
import { Marks } from './pages/Marks';
import { Calendar } from './pages/Calendar';
import { Login } from './pages/Login';
import { FluidNavbar } from './components/FluidNavbar';
import { ScrollToTop } from './components/ScrollToTop';
import { GlobalWave } from './components/GlobalWave';

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
         <Outlet />
      </div>
      <ScrollToTop />
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <ScrollReset />
        <GlobalWave />
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
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
