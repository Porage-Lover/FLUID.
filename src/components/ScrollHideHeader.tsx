import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function ScrollHideHeader({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if ((window as any).isProgrammaticScroll) {
        setLastScrollY(currentScrollY);
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
