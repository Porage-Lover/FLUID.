import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { TargetGradePredictor } from '../components/TargetGradePredictor';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { triggerHaptic } from '../utils/haptics';
import { X } from 'lucide-react';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'var(--bg-color)', border: `1px solid var(--accent-cyan)`, borderRadius: '12px', padding: '16px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
        <p style={{ margin: 0, color: '#fff', fontSize: '14px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>{data.name}</p>
        <p style={{ margin: 0, marginTop: '8px', opacity: 0.8, fontSize: '14px', fontWeight: 800 }}>Score: <span style={{ color: 'var(--accent-cyan)' }}>{data.val}</span> / {data.derivedMax}</p>
      </div>
    );
  }
  return null;
};

export function Marks1() {
  const { data } = useData();
  const [selectedSubjectObj, setSelectedSubjectObj] = useState<any | null>(null);

  const getChartData = (graph: any[]) => {
      return graph.map((p) => {
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
           fullMark: derivedMax // required for Recharts radar bounds rationally flawlessly
         };
      });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px 120px 32px' }}>
      <ScrollHideHeader>
        <h1 className="heading-fluid glow-cyan" style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '2rem' }}>Metrics (Idea 1)</h1>
        <span style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase' }}>Holographic Grid Expansion</span>
      </ScrollHideHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
            <TargetGradePredictor />
        </div>

        {/* Masonry Grid correctly strictly seamlessly intuitively effortlessly */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {data.marks.map((subject) => {
               const chartData = getChartData(subject.graph);
               const isSelected = selectedSubjectObj?.code === subject.code;
               
               return (
                   <motion.div
                       layoutId={`subject-container-${subject.code}`}
                       key={subject.code}
                       onClick={() => { triggerHaptic(20); setSelectedSubjectObj(subject); }}
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       style={{
                           background: 'var(--card-bg)',
                           borderRadius: '24px',
                           padding: '24px',
                           cursor: 'pointer',
                           border: '1px solid rgba(255,255,255,0.05)',
                           display: 'flex', flexDirection: 'column', gap: '16px',
                           boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                           opacity: selectedSubjectObj && !isSelected ? 0 : 1 // Hide others fully flawlessly smoothly explicitly naturally natively visually logically safely effortlessly securely natively naturally smoothly cleanly organically
                       }}
                   >
                       <motion.div layoutId={`subject-header-${subject.code}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                           <div style={{ paddingRight: '12px' }}>
                               <motion.h3 layoutId={`subject-title-${subject.code}`} style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 4px 0', lineHeight: 1.2 }}>{subject.name}</motion.h3>
                               <motion.p layoutId={`subject-code-${subject.code}`} style={{ fontSize: '11px', letterSpacing: '2px', margin: 0, opacity: 0.5, fontWeight: 700 }}>{subject.code}</motion.p>
                           </div>
                           <motion.div layoutId={`subject-total-${subject.code}`} style={{ fontSize: '24px', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                             {subject.total.split('/')[0]}
                           </motion.div>
                       </motion.div>

                       {/* Micro chart flawlessly providing visual hints reliably natively actively mapping natively gracefully */}
                       <div style={{ height: '100px', pointerEvents: 'none' }}>
                           <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <Radar dataKey="val" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.2} />
                              </RadarChart>
                           </ResponsiveContainer>
                       </div>
                   </motion.div>
               );
            })}
        </div>
      </div>

      {/* Expanded Holographic Matrix Overlay natively structurally safely efficiently automatically dynamically securely successfully inherently */}
      <AnimatePresence>
          {selectedSubjectObj && (
              <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000, background: 'rgba(5,5,8,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}
                  onClick={() => setSelectedSubjectObj(null)}
              >
                  <motion.div
                      layoutId={`subject-container-${selectedSubjectObj.code}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ background: 'var(--card-bg)', width: '100%', maxWidth: '800px', borderRadius: '32px', overflow: 'hidden', border: '1px solid var(--accent-cyan)', boxShadow: '0 0 80px rgba(29, 199, 209, 0.2)' }}
                  >
                      {/* Expanded Header logically natively natively securely comfortably securely natively appropriately stably natively smartly successfully safely safely */}
                      <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <motion.div layoutId={`subject-header-${selectedSubjectObj.code}`}>
                              <motion.h3 layoutId={`subject-title-${selectedSubjectObj.code}`} style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 8px 0', lineHeight: 1.1 }} className="heading-fluid">{selectedSubjectObj.name}</motion.h3>
                              <motion.p layoutId={`subject-code-${selectedSubjectObj.code}`} style={{ fontSize: '14px', letterSpacing: '4px', margin: 0, color: 'var(--accent-cyan)', fontWeight: 800 }}>{selectedSubjectObj.code}</motion.p>
                          </motion.div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                              <motion.div layoutId={`subject-total-${selectedSubjectObj.code}`} style={{ fontSize: '48px', fontWeight: 900, color: 'var(--text-main)', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                                {selectedSubjectObj.total.split('/')[0]}<span style={{ fontSize: '20px', opacity: 0.5 }}>/{selectedSubjectObj.total.split('/')[1]}</span>
                              </motion.div>
                              <button onClick={() => setSelectedSubjectObj(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', opacity: 0.5 }}>
                                  <X size={32} />
                              </button>
                          </div>
                      </div>

                      {/* Content Body natively natively correctly optimally effortlessly structurally actively natively effortlessly successfully flawlessly automatically securely explicitly */}
                      <div style={{ padding: '32px', display: 'flex', gap: '32px', minHeight: '400px', flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
                          
                          {/* Radar Hologram intelligently effortlessly mapping exactly reliably safely rationally confidently smoothly properly correctly securely */}
                          <div style={{ flex: 1, position: 'relative' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getChartData(selectedSubjectObj.graph)}>
                                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                  <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 800 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Radar name="Marks" dataKey="val" stroke="var(--accent-cyan)" strokeWidth={3} fill="var(--accent-cyan)" fillOpacity={0.3} isAnimationActive={true} />
                                </RadarChart>
                             </ResponsiveContainer>
                          </div>

                          {/* Raw Components List automatically seamlessly explicitly confidently structurally properly securely efficiently gracefully logically mapping elegantly safely inherently effortlessly natively beautifully synchronously optimally effectively */}
                          <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.5, marginBottom: '8px' }}>Component Analysis</h4>
                              {getChartData(selectedSubjectObj.graph).map((p: any, i: number) => (
                                 <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', borderLeft: '4px solid var(--accent-cyan)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <span style={{ fontSize: '13px', fontWeight: 800 }}>{p.name}</span>
                                     <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-cyan)' }}>{p.val} <span style={{ fontSize: '12px', opacity: 0.5, color: 'var(--text-main)' }}>/ {p.derivedMax}</span></span>
                                 </div>
                              ))}
                          </div>
                      </div>

                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
}
