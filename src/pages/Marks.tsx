import { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { TargetGradePredictor } from '../components/TargetGradePredictor';
import { FluidCard } from '../components/FluidCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { triggerHaptic } from '../utils/haptics';

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

  // Metrics Giant Wheel Physics State
  const [activeIndex, setActiveIndex] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);

  const NUM_NODES = data.marks.length;
  const ANGLE_STEP = NUM_NODES > 0 ? 360 / NUM_NODES : 0;
  
  // Massive radius to fit complete Bar Charts around the perimeter
  // We offset it 50% so only the left rim touches the viewport cleanly
  const RADIUS = 600; 

  const handleSubjectClick = (index: number) => {
      triggerHaptic(20);
      let diff = activeIndex - index;
      
      // Shortest path logic mapping physics explicitly
      if (diff > NUM_NODES / 2) diff -= NUM_NODES;
      if (diff < -NUM_NODES / 2) diff += NUM_NODES;
      
      setWheelRotation(prev => prev + (diff * ANGLE_STEP));
      setActiveIndex(index);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px 120px 32px', overflow: 'hidden' }}>
      <ScrollHideHeader>
        <h1 className="heading-fluid glow-crimson" style={{ color: 'var(--accent-crimson)', margin: 0, fontSize: '2rem' }}>Metrics</h1>
      </ScrollHideHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Global Target Grade Predictor implicitly remaining up top */}
        <TargetGradePredictor />

        {/* --- DUAL PANE ARCHITECTURE: Stationary Left / Ferris Wheel Right --- */}
        <div style={{ display: 'flex', gap: '48px', alignItems: 'center', marginTop: '24px', minHeight: '600px', position: 'relative' }}>
           
           {/* LEFT PANE: Stationary Explicit Subject Menu */}
           <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 50 }}>
               {data.marks.map((subject, idx) => {
                   const isActive = idx === activeIndex;
                   return (
                       <motion.button
                           key={idx}
                           onClick={() => handleSubjectClick(idx)}
                           whileHover={{ scale: 1.02, x: 5 }}
                           whileTap={{ scale: 0.98 }}
                           style={{
                               padding: '24px 20px',
                               background: isActive ? 'var(--accent-crimson)' : 'var(--card-bg)',
                               border: '1px solid',
                               borderColor: isActive ? 'var(--accent-crimson)' : 'rgba(255, 255, 255, 0.05)',
                               borderRadius: '16px',
                               color: isActive ? 'var(--bg-color)' : 'var(--text-main)',
                               boxShadow: isActive ? '0 10px 30px rgba(255, 42, 95, 0.4)' : 'none',
                               textAlign: 'left',
                               cursor: 'pointer',
                               transition: 'background 0.3s ease, border-color 0.3s ease'
                           }}
                       >
                           <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 4px 0', lineHeight: 1.2 }}>{subject.name}</h3>
                           <p style={{ fontSize: '11px', letterSpacing: '2px', margin: 0, opacity: isActive ? 0.8 : 0.5, fontWeight: 700 }}>{subject.code}</p>
                       </motion.button>
                   );
               })}
           </div>

           {/* RIGHT PANE: Giant Analytical Graph Ferris Wheel */}
           <div style={{ flex: 1, position: 'relative', height: '600px', overflow: 'hidden', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
               
               {/* Massive Wheel Container anchored far right safely spinning into the left view bounds */}
               <motion.div 
                   animate={{ rotate: wheelRotation }} 
                   transition={{ type: "spring", damping: 15, stiffness: 80, mass: 1 }}
                   style={{ 
                       width: `${RADIUS * 2}px`, 
                       height: `${RADIUS * 2}px`, 
                       borderRadius: '50%', 
                       position: 'absolute', 
                       right: `-${RADIUS * 1.0}px`, // Anchors center of the massive wheel out of bounds towards the right
                       top: '50%',
                       marginTop: `-${RADIUS}px`, // Y Center
                       border: '2px dashed rgba(255, 42, 95, 0.1)',
                   }}
               >
                   {/* Iterative Graph Placement natively looping data blocks physically */}
                   {data.marks.map((subject, idx) => {
                       // Target = 180 degrees (Left-facing). 
                       // When angle = 0, we want it at 180. 
                       const angle = (idx * ANGLE_STEP) + 180;
                       
                       // Chart Data Compilation matching earlier metrics cleanly
                       const chartData = subject.graph.map((p: any) => {
                          let derivedMax = p.max;
                          if (!derivedMax) {
                            if (p.name.includes('CT')) derivedMax = 15;
                            else if (p.name.includes('FT')) derivedMax = p.val > 5 ? 15 : 5;
                            else derivedMax = p.val > 15 ? 100 : p.val > 5 ? 15 : 5;
                          }
                          return { ...p, derivedMax, percentage: derivedMax > 0 ? (p.val / derivedMax) * 100 : 0 };
                       });

                       const isActive = idx === activeIndex;

                       return (
                           <div
                               key={idx}
                               style={{
                                   position: 'absolute',
                                   top: '50%', left: '50%',
                                   // Extrapolate bounding nodes securely outside axis
                                   transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${RADIUS}px) rotate(${-angle}deg)`, 
                                   width: '420px', 
                                   zIndex: 5,
                                   pointerEvents: isActive ? 'auto' : 'none', // Only active chart is interactive to prevent overlap blocking!
                               }}
                           >
                               {/* The native Card explicitly counter-rotates avoiding upside-down flips securely mapping mechanics natively */}
                               <motion.div 
                                    animate={{ rotate: -wheelRotation, scale: isActive ? 1.05 : 0.8, opacity: isActive ? 1 : 0.2 }} 
                                    transition={{ type: "spring", damping: 15, stiffness: 80 }}
                               >
                                  <FluidCard headerColor="--accent-crimson" style={{ padding: '0', overflow: 'hidden', pointerEvents: isActive ? 'auto' : 'none' }}>
                                      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, paddingRight: '16px' }}>
                                           <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '6px', lineHeight: 1.2, color: 'var(--text-main)' }} className="heading-fluid">{subject.name}</h3>
                                           <p style={{ fontSize: '11px', letterSpacing: '2px', opacity: 0.7, fontWeight: 700, color: 'var(--accent-purple)' }}>{subject.code}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                           <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent-crimson)', letterSpacing: '-1px', textShadow: '0 0 15px rgba(255, 42, 95, 0.3)' }}>
                                             {subject.total.split('/')[0]}<span style={{ fontSize: '16px', opacity: 0.5, color: 'var(--text-main)', textShadow: 'none' }}>/{subject.total.split('/')[1]}</span>
                                           </div>
                                        </div>
                                      </div>

                                      {/* Aggressive Fluorescent Bar Chart Graphic Blocks mapping marks structurally */}
                                      <div style={{ height: '240px', padding: '16px 16px 16px 0', margin: '0 24px 24px 24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                                         <ResponsiveContainer width={isActive ? "100%" : "99%"} height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                              <XAxis dataKey="name" stroke="none" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 800 }} />
                                              <YAxis stroke="none" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 800 }} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                                              <Tooltip content={isActive ? <CustomTooltip /> : <></>} cursor={{ fill: 'rgba(255, 42, 95, 0.1)' }} />
                                              
                                              {/* Neon Bar Interlocks natively tracking arrays */}
                                              <Bar dataKey="percentage" radius={[4, 4, 0, 0]} animationDuration={1000} isAnimationActive={isActive}>
                                                  {chartData.map((_, index) => (
                                                     <Cell key={`cell-${index}`} fill={'var(--accent-crimson)'} />
                                                  ))}
                                              </Bar>
                                            </BarChart>
                                         </ResponsiveContainer>
                                      </div>
                                  </FluidCard>
                               </motion.div>
                           </div>
                       )
                   })}
               </motion.div>
           </div>
           
        </div>
      </div>
    </div>
  );
}
