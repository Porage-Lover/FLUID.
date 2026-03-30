import { motion } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { Calendar, UserCheck, Award, Clock, Play, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { triggerHaptic } from '../utils/haptics';

export function Dashboard() {
  const navigate = useNavigate();
  const { data, logout } = useData();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 200px 32px' }}>
      {/* Header */}
      <ScrollHideHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
           <div className="fluid-card" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(29, 199, 209, 0.1)', border: '1px solid var(--accent-cyan)', boxShadow: '0 0 20px rgba(29, 199, 209, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <UserCheck size={32} color="var(--accent-cyan)" strokeWidth={2.5} />
           </div>
           <div>
             <h1 className="heading-fluid" style={{ fontSize: '2.5rem', margin: 0, color: 'var(--text-main)' }}>{data.user.name}</h1>
             <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent-crimson)' }}>Student Portal</span>
           </div>
        </div>
        
        <motion.button 
           whileHover={{ scale: 1.1, rotate: 10 }}
           whileTap={{ scale: 0.9 }}
           onClick={() => { triggerHaptic(40); logout(); }}
           onMouseEnter={() => triggerHaptic(10)}
           aria-label="Log out"
           className="fluid-card"
           style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 42, 95, 0.1)', color: 'var(--accent-crimson)', border: '1px solid rgba(255, 42, 95, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
        >
           <LogOut size={20} strokeWidth={3} />
        </motion.button>
      </ScrollHideHeader>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Your Standings */}
        <motion.div layout>
           <h2 className="heading-fluid" style={{ fontSize: '2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
             <span style={{ color: 'var(--accent-cyan)' }}>/</span> ANALYTICS
           </h2>
           <div className="dashboard-grid">
              <FluidCard headerColor="--accent-cyan" actionIcon={<Play size={20} color="#fff" fill="#fff" />} onClick={() => { triggerHaptic(30); navigate('/attendance'); }} onMouseEnter={() => triggerHaptic(10)} style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-2px' }}>
                   {data.user.overallAttendance.toFixed(2)}<span style={{ fontSize: '24px', color: 'var(--accent-cyan)' }}>%</span>
                 </div>
                 <div style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Attendance</div>
              </FluidCard>
              <FluidCard headerColor="--accent-crimson" actionIcon={<Play size={20} color="#fff" fill="#fff" />} onClick={() => { triggerHaptic(30); navigate('/marks'); }} onMouseEnter={() => triggerHaptic(10)} style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '48px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-2px' }}>
                   {data.user.overallMarks.split('/')[0]}<span style={{ fontSize: '24px', color: 'var(--text-muted)' }}>/{data.user.overallMarks.split('/')[1]}</span>
                 </div>
                 <div style={{ fontSize: '13px', color: 'var(--accent-crimson)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>Total Marks</div>
              </FluidCard>
           </div>
        </motion.div>

        {/* Brutalist Nav Grid */}
        <motion.div layout className="dashboard-grid">
          {[
            { label: 'Attendance', icon: UserCheck, color: 'var(--text-main)', path: '/attendance', header: '--accent-cyan' },
            { label: 'Live Timetable', icon: Clock, color: 'var(--text-main)', path: '/timetable', header: '--accent-crimson' },
            { label: 'Marks', icon: Award, color: 'var(--text-main)', path: '/marks', header: '--accent-purple' },
            { label: 'Calendar', icon: Calendar, color: 'var(--text-main)', path: '/calendar', header: 'var(--text-main)' },
          ].map((btn, idx) => (
             <FluidCard key={idx} headerColor={btn.header} onClick={() => { triggerHaptic(30); navigate(btn.path); }} onMouseEnter={() => triggerHaptic(10)} innerStyle={{ paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <btn.icon size={36} color="var(--text-main)" opacity={0.8} />
                <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '1px', color: btn.color }}>{btn.label}</span>
             </FluidCard>
          ))}
        </motion.div>

      </motion.div>
    </div>
  );
}
