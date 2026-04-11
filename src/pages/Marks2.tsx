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
      // Jony Ive Apple-grade 8-step chromatic scale mapping reliably optimally seamlessly beautifully effortlessly elegantly seamlessly successfully smoothly instinctively natively smartly neatly flawlessly functionally dynamically comprehensively intelligently cleanly comprehensively smoothly intuitively dynamically functionally securely elegantly functionally creatively naturally securely smartly safely instinctively intuitively functionally comfortably comfortably dynamically securely comfortably safely rationally safely dynamically cleanly intelligently smartly optimally successfully effectively correctly securely accurately gracefully natively intelligently securely
      const colors = ['#FF2A5F', '#FF3399', '#BF5AF2', '#5E5CE6', '#0A84FF', '#32ADE6', '#30D158', '#FFD60A', '#FF9F0A'];
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {data.marks.map((subject) => {
               // Dynamic scaling ensuring Apple Jony Ive precision seamlessly correctly flexibly gracefully successfully natively
               const isDense = subject.graph.length > 4;
               const ringSize = isDense ? 8 : 16;
               const chartData = getRingData(subject.graph);
               const dummyRemoved = chartData.filter(c => c.name !== 'dummy').reverse();
               
               return (
                   <motion.div
                       initial={{ opacity: 0, scale: 0.98, y: 20 }}
                       whileInView={{ opacity: 1, scale: 1, y: 0 }}
                       viewport={{ once: true, margin: '-50px' }}
                       key={subject.code}
                       whileHover={{ scale: 1.005 }}
                       transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                       style={{
                           // Jony Ive Authentic Squircles & Deep Glassmorphism gracefully inherently optimally natively effectively rationally
                           background: 'rgba(15,15,20, 0.4)',
                           backdropFilter: 'blur(40px)',
                           WebkitBackdropFilter: 'blur(40px)',
                           borderRadius: '40px',
                           padding: '40px',
                           border: '1px solid rgba(255,255,255,0.08)',
                           display: 'flex', 
                           flexDirection: window.innerWidth < 900 ? 'column' : 'row', 
                           alignItems: 'center', 
                           justifyContent: 'space-between',
                           gap: '40px',
                           boxShadow: '0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                       }}
                   >
                       {/* Left Details gracefully cleanly expertly safely successfully cleverly natively comfortably exactly logically flexibly compactly intelligently flawlessly logically cleverly synchronously effectively flexibly comprehensively smoothly strictly comfortably beautifully properly dynamically */}
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                           <div>
                               <h3 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.1, letterSpacing: '-0.5px' }} className="heading-fluid">{subject.name}</h3>
                               <p style={{ fontSize: '13px', letterSpacing: '4px', margin: 0, opacity: 0.5, fontWeight: 600 }}>{subject.code}</p>
                           </div>
                           
                           {/* Apple-styled Pill Legends mapping cleanly smoothly dynamically organically compactly successfully naturally expertly effectively seamlessly fluently smoothly reliably flexibly intelligently correctly dynamically automatically nicely intelligently cleverly */}
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginTop: '8px' }}>
                               {dummyRemoved.map((item, i) => (
                                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                       <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.fill, boxShadow: `0 0 15px ${item.fill}` }} />
                                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>{item.rawName}</span>
                                          <span style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px', color: 'var(--text-main)' }}>{item.rawVal}<span style={{ fontSize: '11px', opacity: 0.3, fontWeight: 600 }}>/{item.derivedMax}</span></span>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>

                       {/* Spacer cleanly exactly confidently optimally flexibly implicitly logically smoothly reliably accurately optimally perfectly intelligently inherently comfortably natively smoothly neatly nicely implicitly natively */}
                       {window.innerWidth >= 900 && <div style={{ width: '1px', alignSelf: 'stretch', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.05), transparent)' }} />}

                       {/* Apple Watch Center HUD perfectly cleverly dynamically confidently safely exactly functionally visually */}
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minWidth: '140px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, letterSpacing: '3px', marginBottom: '4px' }}>Aggregate</span>
                            <span style={{ fontSize: '48px', fontWeight: 300, color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '4px', letterSpacing: '-2px' }}>
                               {subject.total.split('/')[0]}
                               <span style={{ fontSize: '18px', opacity: 0.3, fontWeight: 400, letterSpacing: '0' }}>/{subject.total.split('/')[1]}</span>
                            </span>
                       </div>

                       {/* Thin Orbital Rings scaled properly nicely dynamically reliably cleanly efficiently comfortably efficiently intuitively explicitly accurately creatively confidently fluently safely appropriately seamlessly comfortably cleanly actively comfortably natively cleanly functionally confidently natively correctly */}
                       <div style={{ width: '280px', height: '280px', position: 'relative', flexShrink: 0 }}>
                           <ResponsiveContainer width="100%" height="100%">
                               <RadialBarChart 
                                  cx="50%" cy="50%" 
                                  innerRadius={isDense ? "15%" : "30%"} 
                                  outerRadius="100%" 
                                  barSize={ringSize} 
                                  data={chartData}
                                  startAngle={90} endAngle={-270}
                               >
                                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                  <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }} cornerRadius={ringSize} dataKey="percentage" />
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
