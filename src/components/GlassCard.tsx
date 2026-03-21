import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
  glowColor?: string;
}

export function GlassCard({ children, style, glowColor = 'rgba(0, 229, 255, 0.3)', ...props }: GlassCardProps) {
  return (
    <motion.div
      layout
      whileHover={{ y: -6, scale: 1.02, boxShadow: `0 16px 48px ${glowColor}` }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25, mass: 1 }}
      style={{
        backgroundColor: 'rgba(15, 15, 20, 0.65)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: '24px',
        ...style
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
