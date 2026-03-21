import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, Calculator } from 'lucide-react';
import { ScrollHideHeader } from '../components/ScrollHideHeader';

const GRADE_THRESHOLDS = [
  { grade: 'O', min: 91, points: 10, color: 'var(--accent-cyan)' },
  { grade: 'A+', min: 81, points: 9, color: 'var(--accent-purple)' },
  { grade: 'A', min: 71, points: 8, color: 'var(--text-main)' },
  { grade: 'B+', min: 61, points: 7, color: 'var(--text-muted)' },
  { grade: 'B', min: 56, points: 6, color: 'var(--text-muted)' },
  { grade: 'C', min: 51, points: 5, color: 'var(--accent-crimson)' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'var(--bg-color)', border: '1px solid rgba(29, 199, 209, 0.3)', borderRadius: '12px', padding: '16px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
        <p style={{ margin: 0, color: '#fff', fontSize: '14px', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
           <span style={{ color: 'var(--accent-cyan)', fontSize: '28px', fontWeight: 900 }}>{data.percentage.toFixed(1)}%</span>
        </div>
        <p style={{ margin: 0, marginTop: '8px', color: 'var(--accent-purple)', fontSize: '14px', fontWeight: 800 }}>Raw Score: <span style={{ color: '#fff' }}>{data.val} / {data.derivedMax}</span></p>
      </div>
    );
  }
  return null;
};

export function Marks() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const { data } = useData();
  const [showPredictor, setShowPredictor] = useState(false);
  const [globalInternal, setGlobalInternal] = useState(40);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 120px 32px' }}>
      <ScrollHideHeader style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'transparent' }}>
        <h1 className="heading-fluid glow-crimson" style={{ color: 'var(--accent-crimson)', margin: 0, fontSize: '2rem' }}>Metrics</h1>
      </ScrollHideHeader>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Global Target Grade Predictor */}
        <motion.div layout variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
          <FluidCard style={{ padding: '0', overflow: 'hidden' }} headerColor="--accent-purple">
            <motion.div 
              layout
              onClick={() => setShowPredictor(!showPredictor)}
              style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: showPredictor ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.3s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(139, 29, 209, 0.15)', border: '1px solid var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(139, 29, 209, 0.3)' }}>
                   <Calculator size={24} color="var(--accent-purple)" strokeWidth={2.5} />
                 </div>
                 <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '1px' }}>Target Grade Predictor</span>
              </div>
              <motion.div animate={{ rotate: showPredictor ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <ChevronDown size={28} color="var(--text-main)" />
              </motion.div>
            </motion.div>

            <AnimatePresence>
              {showPredictor && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 800, opacity: 0.6 }}>Hypothetical Internal Tracker</span>
                        <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-purple)' }}>{globalInternal}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="60" 
                        value={globalInternal}
                        onChange={(e) => setGlobalInternal(Number(e.target.value))}
                        style={{ padding: 0 }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                      {GRADE_THRESHOLDS.map((t, i) => {
                        const required = t.min - Math.min(globalInternal, 60);
                        const impossible = required > 40;
                        const secured = required <= 0;
                        const maxBound = t.grade === 'O' ? 100 : GRADE_THRESHOLDS[i - 1]?.min - 1;
                        
                        return (
                          <div key={t.grade} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', opacity: impossible ? 0.3 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '32px', fontWeight: 900, color: t.color, textShadow: `0 0 10px ${t.color}` }}>{t.grade}</span>
                              <span style={{ fontSize: '20px', fontWeight: 800 }}>
                                {secured ? <span style={{ color: 'var(--accent-cyan)' }}>Secured</span> : impossible ? <span style={{ color: 'var(--accent-crimson)' }}>N/A</span> : `${required}`}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, opacity: 0.5 }}>{t.min} - {maxBound} Total</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </FluidCard>
        </motion.div>

        {/* Subjects List */}
        {data.marks.map((subject, idx) => (
          <motion.div key={idx} layout variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 24 } } }}>
            <FluidCard style={{ padding: '0', overflow: 'hidden' }} headerColor="--accent-purple">
              
              {/* Header Box */}
              <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '16px' }}>
                   <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px', lineHeight: 1.2, color: 'var(--text-main)' }}>{subject.name}</h3>
                   <p style={{ fontSize: '12px', letterSpacing: '2px', opacity: 0.7, fontWeight: 700 }}>{subject.code}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent-cyan)', letterSpacing: '-1px', textShadow: '0 0 15px rgba(29,199,209,0.3)' }}>
                     {subject.total.split('/')[0]}<span style={{ fontSize: '18px', opacity: 0.5, color: 'var(--text-main)', textShadow: 'none' }}>/{subject.total.split('/')[1]}</span>
                   </div>
                </div>
              </div>

              {/* Chart Area Cyberspace Mode */}
              <div style={{ height: '240px', padding: '16px 16px 16px 0', margin: '0 24px 24px 24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[ { name: '0', percentage: 0, val: 0, max: 100, derivedMax: 100 }, ...subject.graph.map((p: any) => {
                       let derivedMax = p.max;
                       if (!derivedMax) {
                          if (p.name.includes('CT')) derivedMax = 15;
                          else if (p.name.includes('FT')) derivedMax = p.val > 5 ? 15 : 5;
                          else derivedMax = p.val > 15 ? 100 : p.val > 5 ? 15 : 5;
                       }
                       return { ...p, derivedMax, percentage: derivedMax > 0 ? (p.val / derivedMax) * 100 : 0 };
                    })]} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="none" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }} />
                      <YAxis stroke="none" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="percentage" stroke="var(--accent-cyan)" strokeWidth={4} dot={{ r: 4, fill: 'var(--accent-purple)', stroke: 'var(--card-bg)', strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--accent-crimson)' }} animationDuration={1000} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>

            </FluidCard>
          </motion.div>
        ))}

      </motion.div>
    </div>
  );
}
