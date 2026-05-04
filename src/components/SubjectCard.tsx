import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FluidCard } from './FluidCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'var(--bg-color)', border: '1px solid rgba(29, 199, 209, 0.3)', borderRadius: '12px', padding: '16px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', fontFamily: "var(--font-main)", fontWeight: 700 }}>
        <p style={{ margin: 0, color: '#fff', fontSize: 'var(--text-sm)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
           <span style={{ color: 'var(--accent-cyan)', fontSize: 'var(--text-2xl)', fontWeight: 900 }}>{data.percentage.toFixed(1)}%</span>
        </div>
        <p style={{ margin: 0, marginTop: '8px', color: 'var(--accent-purple)', fontSize: 'var(--text-sm)', fontWeight: 800 }}>Raw Score: <span style={{ color: '#fff' }}>{data.val} / {data.derivedMax}</span></p>
      </div>
    );
  }
  return null;
};

interface SubjectCardProps {
  subject: {
    name: string;
    code: string;
    total: string;
    graph: Array<{ name: string; val: number }>;
  };
}

export function SubjectCard({ subject }: SubjectCardProps) {
  // ⚡ Bolt Optimization:
  // Memoizing chart data calculation to prevent O(n) array mapping
  // on every single re-render of this component.
  // Impact: Eliminates unnecessary CPU cycles during scrolling or parent updates.
  const chartData = useMemo(() => {
    return [
      { name: '0', percentage: 0, val: 0, max: 100, derivedMax: 100 },
      ...subject.graph.map((p: any) => {
        let derivedMax = p.max;
        if (!derivedMax) {
          if (p.name.includes('CT')) derivedMax = 15;
          else if (p.name.includes('FT')) derivedMax = p.val > 5 ? 15 : 5;
          else derivedMax = p.val > 15 ? 100 : p.val > 5 ? 15 : 5;
        }
        return { ...p, derivedMax, percentage: derivedMax > 0 ? (p.val / derivedMax) * 100 : 0 };
      })
    ];
  }, [subject.graph]);

  // ⚡ Bolt Optimization:
  // Hoisting repeated `subject.total.split('/')` operations before the JSX return.
  // Impact: Prevents redundant O(N) array allocation and string processing on every render cycle.
  const [marksEarned, marksTotal] = subject.total.split('/');

  return (
    <motion.div layout variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 24 } } }}>
      <FluidCard style={{ padding: '0', overflow: 'hidden' }} headerColor="--accent-purple">

        {/* Header Box */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '16px' }}>
             <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: '6px', lineHeight: 1.2, color: 'var(--text-main)' }}>{subject.name}</h3>
             <p style={{ fontSize: 'var(--text-xs)', letterSpacing: '2px', opacity: 0.7, fontWeight: 700 }}>{subject.code}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'var(--accent-cyan)', letterSpacing: '-1px', textShadow: '0 0 15px rgba(29,199,209,0.3)' }}>
               {marksEarned}<span style={{ fontSize: 'var(--text-lg)', opacity: 0.5, color: 'var(--text-main)', textShadow: 'none' }}>/{marksTotal}</span>
             </div>
          </div>
        </div>

        {/* Chart Area Cyberspace Mode */}
        <div style={{ height: '240px', padding: '16px 16px 16px 0', margin: '0 24px 24px 24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
           <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="none" tick={{ fontSize: 'var(--text-xs)', fill: 'var(--text-muted)', fontWeight: 600 }} />
                <YAxis stroke="none" tick={{ fontSize: 'var(--text-xs)', fill: 'var(--text-muted)', fontWeight: 600 }} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="percentage" stroke="var(--accent-cyan)" strokeWidth={4} dot={{ r: 4, fill: 'var(--accent-purple)', stroke: 'var(--card-bg)', strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0, fill: 'var(--accent-crimson)' }} animationDuration={1000} />
              </LineChart>
           </ResponsiveContainer>
        </div>

      </FluidCard>
    </motion.div>
  );
}