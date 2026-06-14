import { useState, useMemo } from 'react';
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
      <div style={{ backgroundColor: 'rgba(5,5,8,0.9)', backdropFilter: 'blur(10px)', border: `1px solid ${data.fill}`, borderRadius: '20px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: "var(--font-main)", zIndex: 100000 }}>
        <p style={{ margin: 0, color: 'var(--text-main)', fontSize: 'var(--text-xs)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 800 }}>{data.rawName}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
           <span style={{ color: data.fill, fontSize: 'var(--text-2xl)', fontWeight: 900 }}>{data.rawVal}</span>
           <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>/ {data.derivedMax}</span>
        </div>
      </div>
    );
  }
  return null;
};

const colors = ['#FF2A5F', '#FF3399', '#BF5AF2', '#5E5CE6', '#0A84FF', '#32ADE6', '#30D158', '#FFD60A', '#FF9F0A'];

const getRingData = (graph: any[]) => {
    return graph.map((p, idx) => {
       const derivedMax = p.max || 100; // Trust the API's max, fallback to 100 to prevent NaN crashes

       const rawValStr = String(p.val).trim().toUpperCase();
       const isAbsent = rawValStr === 'ABS';
       const parsedVal = isAbsent ? 0 : (parseFloat(p.val) || 0);

       return {
         name: p.name,
         rawName: p.name,
         rawVal: isAbsent ? 'ABS' : p.val,
         derivedMax,
         percentage: derivedMax > 0 ? (parsedVal / derivedMax) * 100 : 0,
         fill: colors[idx % colors.length]
       };
    });
};

export function Marks() {
  const { data } = useData();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // ⚡ Bolt Optimization:
  // Memoized the extraction, calculation, and mapping of `ringNodes`, `chartData`,
  // and `split()` operations out of the main rendering loop. Previously these ran
  // O(N) operations and array allocations on every render cycle.
  const processedMarksData = useMemo(() => {
     return data.marks.map((subject, subjectIdx) => {
         const isDense = subject.graph.length > 4;
         const ringSize = isDense ? 8 : 16;
         const ringNodes = getRingData(subject.graph);

         const chartData = [
            { name: 'dummy', percentage: 100, fill: 'transparent', rawName: '', rawVal: 0, derivedMax: 0 },
            ...[...ringNodes].reverse()
         ];
         const dummyRemoved = ringNodes;

         const [totalEarned, totalMax] = subject.total.split('/');

         return {
             ...subject,
             originalIdx: subjectIdx,
             isDense,
             ringSize,
             chartData,
             dummyRemoved,
             totalEarned,
             totalMax
         };
     });
  }, [data.marks]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 120px 24px' }}>
      
      <ScrollHideHeader>
        <h1 className="heading-fluid glow-crimson" style={{ color: 'var(--accent-crimson)', margin: 0, fontSize: 'var(--text-4xl)' }}>Metrics</h1>
      </ScrollHideHeader>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
            <TargetGradePredictor />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {processedMarksData.map((subject) => {
               const isExpanded = expandedIdx === subject.originalIdx;
               
               return (
                   <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true, margin: '-50px' }}
                       key={subject.code}
                       transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                       onClick={() => setExpandedIdx(isExpanded ? null : subject.originalIdx)}
                       className="fluid-card"
                       style={{
                           padding: '0',
                           cursor: 'pointer',
                       }}
                   >
                       <div style={{
                           padding: 'clamp(20px, 4vw, 40px)',
                           display: 'flex', 
                           flexDirection: 'row',
                           alignItems: 'center', 
                           justifyContent: 'space-between',
                           gap: 'clamp(16px, 3vw, 40px)',
                           flexWrap: 'wrap',
                       }}>
                           {/* Left: Subject Info */}
                           <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '180px' }}>
                               <div>
                                   <h3 style={{ fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 800, margin: '0 0 6px 0', lineHeight: 1.1, letterSpacing: '-0.5px' }} className="heading-fluid">{subject.name}</h3>
                                   <p style={{ fontSize: 'var(--text-xs)', letterSpacing: '3px', margin: 0, opacity: 0.4, fontWeight: 600 }}>{subject.code}</p>
                               </div>
                               
                               {/* Pill Legends */}
                               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                   {subject.dummyRemoved.map((item: any, i: number) => (
                                       <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                           <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.fill, boxShadow: `0 0 10px ${item.fill}` }} />
                                           <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>{item.rawName}</span>
                                           <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800 }}>{item.rawVal}<span style={{ fontSize: 'var(--text-xs)', opacity: 0.3 }}>/{item.derivedMax}</span></span>
                                       </div>
                                   ))}
                               </div>
                           </div>

                           {/* Center: Aggregate */}
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', flexShrink: 0 }}>
                                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, letterSpacing: '3px', marginBottom: '4px' }}>Total</span>
                                <span style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 300, color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px', letterSpacing: '-2px' }}>
                                   {subject.totalEarned}
                                   <span style={{ fontSize: 'clamp(12px, 2vw, 18px)', opacity: 0.3, fontWeight: 400, letterSpacing: '0' }}>/{subject.totalMax}</span>
                                </span>
                           </div>

                           {/* Right: Orbital Rings */}
                           <div style={{ width: 'clamp(140px, 25vw, 280px)', height: 'clamp(140px, 25vw, 280px)', position: 'relative', flexShrink: 0 }}>
                               <ResponsiveContainer width="100%" height="100%">
                                   <RadialBarChart 
                                      cx="50%" cy="50%" 
                                      innerRadius={subject.isDense ? "15%" : "30%"}
                                      outerRadius="100%" 
                                      barSize={subject.ringSize}
                                      data={subject.chartData}
                                      startAngle={90} endAngle={-270}
                                   >
                                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                      <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }} cornerRadius={ringSize} dataKey="percentage" />
                                   </RadialBarChart>
                               </ResponsiveContainer>
                           </div>
                       </div>
                   </motion.div>
               );
            })}
        </div>
      </div>
    </div>
  );
}
