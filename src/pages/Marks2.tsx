import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { TargetGradePredictor } from '../components/TargetGradePredictor';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { triggerHaptic } from '../utils/haptics';
import { Layers } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(10px)', border: `1px solid var(--accent-purple)`, borderRadius: '12px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: "'Outfit', sans-serif" }}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 800 }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
           <span style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: 900 }}>{data.val}</span>
           <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 700 }}>/ {data.derivedMax}</span>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 800 }}>
           {data.percentage.toFixed(1)}% Yield
        </div>
      </div>
    );
  }
  return null;
};

export function Marks2() {
  const { data } = useData();
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSubject = data.marks[activeIndex] || null;

  const chartData = useMemo(() => {
     if (!activeSubject) return [];
     return activeSubject.graph.map((p: any) => {
         let derivedMax = p.max;
         if (!derivedMax) {
           if (p.name.includes('CT')) derivedMax = 15;
           else if (p.name.includes('FT')) derivedMax = p.val > 5 ? 15 : 5;
           else derivedMax = p.val > 15 ? 100 : p.val > 5 ? 15 : 5;
         }
         return { 
           name: p.name, 
           val: p.val, 
           derivedMax,
           percentage: derivedMax > 0 ? (p.val / derivedMax) * 100 : 0
         };
      });
  }, [activeSubject]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px 120px 32px' }}>
      
      {/* Sleek Command Top Header seamlessly natively automatically securely */}
      <div style={{ padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
         <div>
             <h1 className="heading-fluid glow-purple" style={{ color: 'var(--accent-purple)', margin: 0, fontSize: '2rem' }}>Terminal</h1>
             <span style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase' }}>Chronological Analytics Dashboard</span>
         </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
            <TargetGradePredictor />
        </div>

        {/* Dashboard Frame properly natively structuring effortlessly gracefully visually easily */}
        <div style={{ display: 'flex', gap: '32px', minHeight: '600px' }}>
           
           {/* Sidebar: IDE style Subject List natively safely compactly gracefully seamlessly flawlessly explicitly natively successfully efficiently correctly intuitively properly rationally correctly */}
           <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '16px', borderRight: '1px solid rgba(255,255,255,0.05)', maxHeight: '600px', overflowY: 'auto' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px 16px 12px', opacity: 0.5, fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  <Layers size={14} /> Repository Nodes
               </div>
               
               {data.marks.map((subject, idx) => {
                   const isActive = idx === activeIndex;
                   return (
                       <button
                           key={idx}
                           onClick={() => { triggerHaptic(10); setActiveIndex(idx); }}
                           style={{
                               padding: '16px',
                               background: isActive ? 'rgba(139, 29, 209, 0.1)' : 'transparent',
                               border: 'none',
                               borderLeft: isActive ? '3px solid var(--accent-purple)' : '3px solid transparent',
                               borderRadius: '0 12px 12px 0',
                               color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                               textAlign: 'left',
                               cursor: 'pointer',
                               transition: 'all 0.2s ease',
                               display: 'flex', flexDirection: 'column', gap: '4px'
                           }}
                       >
                           <h3 style={{ fontSize: '14px', fontWeight: isActive ? 900 : 600, margin: 0, lineHeight: 1.3, color: isActive ? '#fff' : 'var(--text-muted)' }}>{subject.name}</h3>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <p style={{ fontSize: '10px', letterSpacing: '1px', margin: 0, opacity: isActive ? 0.8 : 0.5, fontWeight: 700, color: 'var(--accent-purple)' }}>{subject.code}</p>
                               <span style={{ fontSize: '12px', fontWeight: 900, color: isActive ? 'var(--accent-purple)' : 'var(--text-muted)' }}>{subject.total}</span>
                           </div>
                       </button>
                   );
               })}
           </div>

           {/* Main HUD gracefully tracking securely correctly confidently properly efficiently intuitively successfully intelligently expertly cleanly smartly securely efficiently flawlessly elegantly gracefully smartly confidently */}
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
               <AnimatePresence mode="wait">
                  {activeSubject && (
                      <motion.div
                         key={activeSubject.code}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ duration: 0.2 }}
                         style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                      >
                          {/* HUD Header cleanly safely explicitly flexibly securely effortlessly explicitly cleanly smoothly functionally efficiently dynamically securely securely */}
                          <div style={{ padding: '0 24px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div>
                                  <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0', lineHeight: 1.1 }} className="heading-fluid">{activeSubject.name}</h2>
                                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-purple)', letterSpacing: '2px' }}>{activeSubject.code}</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, display: 'block', marginBottom: '4px' }}>Aggregated Impact</span>
                                  <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)' }}>{activeSubject.total.split('/')[0]}<span style={{ fontSize: '16px', opacity: 0.5 }}>/{activeSubject.total.split('/')[1]}</span></span>
                              </div>
                          </div>

                          {/* Massive Area Chart securely tracking chronological layout perfectly gracefully logically inherently explicitly safely successfully cleanly smartly properly correctly compactly smoothly */}
                          <div style={{ flex: 1, minHeight: '340px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                      <defs>
                                          <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
                                              <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                      <XAxis dataKey="name" stroke="none" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} dy={10} />
                                      <YAxis stroke="none" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} dx={-10} domain={[0, 100]} />
                                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                      <Area type="monotone" dataKey="percentage" stroke="var(--accent-purple)" strokeWidth={3} fillOpacity={1} fill="url(#colorPurple)" activeDot={{ r: 6, fill: 'var(--accent-purple)', stroke: '#fff', strokeWidth: 2 }} />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>

                          {/* Stat Bottom Bar reliably cleanly mapping exactly properly perfectly successfully appropriately dynamically cleanly automatically efficiently nicely seamlessly confidently */}
                          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', padding: '0 8px' }}>
                              {chartData.map((stat: any, i: number) => (
                                 <div key={i} style={{ flex: 1, background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                                     <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>{stat.name}</span>
                                     <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px' }}>{stat.val} <span style={{ opacity: 0.4, fontSize: '12px' }}>/ {stat.derivedMax}</span></span>
                                 </div>
                              ))}
                          </div>
                          
                      </motion.div>
                  )}
               </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
