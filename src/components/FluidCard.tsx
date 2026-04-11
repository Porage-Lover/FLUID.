import type { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

interface FluidCardProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
  headerColor?: string;
  actionIcon?: ReactNode;
  onActionClick?: () => void;
  innerStyle?: CSSProperties;
}

export function FluidCard({ children, style, headerColor = '#d62828', actionIcon, onActionClick, innerStyle, onClick, className, ...props }: FluidCardProps) {
  const isCustomColor = headerColor.startsWith('#') || headerColor.startsWith('rgba');
  const bg = isCustomColor ? headerColor : `var(${headerColor})`;

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -5 } : { scale: 1.0 }}
      whileTap={onClick ? { scale: 0.98 } : { scale: 1.0 }}
      onClick={onClick}
      className={`fluid-card ${onClick ? 'cursor-pointer' : ''} ${className || ''}`}
      style={{
        position: 'relative',
        minHeight: '120px',
        ...style
      }}
      {...props}
    >
      {/* Sleek Colored Gradient Overlay - Apple Soft Blend */}
      <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(ellipse at top left, ${bg} 0%, transparent 70%)`,
          opacity: 0.1,
          zIndex: 0,
          pointerEvents: 'none'
      }} />

      {actionIcon && (
         <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onActionClick?.(); }}
            style={{
               position: 'absolute', right: '16px', top: '32px',
               width: '40px', height: '40px',
               borderRadius: '50%',
               backgroundColor: bg,
               boxShadow: `0 0 15px ${bg}`,
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               cursor: 'pointer', zIndex: 10
            }}
         >
            {actionIcon}
         </motion.div>
      )}

      <div style={{ padding: '24px', paddingTop: '40px', zIndex: 2, position: 'relative', ...innerStyle }}>
        {children}
      </div>
    </motion.div>
  );
}
