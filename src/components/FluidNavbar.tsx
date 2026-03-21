import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { FluidLogo } from './FluidLogo';
import { triggerHaptic } from '../utils/haptics';

export function FluidNavbar() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
        background: 'rgba(5, 5, 8, 0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* FLUID. Logo */}
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '-12px' }} onClick={() => navigate('/dashboard')}>
         <FluidLogo width="160px" height="48px" />
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '32px' }}>
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
      </div>
    </motion.nav>
  );
}
