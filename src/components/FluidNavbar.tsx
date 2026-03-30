import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { FluidLogo } from './FluidLogo';
import { triggerHaptic } from '../utils/haptics';
import { Sun, Moon } from 'lucide-react';
import { useData } from '../context/DataContext';

export function FluidNavbar() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  // ⚡ Bolt Optimization:
  // Replacing useState with useRef for tracking lastScrollY.
  // Previously, every single scroll event tick caused a state update,
  // triggering a full component re-render and re-attaching the event listener continuously.
  // Impact: Eliminates massive amounts of unnecessary re-renders during scrolling,
  // significantly smoothing out scroll performance.
  const lastScrollY = useRef(0);
  const { theme, toggleTheme } = useData();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if ((window as any).isProgrammaticScroll) {
        lastScrollY.current = currentScrollY;
        return;
      }
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsVisible(false); // scrolling down
      } else {
        setIsVisible(true);  // scrolling up
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array as we no longer depend on state updates to attach the listener

  const links = [
    { name: 'HOME', path: '/dashboard' },
    { name: 'TIMETABLE', path: '/timetable' },
    { name: 'ATTENDANCE', path: '/attendance' },
    { name: 'METRICS', path: '/marks' },
    { name: 'AGENDA', path: '/calendar' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      className="nav-container frosted-glass navbar-glass"
    >
      {/* FLUID. Logo */}
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '-12px' }} onClick={() => navigate('/dashboard')}>
         <FluidLogo width="160px" height="48px" />
      </div>

      {/* Navigation Links & Theme Toggle */}
      <div className="nav-links-row">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => triggerHaptic(30)}
            onMouseEnter={() => triggerHaptic(10)}
            className="nav-link-item"
            style={({ isActive }) => ({
              textDecoration: 'none',
              fontWeight: 800,
              fontFamily: "'Montserrat', sans-serif",
              letterSpacing: '2px',
              color: isActive ? 'var(--accent-crimson)' : 'var(--text-main)',
              transition: 'all 0.3s ease',
              position: 'relative',
              padding: '8px 0'
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ fontSize: '10px', color: isActive ? 'var(--accent-crimson)' : 'transparent', marginRight: '6px' }}>−</span>
                {link.name}
                <span style={{ fontSize: '10px', color: isActive ? 'var(--accent-crimson)' : 'transparent', marginLeft: '6px' }}>−</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={() => { toggleTheme(); triggerHaptic(20); }}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-bg)'; triggerHaptic(10); }}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '50%',
            transition: 'background-color 0.3s ease'
          }}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </motion.nav>
  );
}
