import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { Calendar as CalendarIcon } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { ScrollHideHeader } from '../components/ScrollHideHeader';

export function Calendar() {
  const { data } = useData();
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 }
  };
  const itemVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 }
  };

  const today = new Date();
  const searchMonth = `${today.toLocaleString('en-US', { month: 'short' })} '${today.getFullYear().toString().slice(-2)}`;
  const searchDate = today.getDate().toString();

  const scrollToToday = () => {
    const el = document.getElementById('today-event');
    if (el) {
       (window as any).isProgrammaticScroll = true;
       const y = el.getBoundingClientRect().top + window.scrollY - 100;
       window.scrollTo({ top: y, behavior: 'smooth' });
       setTimeout(() => { (window as any).isProgrammaticScroll = false; }, 800);
    }
  };


  useEffect(() => {
     // A slight delay guarantees DOM painting completion
     const t = setTimeout(() => {
        scrollToToday();
     }, 100);
     return () => clearTimeout(t);
  }, [data.calendar]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 200px 32px' }}>
      <ScrollHideHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <CalendarIcon size={40} color="var(--accent-crimson)" strokeWidth={2.5} />
           <h1 className="heading-fluid glow-crimson" style={{ color: 'var(--accent-crimson)', margin: 0, fontSize: '2rem' }}>Agenda</h1>
        </div>
        <button 
           onClick={() => { triggerHaptic(50); scrollToToday(); }}
           className="fluid-card" 
           style={{ 
              padding: '8px 20px', 
              background: 'rgba(255, 42, 95, 0.1)', 
              color: 'var(--accent-crimson)',
              fontWeight: 800, 
              fontSize: '13px', 
              letterSpacing: '2px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 42, 95, 0.3)',
              textTransform: 'uppercase'
           }}>
           Sync Today
        </button>
      </ScrollHideHeader>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {data.calendar && data.calendar.length > 0 ? data.calendar.map((item, idx) => {
            const isHoliday = item.type === 'holiday';
            const isToday = item.month === searchMonth && item.date === searchDate;
            
            return (
               <motion.div key={idx} id={isToday ? "today-event" : undefined} variants={itemVariants} layout style={{ display: 'flex', alignItems: 'center' }}>
                 {/* Left Date Block */}
                 <div style={{ 
                    width: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingRight: '20px',
                    borderRight: `2px solid ${isHoliday ? 'var(--accent-crimson)' : 'rgba(255, 255, 255, 0.1)'}`,
                    marginRight: '10px',
                    color: isHoliday ? 'var(--accent-crimson)' : 'var(--text-main)',
                    position: 'relative'
                 }}>
                    {isToday && <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} style={{ position: 'absolute', top: '10px', right: '-6px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-crimson)', boxShadow: '0 0 10px var(--accent-crimson)', zIndex: 10 }} />}
                    <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>{item.month.split(' ')[0]}</span>
                    <span className="heading-fluid" style={{ fontSize: '48px', lineHeight: 1, margin: '8px 0', textShadow: isHoliday ? '0 0 20px rgba(255,42,95,0.4)' : 'none' }}>{item.date}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{item.day}</span>
                 </div>

                 {/* Right Content Card */}
                 <div style={{ flex: 1 }}>
                   <FluidCard style={{ padding: '24px' }} headerColor={isHoliday ? '--accent-crimson' : 'transparent'}>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)', lineHeight: 1.2 }}>{item.title}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{item.type === 'holiday' ? 'Off Day' : item.tag}</span>
                         </div>
                         <span style={{ fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '12px', backgroundColor: isHoliday ? 'rgba(255, 42, 95, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: isHoliday ? 'var(--accent-crimson)' : 'var(--text-main)', border: isHoliday ? '1px solid var(--accent-crimson)' : '1px solid rgba(255, 255, 255, 0.1)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                           {item.type}
                         </span>
                      </div>
                   </FluidCard>
                 </div>
               </motion.div>
            );
        }) : (
            <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px', fontWeight: 800 }}>No Events Found in Planner Matrix</div>
        )}
      </motion.div>
    </div>
  );
}
