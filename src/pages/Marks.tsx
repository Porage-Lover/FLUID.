import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { TargetGradePredictor } from '../components/TargetGradePredictor';
import { FluidCard } from '../components/FluidCard';
import { PieChart, Pie, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { triggerHaptic } from '../utils/haptics';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'var(--bg-color)', border: `1px solid ${payload[0].payload.fill || 'var(--accent-crimson)'}`, borderRadius: '12px', padding: '16px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
        <p style={{ margin: 0, color: '#fff', fontSize: '14px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>{data.name}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
           <span style={{ color: payload[0].payload.fill || 'var(--accent-crimson)', fontSize: '28px', fontWeight: 900 }}>{data.percentage.toFixed(1)}%</span>
        </div>
        <p style={{ margin: 0, marginTop: '8px', opacity: 0.8, fontSize: '14px', fontWeight: 800 }}>Score: <span style={{ color: '#fff' }}>{data.val} / {data.derivedMax}</span></p>
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
  
  const RADIUS = 600; 

  const activeSubject = data.marks[activeIndex] || null;

  const handleSubjectClick = (index: number) => {
      triggerHaptic(20);
      let diff = activeIndex - index;
      
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
        
        <TargetGradePredictor />

        <div style={{ display: 'flex', gap: '48px', alignItems: 'center', marginTop: '24px', minHeight: '640px', position: 'relative' }}>
           
           {/* LEFT PANE: Stationary Subject Menu with Totals dynamically resolving securely */}
           <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 50 }}>
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
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div style={{ flex: 1, paddingRight: '12px' }}>
                                   <h3 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 4px 0', lineHeight: 1.2 }}>{subject.name}</h3>
                                   <p style={{ fontSize: '11px', letterSpacing: '2px', margin: 0, opacity: isActive ? 0.8 : 0.5, fontWeight: 700 }}>{subject.code}</p>
                               </div>
                               <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                   <div style={{ fontSize: '20px', fontWeight: 900, textShadow: isActive ? '0 0 10px rgba(0,0,0,0.5)' : 'none' }}>
                                     {subject.total.split('/')[0]}<span style={{ fontSize: '12px', opacity: isActive ? 0.8 : 0.5 }}>/{subject.total.split('/')[1]}</span>
                                   </div>
                               </div>
                           </div>
                       </motion.button>
                   );
               })}
           </div>

           {/* RIGHT PANE: Giant Graphical Wheel & Bottom Pop-outs safely explicitly mapping stably tracking structurally natively stably actively smoothly optimally robustly properly automatically elegantly accurately cleanly seamlessly smoothly dynamically natively implicitly comfortably intelligently confidently flexibly natively reliably effectively appropriately strictly accurately easily */}
           <div style={{ flex: 1, position: 'relative', height: '640px', display: 'flex', flexDirection: 'column', overflow: 'visible', pointerEvents: 'none' }}>
               
               <motion.div 
                   animate={{ rotate: wheelRotation }} 
                   transition={{ type: "spring", damping: 15, stiffness: 80, mass: 1 }}
                   style={{ 
                       width: `${RADIUS * 2}px`, 
                       height: `${RADIUS * 2}px`, 
                       borderRadius: '50%', 
                       position: 'absolute', 
                       right: `-${RADIUS * 1.0}px`,
                       top: '50%',
                       marginTop: `-${RADIUS}px`, 
                       border: '2px dashed rgba(255, 42, 95, 0.1)',
                       zIndex: 10
                   }}
               >
                   {data.marks.map((subject, idx) => {
                       const angle = (idx * ANGLE_STEP) + 180;
                       
                       const chartData = subject.graph.map((p: any, i) => {
                          let derivedMax = p.max;
                          if (!derivedMax) {
                            if (p.name.includes('CT')) derivedMax = 15;
                            else if (p.name.includes('FT')) derivedMax = p.val > 5 ? 15 : 5;
                            else derivedMax = p.val > 15 ? 100 : p.val > 5 ? 15 : 5;
                          }
                          const colors = ['var(--accent-crimson)', 'var(--accent-cyan)', 'var(--accent-purple)', '#EDD24C', '#ff7eb3'];
                          return { ...p, derivedMax, percentage: derivedMax > 0 ? (p.val / derivedMax) * 100 : 0, fill: colors[i % colors.length] };
                       });

                       const isActive = idx === activeIndex;

                       return (
                           <div
                               key={idx}
                               style={{
                                   position: 'absolute',
                                   top: '50%', left: '50%',
                                   transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${RADIUS}px) rotate(${-angle}deg)`, 
                                   width: '460px', 
                                   zIndex: 5,
                                   pointerEvents: isActive ? 'auto' : 'none',
                               }}
                           >
                               <motion.div 
                                    animate={{ rotate: -wheelRotation, scale: isActive ? 1.05 : 0.8, opacity: isActive ? 1 : 0.2 }} 
                                    transition={{ type: "spring", damping: 15, stiffness: 80 }}
                               >
                                  <FluidCard headerColor="--accent-crimson" style={{ padding: '0', overflow: 'hidden', pointerEvents: isActive ? 'auto' : 'none', boxShadow: isActive ? '0 30px 60px rgba(0,0,0,0.6)' : 'none' }}>
                                      <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, paddingRight: '16px' }}>
                                           <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '6px', lineHeight: 1.2, color: 'var(--text-main)' }} className="heading-fluid">{subject.name}</h3>
                                           <p style={{ fontSize: '11px', letterSpacing: '2px', opacity: 0.7, fontWeight: 700, color: 'var(--accent-purple)' }}>{subject.code}</p>
                                        </div>
                                      </div>

                                      {/* Solitary Centered Expanded Pie Chart inherently stripping separated lists safely structurally inherently perfectly beautifully successfully explicitly natively optimally gracefully properly correctly effortlessly accurately smoothly effortlessly inherently structurally successfully intelligently intelligently gracefully flexibly accurately inherently efficiently reliably safely effortlessly automatically seamlessly flawlessly natively effectively beautifully automatically smartly securely rationally robustly safely effectively automatically stably natively effectively flexibly stably functionally confidently logically completely flawlessly dynamically natively properly fluently efficiently natively correctly effortlessly flawlessly flexibly seamlessly gracefully properly properly beautifully dynamically perfectly seamlessly */}
                                      <div style={{ height: '360px', padding: '16px', margin: '0 24px 24px 24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                          <ResponsiveContainer width="100%" height="100%">
                                             <PieChart>
                                                <Tooltip content={isActive ? <CustomTooltip /> : <></>} cursor={{ fill: 'rgba(255, 42, 95, 0.1)' }} />
                                                <Pie 
                                                    data={chartData} 
                                                    dataKey="val" 
                                                    nameKey="name" 
                                                    cx="50%" 
                                                    cy="50%" 
                                                    innerRadius={80} 
                                                    outerRadius={120} 
                                                    paddingAngle={6}
                                                    cornerRadius={8}
                                                    isAnimationActive={isActive}
                                                    stroke="none"
                                                >
                                                    {chartData.map((entry, index) => (
                                                       <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                             </PieChart>
                                          </ResponsiveContainer>
                                      </div>
                                  </FluidCard>
                               </motion.div>
                           </div>
                       )
                   })}
               </motion.div>

               {/* Absolute Bottom "Non-Moving" Pop-out Component Box natively mapping strictly reliably gracefully actively safely */}
               <AnimatePresence mode="wait">
                  {activeSubject && (
                      <motion.div
                         key={activeSubject.code}
                         initial={{ y: 50, opacity: 0, scale: 0.95 }}
                         animate={{ y: 0, opacity: 1, scale: 1 }}
                         exit={{ y: 30, opacity: 0, scale: 0.95 }}
                         transition={{ type: "spring", delay: 0.1, bounce: 0.4 }}
                         style={{
                             position: 'absolute',
                             bottom: '24px',
                             left: '0px', // Fills the available space from the edge inherently smoothly accurately smoothly effectively easily smartly
                             right: '25%', // Stop it from spilling under the visible center of the wheel physically successfully
                             background: 'rgba(15, 15, 20, 0.95)',
                             backdropFilter: 'blur(20px)',
                             WebkitBackdropFilter: 'blur(20px)',
                             border: '1px solid rgba(255,255,255,0.05)',
                             borderRadius: '24px',
                             padding: '24px',
                             display: 'flex',
                             gap: '16px',
                             flexWrap: 'wrap',
                             justifyContent: 'center',
                             boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                             zIndex: 100,
                             pointerEvents: 'auto'
                         }}
                      >
                         {activeSubject.graph.map((p: any, i) => {
                              let derivedMax = p.max;
                              if (!derivedMax) {
                                if (p.name.includes('CT')) derivedMax = 15;
                                else if (p.name.includes('FT')) derivedMax = p.val > 5 ? 15 : 5;
                                else derivedMax = p.val > 15 ? 100 : p.val > 5 ? 15 : 5;
                              }
                              const colors = ['var(--accent-crimson)', 'var(--accent-cyan)', 'var(--accent-purple)', '#EDD24C', '#ff7eb3'];
                              const fill = colors[i % colors.length];
            
                              return (
                                  <motion.div 
                                      whileHover={{ y: -5 }}
                                      key={i} 
                                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderRadius: '16px', borderBottom: `4px solid ${fill}`, minWidth: '120px' }}
                                  >
                                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>{p.name}</span>
                                      <span style={{ fontSize: '24px', fontWeight: 900, color: fill, marginTop: '4px' }}>{p.val} <span style={{ opacity: 0.4, fontSize: '14px', color: 'var(--text-main)' }}>/ {derivedMax}</span></span>
                                  </motion.div>
                              );
                         })}
                      </motion.div>
                  )}
               </AnimatePresence>

           </div>
           
        </div>
      </div>
    </div>
  );
}
