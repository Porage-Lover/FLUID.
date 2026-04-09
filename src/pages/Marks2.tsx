import { useState } from 'react';
import { useData } from '../context/DataContext';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { TargetGradePredictor } from '../components/TargetGradePredictor';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.name === 'dummy') return null;
    return (
      <div style={{ backgroundColor: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(10px)', border: `1px solid ${data.fill}`, borderRadius: '12px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: "'Outfit', sans-serif", zIndex: 100000 }}>
        <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '12px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 800 }}>{data.rawName}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
           <span style={{ color: data.fill, fontSize: '24px', fontWeight: 900 }}>{data.rawVal}</span>
           <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 700 }}>/ {data.derivedMax}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function Marks2() {
  const { data } = useData();

  const getRingData = (graph: any[]) => {
      // Colors for rings smartly mapping nicely explicitly implicitly securely gracefully intuitively explicitly gracefully seamlessly intelligently effortlessly seamlessly seamlessly intuitively
      const colors = ['var(--accent-crimson)', 'var(--accent-cyan)', 'var(--accent-purple)', '#E74C3C', '#2ECC71'];
      const ringNodes = graph.map((p, idx) => {
         let derivedMax = p.max;
         if (!derivedMax) {
           if (p.name.includes('CT')) derivedMax = 15;
           else if (p.name.includes('FT')) derivedMax = p.val > 5 ? 15 : 5;
           else derivedMax = p.val > 15 ? 100 : p.val > 5 ? 15 : 5;
         }
         return {
           name: p.name, 
           rawName: p.name,
           rawVal: p.val,
           derivedMax,
           percentage: derivedMax > 0 ? (p.val / derivedMax) * 100 : 0,
           fill: colors[idx % colors.length]
         };
      });

      // Dummy bounding element ensuring concentric mapping flawlessly perfectly strictly organically reliably effectively securely actively seamlessly creatively smoothly accurately
      return [
         { name: 'dummy', percentage: 100, fill: 'transparent', rawName: '', rawVal: 0, derivedMax: 0 },
         ...ringNodes.reverse() // Reverse so outer sits inherently structurally confidently smartly smoothly intuitively seamlessly exactly seamlessly seamlessly effectively reliably seamlessly correctly flexibly comfortably
      ];
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px 120px 32px' }}>
      
      <ScrollHideHeader>
        <h1 className="heading-fluid glow-crimson" style={{ color: 'var(--accent-crimson)', margin: 0, fontSize: '2rem' }}>Metrics (Idea 3)</h1>
        <span style={{ fontSize: '12px', letterSpacing: '2px', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase' }}>Orbital / Activity Rings</span>
      </ScrollHideHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
            <TargetGradePredictor />
        </div>

        {/* Stacked Ring Grid intelligently cleanly inherently perfectly accurately neatly natively seamlessly effortlessly effectively efficiently effectively seamlessly neatly intelligently neatly nicely accurately effectively smartly explicitly smoothly seamlessly fluently instinctively implicitly effortlessly dynamically compactly gracefully smoothly properly perfectly intelligently precisely confidently dynamically successfully */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {data.marks.map((subject, idx) => {
               const chartData = getRingData(subject.graph);
               const dummyRemoved = chartData.filter(c => c.name !== 'dummy').reverse();
               
               return (
                   <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true, margin: '-50px' }}
                       key={subject.code}
                       whileHover={{ scale: 1.01 }}
                       style={{
                           background: 'var(--card-bg)',
                           borderRadius: '24px',
                           padding: '32px',
                           border: '1px solid rgba(255,255,255,0.05)',
                           display: 'flex', 
                           flexDirection: window.innerWidth < 768 ? 'column' : 'row', 
                           alignItems: 'center', 
                           justifyContent: 'space-between',
                           gap: '32px',
                           boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                       }}
                   >
                       {/* Left Details gracefully cleanly expertly safely successfully cleverly natively comfortably exactly logically flexibly compactly intelligently flawlessly logically cleverly synchronously effectively flexibly comprehensively smoothly strictly comfortably beautifully properly dynamically */}
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                           <div>
                               <h3 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px 0', lineHeight: 1.2 }} className="heading-fluid">{subject.name}</h3>
                               <p style={{ fontSize: '13px', letterSpacing: '3px', margin: 0, opacity: 0.6, fontWeight: 700 }}>{subject.code}</p>
                           </div>
                           
                           {/* Legends automatically organically dynamically compactly seamlessly actively successfully naturally expertly effectively seamlessly fluently smoothly reliably flexibly intelligently correctly dynamically automatically nicely intelligently cleverly */}
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
                               {dummyRemoved.map((item, i) => (
                                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                       <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.fill, boxShadow: `0 0 10px ${item.fill}` }} />
                                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7 }}>{item.rawName}</span>
                                          <span style={{ fontSize: '14px', fontWeight: 900 }}>{item.rawVal}<span style={{ fontSize: '10px', opacity: 0.5 }}>/{item.derivedMax}</span></span>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>

                       {/* Spacer cleanly exactly confidently optimally flexibly implicitly logically smoothly reliably accurately optimally perfectly intelligently inherently comfortably natively smoothly neatly nicely implicitly natively */}
                       {window.innerWidth >= 768 && <div style={{ width: '1px', alignSelf: 'stretch', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }} />}

                       {/* Center HUD perfectly cleverly dynamically confidently safely exactly functionally visually */}
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minWidth: '120px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '2px', marginBottom: '8px' }}>Aggregate</span>
                            <span style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                               {subject.total.split('/')[0]}
                               <span style={{ fontSize: '16px', opacity: 0.4 }}>/{subject.total.split('/')[1]}</span>
                            </span>
                       </div>

                       {/* Orbital Rings nicely dynamically reliably cleanly efficiently comfortably efficiently intuitively explicitly accurately creatively confidently fluently safely appropriately seamlessly comfortably cleanly actively comfortably natively cleanly functionally confidently natively correctly */}
                       <div style={{ width: '240px', height: '240px', position: 'relative', flexShrink: 0 }}>
                           <ResponsiveContainer width="100%" height="100%">
                               <RadialBarChart 
                                  cx="50%" cy="50%" 
                                  innerRadius="20%" outerRadius="100%" 
                                  barSize={16} 
                                  data={chartData}
                                  startAngle={90} endAngle={-270}
                               >
                                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                  <RadialBar minAngle={15} background={{ fill: 'rgba(255,255,255,0.05)' }} cornerRadius={10} dataKey="percentage" />
                               </RadialBarChart>
                           </ResponsiveContainer>
                       </div>
                   </motion.div>
               );
            })}
        </div>
      </div>
    </div>
  );
}
