import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function ScrollHideHeader({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  const [isVisible, setIsVisible] = useState(true);

  // ⚡ Bolt Optimization:
  // Replacing useState with useRef for tracking lastScrollY here too.
  // Previously, scrolling continuously updated state and thrashed the listener,
  // causing full component re-renders that destroyed performance.
  // Impact: Scrolling across all main pages is now much smoother due to
  // avoiding these unnecessary render cycles.
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if ((window as any).isProgrammaticScroll) {
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -80, opacity: isVisible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'sticky',
        top: '80px',
        zIndex: 100,
        paddingTop: '40px',
        paddingBottom: '20px',
        marginBottom: '20px',
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}
