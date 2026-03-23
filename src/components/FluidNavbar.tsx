import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { FluidLogo } from './FluidLogo';
import { triggerHaptic } from '../utils/haptics';
import { Sun, Moon } from 'lucide-react';
import { useData } from '../context/DataContext';

export function FluidNavbar() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { theme, toggleTheme } = useData();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if ((window as any).isProgrammaticScroll) {
        setLastScrollY(currentScrollY);
        return;
      }
      
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false); // scrolling down
      } else {
        setIsVisible(true);  // scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
        padding: '16px 32px',
        zIndex: 9999,
        background: theme === 'dark' ? 'rgba(5, 5, 8, 0.7)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* FLUID. Logo */}
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '-12px' }} onClick={() => navigate('/dashboard')}>
         <FluidLogo width="160px" height="48px" />
      </div>

      {/* Navigation Links & Theme Toggle */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => triggerHaptic(30)}
            style={({ isActive }) => ({
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '13px',
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
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </motion.nav>
  );
}
