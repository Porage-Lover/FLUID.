import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { FluidLogo } from './FluidLogo';
import { triggerHaptic } from '../utils/haptics';
import { Sun, Moon, Square, ChevronDown } from 'lucide-react';
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
  const { theme, setTheme } = useData();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        zIndex: 9999,
      }}
      className="nav-container frosted-glass navbar-glass"
    >
      {/* FLUID. Logo */}
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '-12px' }} onClick={() => navigate('/login')}>
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

        <div ref={themeRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setIsThemeOpen(!isThemeOpen); triggerHaptic(10); }}
            aria-label="Theme switcher"
            style={{
              background: isThemeOpen ? 'var(--card-bg)' : 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              borderRadius: '20px',
              transition: 'all 0.3s ease',
              gap: '6px'
            }}
          >
            {theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Square size={18} />}
            <ChevronDown size={14} style={{ transform: isThemeOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
          </button>

          {isThemeOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '12px',
                background: 'var(--card-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '160px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                zIndex: 10000
              }}
            >
              {[
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'vapourware', icon: Square, label: 'Vapourware' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id as any); setIsThemeOpen(false); triggerHaptic(20); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: theme === t.id ? 'var(--text-main)' : 'transparent',
                    border: 'none',
                    color: theme === t.id ? 'var(--bg-color)' : 'var(--text-main)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: "'Montserrat', sans-serif",
                    letterSpacing: '1px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== t.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    triggerHaptic(10);
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== t.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <t.icon size={16} style={{ color: theme === t.id ? 'var(--bg-color)' : 'var(--text-main)' }} />
                  {t.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
