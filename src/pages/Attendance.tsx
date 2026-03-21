import { motion } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { AlertCircle, Plus } from 'lucide-react';
import { ScrollHideHeader } from '../components/ScrollHideHeader';

export function Attendance() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const { data } = useData();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 200px 32px' }}>
      <ScrollHideHeader style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'transparent' }}>
        <h1 className="heading-fluid glow-cyan" style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '2rem' }}>Attendance</h1>
      </ScrollHideHeader>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {data.attendance.map((course, idx) => {
          const total = course.total;
          const present = course.present;
          const percentage = total === 0 ? 0 : (present / total) * 100;
          const safe = percentage >= 75;
          const marginBunkable = safe ? Math.floor((4/3 * present) - total) : 0;
          const marginNeeded = !safe ? Math.ceil(3 * total - 4 * present) : 0;

          const headerColor = safe ? '--accent-cyan' : '--accent-crimson'; 

          return (
            <motion.div key={idx} variants={itemVariants} layout>
              <FluidCard 
                 headerColor={headerColor} 
                 actionIcon={safe ? <Plus size={24} color="#050508" /> : <AlertCircle size={24} color="#050508" />} 
                 innerStyle={{ paddingTop: '24px' }}
              >
                {/* Header Content */}
                <div style={{ marginBottom: '24px', paddingRight: '48px' }}>
                     <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', lineHeight: 1.2, color: 'var(--text-main)' }}>{course.name}</h3>
                     <p style={{ fontSize: '13px', letterSpacing: '2px', fontWeight: 600, color: 'var(--accent-purple)', opacity: 0.9 }}>{course.code}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '11px', letterSpacing: '2px', opacity: 0.7, fontWeight: 800, textTransform: 'uppercase' }}>Classes</span>
                     <span style={{ fontSize: '32px', fontWeight: 800 }}>{present} <span style={{ opacity: 0.5, fontSize: '20px' }}>/ {total}</span></span>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <span style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase', color: safe ? 'var(--accent-cyan)' : 'var(--accent-crimson)' }}>{safe ? 'Secure' : 'Alert'}</span>
                     <div style={{ fontSize: '36px', fontWeight: 800, color: safe ? 'var(--accent-cyan)' : 'var(--accent-crimson)', letterSpacing: '-1px', textShadow: `0 0 15px ${safe ? 'rgba(29,199,209,0.4)' : 'rgba(255,42,95,0.4)'}` }}>{percentage.toFixed(1)}%</div>
                   </div>
                </div>

                {/* Progress Bar Container Cyberspace */}
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', marginBottom: '24px', borderRadius: '4px' }}>
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${percentage}%` }} 
                    transition={{ duration: 1, type: "spring" }}
                    style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: safe ? 'var(--accent-cyan)' : 'var(--accent-crimson)', boxShadow: `0 0 10px ${safe ? 'var(--accent-cyan)' : 'var(--accent-crimson)'}` }}
                  />
                  {/* 75% Marker Hook Cyberspace */}
                  <div style={{ position: 'absolute', top: 0, left: '75%', height: '100%', width: '2px', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 5, boxShadow: '0 0 5px #fff' }} />
                </div>

                {/* Algorithmic Margin Analysis Output */}
                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                   {safe ? (
                     <>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(29, 199, 209, 0.15)', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(29, 199, 209, 0.3)' }}>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '20px' }}>{marginBunkable}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>Classes Safe to Bunk</span>
                          <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: 500 }}>Algorithms predict safe threshold limit</span>
                        </div>
                     </>
                   ) : (
                     <>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255, 42, 95, 0.15)', border: '1px solid var(--accent-crimson)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255, 42, 95, 0.3)' }}>
                          <span style={{ color: 'var(--accent-crimson)', fontWeight: 800, fontSize: '20px' }}>{marginNeeded}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>Classes Needed</span>
                          <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: 500 }}>Consecutive attendance mandatory</span>
                        </div>
                     </>
                   )}
                </div>

              </FluidCard>
            </motion.div>
          );
        })}

      </motion.div>
    </div>
  );
}
