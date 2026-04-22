import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { Calendar as CalendarIcon } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { ScrollHideHeader } from '../components/ScrollHideHeader';

export function Calendar() {
  const { data } = useData();
  
  const today = new Date();

  // ⚡ Bolt Optimization:
  // Replaced `today.toLocaleString('en-US', { month: 'short' })` with a static O(1) array lookup.
  // `toLocaleString` implicitly instantiates expensive formatting objects and creates processing overhead
  // during React render cycles.
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const searchMonth = `${shortMonths[today.getMonth()]} '${today.getFullYear().toString().slice(-2)}`;
  const searchDate = today.getDate().toString();

  // Phase 1: Instantly jump to the origin (5 items before today) right after mount, 
  // overriding any global scroll resets, while the container is still hidden (opacity 0).
  useEffect(() => {
    const timer = setTimeout(() => {
      const todayIdx = data.calendar.findIndex(
        (c: any) => c.month === searchMonth && c.date === searchDate
      );
      const originIdx = Math.max(0, todayIdx - 5);
      const originId = `cal-event-${originIdx}`;
      const originEl = document.getElementById(originId);

      if (originEl) {
        (window as any).isProgrammaticScroll = true;
        const originPos = originEl.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: originPos, behavior: 'instant' as ScrollBehavior });
      }

      // Phase 2 automatically triggered: 
      // After locking in the 5-days-ago position, wait for the elements to mount/animate 
      // then seamlessly glide down to Today exactly as before.
      setTimeout(() => {
        scrollToToday();
      }, 400);

    }, 50);

    return () => clearTimeout(timer);
  }, [data.calendar, searchMonth, searchDate]);

  // Phase 2: Smooth scroll to today, triggered when the fade-in animation completes or via button.
  const scrollToToday = () => {
    const el = document.getElementById('today-event');
    if (!el) return;

    (window as any).isProgrammaticScroll = true;

    const headerOffset = 200; // Extra padding so today sits comfortably below the fold
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;

    window.scrollTo({
         top: offsetPosition,
         behavior: "smooth"
    });
    
    setTimeout(() => { (window as any).isProgrammaticScroll = false; }, 1200);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 200px 32px' }}>
      <ScrollHideHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <CalendarIcon size={40} color="var(--accent-crimson)" strokeWidth={2.5} />
           <h1 className="heading-fluid glow-crimson" style={{ color: 'var(--accent-crimson)', margin: 0, fontSize: 'var(--text-4xl)' }}>Agenda</h1>
        </div>
        <button 
           onClick={() => { triggerHaptic(50); scrollToToday(); }}
           className="fluid-card" 
           style={{ 
              padding: '8px 20px', 
              background: 'rgba(255, 42, 95, 0.1)', 
              color: 'var(--accent-crimson)',
              fontWeight: 800, 
              fontSize: 'var(--text-sm)', 
              letterSpacing: '2px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 42, 95, 0.3)',
              textTransform: 'uppercase'
           }}>
           Sync Today
        </button>
      </ScrollHideHeader>

      <motion.div initial={false} onAnimationComplete={scrollToToday} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {data.calendar && data.calendar.length > 0 ? data.calendar.map((item, idx) => {
            const isHoliday = item.type === 'holiday';
            const isToday = item.month === searchMonth && item.date === searchDate;
            
            return (
               <div key={idx} id={isToday ? "today-event" : `cal-event-${idx}`} style={{ display: 'flex', alignItems: 'center' }}>
                 {/* Left Date Block */}
                 <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ 
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
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>{item.month.split(' ')[0]}</span>
                    <span className="heading-fluid" style={{ fontSize: 'var(--text-4xl)', lineHeight: 1, margin: '8px 0', textShadow: isHoliday ? '0 0 20px rgba(255,42,95,0.4)' : 'none' }}>{item.date}</span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{item.day}</span>
                 </motion.div>

                 {/* Right Content Card */}
                 <div style={{ flex: 1 }}>
                   <FluidCard initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ padding: '24px' }} headerColor={isHoliday ? '--accent-crimson' : 'transparent'}>
                      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)', lineHeight: 1.2 }}>{item.title}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{item.type === 'holiday' ? 'Off Day' : item.tag}</span>
                         </div>
                         <span style={{ fontSize: 'var(--text-xs)', fontWeight: 900, padding: '4px 12px', borderRadius: '12px', backgroundColor: isHoliday ? 'rgba(255, 42, 95, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: isHoliday ? 'var(--accent-crimson)' : 'var(--text-main)', border: isHoliday ? '1px solid var(--accent-crimson)' : '1px solid rgba(255, 255, 255, 0.1)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                           {item.type}
                         </span>
                      </div>
                   </FluidCard>
                 </div>
               </div>
            );
        }) : (
            <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px', fontWeight: 800 }}>No Events Found in Planner Matrix</div>
        )}
      </motion.div>
    </div>
  );
}
