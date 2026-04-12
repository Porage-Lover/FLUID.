import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { ArrowRight, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { triggerHaptic } from '../utils/haptics';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

export function Dashboard() {
  const navigate = useNavigate();
  const { data, logout } = useData();

  const [marksEarned, marksTotal] = (data.user.overallMarks || '0/0').split('/');
  
  // macOS Up Next Logic
  const upNextClass = useMemo(() => {
     if (!data.timetable) return null;
     const d = new Date().getDay();
     if (d >= 1 && d <= 5) {
         const todaySchedule = (data.timetable as any)[String(d)];
         if (todaySchedule && Array.isArray(todaySchedule) && todaySchedule.length > 0) {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            
            for (const cls of todaySchedule) {
               const match = cls.et.match(/(\d+):(\d+)\s+(AM|PM)/i);
               if (match) {
                  let h = parseInt(match[1]);
                  const m = parseInt(match[2]);
                  const noonday = match[3].toUpperCase();
                  if (noonday === 'PM' && h !== 12) h += 12;
                  if (noonday === 'AM' && h === 12) h = 0;
                  const endMins = h * 60 + m;
                  
                  if (endMins > currentMins) {
                     return cls;
                  }
               }
            }
            return todaySchedule[0]; // fallback
         }
     }
     return null;
  }, [data.timetable]);

  // macOS Agenda List Tracker
  const upcomingAgenda = useMemo(() => {
      const nowTime = new Date();
      nowTime.setHours(0,0,0,0);
      const nowMs = nowTime.getTime();

      // ⚡ Bolt Optimization:
      // Replaced chained `.filter().slice(0,4)` which needlessly iterated the entire
      // academic calendar array. A simple `for...of` loop with a `break` stops execution
      // immediately after finding 4 upcoming events, avoiding massive redundant date computations.
      // Also hoisted `validMonths` object lookup to prevent recreating the array per iteration.
      const validMonths: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

      const result = [];
      for (const c of (data.calendar || [])) {
         const mStr = c.month.substring(0, 3);
         const yStr = c.month.split("'")[1];
         const y = 2000 + (yStr ? parseInt(yStr, 10) : 25);
         
         const eventDate = new Date(y, validMonths[mStr], parseInt(c.date, 10));
         if (eventDate.getTime() >= nowMs) {
            result.push(c);
            if (result.length === 4) break;
         }
      }
      return result;
  }, [data.calendar]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 200px 32px' }}>
      <ScrollHideHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <h1 className="heading-fluid" style={{ fontSize: 'var(--text-4xl)', margin: 0, color: 'var(--text-main)', letterSpacing: '-2px' }}>Welcome, {data.user.name}</h1>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>At a Glance</span>
            </div>
         </div>
         <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic(40); logout(); }}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 42, 95, 0.1)', color: 'var(--accent-crimson)', border: '1px solid rgba(255, 42, 95, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
         >
            <LogOut size={18} strokeWidth={3} />
         </motion.button>
      </ScrollHideHeader>

      <div className="dashboard-grid">
         
         {/* 1. UP NEXT WIDGET (4x2 Wide) */}
         <FluidCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="col-span-4 row-span-1" headerColor="--accent-cyan" onClick={() => navigate('/timetable')} innerStyle={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
               <Sparkles size={16} color="var(--accent-cyan)" />
               <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '1px' }}>Up Next</span>
            </div>
            {upNextClass ? (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <div>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, margin: '0 0 4px 0', lineHeight: 1.1 }}>{upNextClass.name?.replace(/\s*\((Theory|Practical)\)\s*/i, '')}</h2>
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 600 }}>{upNextClass.st} — {upNextClass.exactRoom}</p>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}><ArrowRight size={18} color="var(--text-main)" /></div>
               </div>
            ) : (
               <div style={{ opacity: 0.5, fontWeight: 600, marginTop: 'auto' }}>No classes scheduled currently!</div>
            )}
         </FluidCard>

         {/* 2. ATTENDANCE ORBIT WIDGET (2x2 Square) */}
         <FluidCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="col-span-2 row-span-1" headerColor="--accent-cyan" onClick={() => navigate('/attendance')} innerStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: '24px', left: '24px', fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '1px' }}>Pulse</div>
            <div style={{ width: '100px', height: '100px', position: 'relative', marginTop: '16px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={8} data={[{ name: 'A', value: data.user.overallAttendance, fill: 'var(--accent-cyan)' }]}>
                     <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                     <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
               </ResponsiveContainer>
               <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--text-main)' }}>{Math.round(data.user.overallAttendance)}<span style={{fontSize: 'var(--text-xs)'}} >%</span></span>
               </div>
            </div>
         </FluidCard>

         {/* 3. MARKS AGGREGATE WIDGET (2x2 Square) */}
         <FluidCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="col-span-2 row-span-1" headerColor="--accent-crimson" onClick={() => navigate('/marks')} innerStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ position: 'absolute', top: '24px', left: '24px', fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--accent-crimson)', letterSpacing: '1px' }}>Aggregate</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: 'var(--text-4xl)', fontWeight: 300, color: 'var(--text-main)', letterSpacing: '-2px', lineHeight: 1 }}>{marksEarned}</span>
               <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--text-muted)' }}>/ {marksTotal}</span>
            </div>
         </FluidCard>

         {/* 4. AGENDA / CALENDAR WIDGET (4x2 / 4xAuto List) */}
         <FluidCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="col-span-4" headerColor="--text-main" onClick={() => navigate('/calendar')} innerStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>Upcoming Agenda</div>
            {upcomingAgenda.length > 0 ? upcomingAgenda.map((c: any, i: number) => (
               <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: c.type === 'holiday' ? 'rgba(255,42,95,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                     <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: c.type === 'holiday' ? 'var(--accent-crimson)' : 'var(--text-main)' }}>{c.date}</span>
                     <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>{c.month.substring(0,3)}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-main)' }}>{c.title}</span>
                     <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{c.day} • {c.tag}</span>
                  </div>
               </div>
            )) : (
               <div style={{ opacity: 0.5, fontWeight: 600 }}>No agenda events pending natively.</div>
            )}
         </FluidCard>

      </div>
    </div>
  );
}
