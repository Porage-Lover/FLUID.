import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { TargetGradePredictor } from '../components/TargetGradePredictor';
import { FluidCard } from '../components/FluidCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { triggerHaptic } from '../utils/haptics';
import { Crosshair } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255, 42, 95, 0.3)', borderRadius: '12px', padding: '16px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
        <p style={{ margin: 0, color: '#fff', fontSize: '14px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
           <span style={{ color: 'var(--accent-crimson)', fontSize: '28px', fontWeight: 900 }}>{data.percentage.toFixed(1)}%</span>
        </div>
        <p style={{ margin: 0, marginTop: '8px', color: 'var(--accent-purple)', fontSize: '14px', fontWeight: 800 }}>Raw Score: <span style={{ color: '#fff' }}>{data.val} / {data.derivedMax}</span></p>
      </div>
    );
  }
  return null;
};

export function Marks() {
  const { data } = useData();

  // Metrics Radial Wheel Physics State
  const [activeIndex, setActiveIndex] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);

  const NUM_NODES = data.marks.length;
  // Fallback securely avoiding NaN arrays during empty loading states natively
  const ANGLE_STEP = NUM_NODES > 0 ? 360 / NUM_NODES : 0;
  
  // Wheel sizing
  const RADIUS = 140; // Radial mapping bounds natively

  const activeSubject = data.marks[activeIndex] || null;

  // Active Map Node Calculation securely preventing layout blocking
  const chartData = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.graph.map((p: any) => {
      let derivedMax = p.max;
      if (!derivedMax) {
        if (p.name.includes('CT')) derivedMax = 15;
        else if (p.name.includes('FT')) derivedMax = p.val > 5 ? 15 : 5;
        else derivedMax = p.val > 15 ? 100 : p.val > 5 ? 15 : 5;
      }
      return { ...p, derivedMax, percentage: derivedMax > 0 ? (p.val / derivedMax) * 100 : 0 };
    });
  }, [activeSubject]);

  const handleNodeClick = (index: number) => {
      triggerHaptic(20);
      let diff = activeIndex - index;
      
      // Shortest path mechanical calculation ensuring realistic spin bounds mimicking requested snippet natively
      if (diff > NUM_NODES / 2) diff -= NUM_NODES;
      if (diff < -NUM_NODES / 2) diff += NUM_NODES;
      
      setWheelRotation(prev => prev + (diff * ANGLE_STEP));
      setActiveIndex(index);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 32px 120px 32px' }}>
      <ScrollHideHeader>
        <h1 className="heading-fluid glow-crimson" style={{ color: 'var(--accent-crimson)', margin: 0, fontSize: '2rem' }}>Metrics</h1>
      </ScrollHideHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Global Target Grade Predictor implicitly remaining up top */}
        <TargetGradePredictor />

        {/* --- DUAL PANE METRICS ARCHITECTURE --- */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'center', marginTop: '40px' }}>
           
           {/* LEFT PANE: Mechanical Radial Wheel */}
           <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0', position: 'relative', minHeight: '360px' }}>
               
               {/* 🎯 Focal Crosshair anchoring the "Active Node" mapping the target implicitly */}
               <div style={{ position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 10 }}>
                   <Crosshair size={32} color="var(--accent-crimson)" strokeWidth={1.5} style={{ opacity: 0.8 }} />
                   <div style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, var(--accent-crimson) 0%, transparent 100%)', marginLeft: '8px', opacity: 0.8 }} />
               </div>

               {/* Spinning Carousel Bounds */}
               <motion.div 
                   animate={{ rotate: wheelRotation }} 
                   transition={{ type: "spring", damping: 15, stiffness: 100 }}
                   style={{ width: `${RADIUS * 2}px`, height: `${RADIUS * 2}px`, borderRadius: '50%', position: 'relative', border: '1px dashed rgba(255, 42, 95, 0.2)' }}
               >
                   {/* Radial Generation Loop explicitly dropping vertical scrolling maps */}
                   {data.marks.map((_, idx) => {
                       // 0 deg naturally maps natively exactly exactly to Right
                       const angle = idx * ANGLE_STEP;
                       const isActive = idx === activeIndex;

                       return (
                           <motion.button
                               onClick={() => handleNodeClick(idx)}
                               key={idx}
                               style={{
                                   position: 'absolute',
                                   top: '50%', left: '50%',
                                   transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${RADIUS}px) rotate(${-angle}deg)`, 
                                   width: '64px', height: '64px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                                   background: isActive ? 'var(--accent-crimson)' : 'var(--card-bg)', 
                                   boxShadow: isActive ? '0 0 30px rgba(255, 42, 95, 0.4)' : 'inset 0 0 10px rgba(0,0,0,0.5)',
                                   color: isActive ? 'var(--bg-color)' : 'var(--text-main)', 
                                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                                   fontWeight: 800, fontSize: '12px', letterSpacing: '1px', zIndex: 5,
                                   transition: 'all 0.3s ease'
                               }}
                           >
                               {/* The native text explicitly counter-rotates avoiding upside-down flips securely mapping mechanics natively */}
                               <motion.div 
                                    animate={{ rotate: -wheelRotation }} 
                                    transition={{ type: "spring", damping: 15, stiffness: 100 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                               >
                                    <span style={{ fontSize: '10px', opacity: isActive ? 0.7 : 0.4 }}>SUB</span>
                                    <span style={{ fontSize: '15px' }}>{idx + 1}</span>
                               </motion.div>
                           </motion.button>
                       )
                   })}
               </motion.div>
           </div>

           {/* RIGHT PANE: Recharts Interactive Graphic Interpolations */}
           <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
               <AnimatePresence mode="wait">
                  {activeSubject && (
                     <motion.div
                       key={activeSubject.code}
                       initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                       transition={{ duration: 0.3, type: "spring" }}
                     >
                        <FluidCard headerColor="--accent-crimson" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, paddingRight: '16px' }}>
                                 <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '6px', lineHeight: 1.2, color: 'var(--text-main)' }} className="heading-fluid">{activeSubject.name}</h3>
                                 <p style={{ fontSize: '12px', letterSpacing: '2px', opacity: 0.7, fontWeight: 700, color: 'var(--accent-purple)' }}>{activeSubject.code}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                 <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-crimson)', letterSpacing: '-1px', textShadow: '0 0 15px rgba(255, 42, 95, 0.3)' }}>
                                   {activeSubject.total.split('/')[0]}<span style={{ fontSize: '18px', opacity: 0.5, color: 'var(--text-main)', textShadow: 'none' }}>/{activeSubject.total.split('/')[1]}</span>
                                 </div>
                              </div>
                            </div>

                            {/* Aggressive Fluorescent Bar Chart Graphic Blocks mapping marks structurally */}
                            <div style={{ height: '280px', padding: '16px 16px 16px 0', margin: '0 24px 24px 24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="none" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 800 }} />
                                    <YAxis stroke="none" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 800 }} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 42, 95, 0.1)' }} />
                                    
                                    {/* Neon Bar Interlocks resolving animations seamlessly natively tracking explicit arrays reliably */}
                                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]} animationDuration={1000}>
                                        {chartData.map((_, index) => (
                                           <Cell key={`cell-${index}`} fill={'var(--accent-crimson)'} />
                                        ))}
                                    </Bar>
                                  </BarChart>
                               </ResponsiveContainer>
                            </div>
                        </FluidCard>
                     </motion.div>
                  )}
               </AnimatePresence>
           </div>
           
        </div>
      </div>
    </div>
  );
}
