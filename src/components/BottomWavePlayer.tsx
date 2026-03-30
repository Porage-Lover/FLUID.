import { motion } from 'framer-motion';
import { Play, FastForward, Rewind, Maximize2 } from 'lucide-react';

export function BottomWavePlayer() {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '100px',
        zIndex: 900,
        display: 'flex',
        alignItems: 'flex-end'
      }}
    >
      {/* Vector Wave Background overlapping the player strip */}
      <svg viewBox="0 0 1440 320" style={{ position: 'absolute', bottom: 0, width: '100%', height: '180px', pointerEvents: 'none', zIndex: -1, opacity: 0.8 }}>
        <path fill="var(--accent-crimson)" fillOpacity="0.4" d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,186.7C672,192,768,224,864,224C960,224,1056,192,1152,186.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        <path fill="var(--accent-crimson)" fillOpacity="0.8" d="M0,256L60,245.3C120,235,240,213,360,208C480,203,600,213,720,229.3C840,245,960,267,1080,261.3C1200,256,1320,224,1380,208L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
      </svg>

      {/* Player Interface Strip */}
      <div style={{
          width: '100%',
          height: '80px',
          background: 'linear-gradient(to top, rgba(5,5,8,1), rgba(5,5,8,0))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          color: 'var(--text-main)'
        }}>
        
        {/* Play Controls & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Rewind size={20} fill="currentColor" /></motion.button>
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'transparent', border: '2px solid var(--accent-crimson)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <Play size={20} color="var(--accent-crimson)" fill="var(--accent-crimson)" style={{ marginLeft: '4px' }}/>
             </motion.div>
             <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><FastForward size={20} fill="currentColor" /></motion.button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>System Active [FLUID ENGINE]</span>
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--accent-crimson)', letterSpacing: '2px' }}>LIVE SESSION PORTAL</span>
          </div>
        </div>

        {/* Global Class Scrubber */}
        <div style={{ flex: 1, margin: '0 64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
             <span style={{ fontSize: '12px', opacity: 0.7, fontFamily: 'monospace' }}>00:00</span>
             <input type="range" defaultValue={100} style={{ flex: 1 }} />
             <span style={{ fontSize: '12px', opacity: 0.7, fontFamily: 'monospace' }}>12:00</span>
        </div>

        {/* Right Menu Hooks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <Maximize2 size={18} opacity={0.5} cursor="pointer" />
        </div>
      </div>
    </motion.div>
  );
}
