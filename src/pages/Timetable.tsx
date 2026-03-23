import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { ScrollHideHeader } from '../components/ScrollHideHeader';

export function Timetable() {
  const [selectedDay, setSelectedDay] = useState<number | 'holiday'>(() => {
     const d = new Date().getDay();
     return (d >= 1 && d <= 5) ? d : 1;
  });
  const [isTodayHoliday, setIsTodayHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState("University Holiday");
  const { data } = useData();

  useEffect(() => {
    if (data.calendar && data.calendar.length > 0) {
      const today = new Date();
      const searchMonth = `${today.toLocaleString('en-US', { month: 'short' })} '${today.getFullYear().toString().slice(-2)}`;
      const searchDate = today.getDate().toString();

      const todayNode = data.calendar.find(c => c.month === searchMonth && c.date === searchDate);
      if (todayNode) {
        if (todayNode.type === 'holiday') {
          setIsTodayHoliday(true);
          setHolidayName(todayNode.title);
          setSelectedDay('holiday');
        } else if (todayNode.type === 'working') {
          const match = todayNode.title.match(/Day Order (\d+)/);
          if (match) setSelectedDay(parseInt(match[1]));
        }
      }
    }
  }, [data.calendar]);

  const tabs: Array<number | 'holiday'> = isTodayHoliday ? ['holiday', 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 200px 32px' }}>
      <ScrollHideHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'transparent' }}>
        <h1 className="heading-fluid glow-cyan" style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '2rem' }}>Timetable</h1>
      </ScrollHideHeader>

      <FluidCard headerColor="--text-color" style={{ padding: '24px', marginBottom: '32px', minHeight: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {tabs.map(day => (
            <motion.button
              key={day}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDay(day)}
              className="fluid-card"
              style={{
                flex: day === 'holiday' ? '1 1 100%' : '1 1 15%',
                padding: day === 'holiday' ? '12px' : '0',
                aspectRatio: day === 'holiday' ? 'auto' : '1',
                borderRadius: '12px',
                border: selectedDay === day ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.05)',
                backgroundColor: selectedDay === day ? 'rgba(29, 199, 209, 0.15)' : 'var(--card-bg)',
                color: selectedDay === day ? 'var(--accent-cyan)' : 'var(--text-main)',
                fontSize: day === 'holiday' ? '14px' : '18px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textTransform: 'uppercase',
                boxShadow: selectedDay === day ? '0 0 20px rgba(29, 199, 209, 0.3)' : 'none'
              }}
            >
              {day === 'holiday' ? '🎉 Holiday' : day}
            </motion.button>
          ))}
        </div>
      </FluidCard>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          layout
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          {(() => {
            if (selectedDay === 'holiday') {
              return (
                <FluidCard style={{ padding: '80px 40px', minWidth: '300px', textAlign: 'center' }} headerColor="--accent-crimson">
                  <div className="heading-fluid glow-crimson" style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--accent-crimson)' }}>Holiday</div>
                  <p style={{ fontSize: '14px', fontWeight: 500, opacity: 0.7, letterSpacing: '1px' }}>{holidayName}</p>
                </FluidCard>
              );
            }

            const dayData = (data.timetable as any)[String(selectedDay)];
            if (!dayData || dayData === "holiday" || dayData.length === 0) {
              return (
                <FluidCard style={{ padding: '80px 40px', minWidth: '300px', textAlign: 'center' }} headerColor="--accent-crimson">
                  <div className="heading-fluid glow-crimson" style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--accent-crimson)' }}>Off Day</div>
                  <p style={{ fontSize: '14px', fontWeight: 500, opacity: 0.7, letterSpacing: '1px' }}>No modules scheduled.</p>
                </FluidCard>
              );
            }
            return dayData.map((cls: any, idx: number) => {
              let exactRoom = cls.room || 'TBD';
              let isPractical = cls.type === 'Practical' || cls.name?.toLowerCase().includes('practical');
              
              const attendanceRecords = data.attendance.filter(a => a.code === cls.code);
              const attendanceRecord = attendanceRecords.find((a: any) => a.category?.toLowerCase() === (isPractical ? 'practical' : 'theory')) || attendanceRecords[0];
              
              if (attendanceRecord) {
                 const vals = Object.values(attendanceRecord);
                 const foundRoom = vals.find(v => typeof v === 'string' && (v.includes('TP') || v.includes('LAB') || /^[A-Z]{2,3}\s*\d{2,3}$/i.test(v)));
                 // Only allow attendance matching logic to override exactRoom if it was generically set to Campus
                 if (foundRoom && cls.room === 'Campus') exactRoom = foundRoom;
                 else if ((attendanceRecord as any).room && cls.room === 'Campus') exactRoom = (attendanceRecord as any).room;
                 else if ((attendanceRecord as any).roomNo && cls.room === 'Campus') exactRoom = (attendanceRecord as any).roomNo;
                 
                 const foundCategory = vals.find(v => typeof v === 'string' && (v.toLowerCase() === 'theory' || v.toLowerCase() === 'practical'));
                 if (foundCategory && !cls.type) {
                    isPractical = (foundCategory as string).toLowerCase() === 'practical';
                 } else if ((attendanceRecord as any).category && !cls.type) {
                    isPractical = (attendanceRecord as any).category.toLowerCase() === 'practical';
                 }
              }
              // Surface upstream scraper miss natively to UI so they know Room was completely omitted
              if (exactRoom === 'Campus') exactRoom = 'TBD (Update Scraper)';

              return (
              <motion.div key={idx} layout style={{ width: '100%' }}>
                <FluidCard style={{ padding: 0, height: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} headerColor={idx % 2 === 0 ? '--accent-cyan' : '--accent-crimson'}>
                   <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, paddingRight: '12px' }}>{cls.name?.replace(/\s*\((Theory|Practical)\)\s*/i, '')}</h3>
                        {isPractical ? (
                           <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '8px', backgroundColor: 'rgba(255, 42, 95, 0.15)', color: 'var(--accent-crimson)', border: '1px solid var(--accent-crimson)', textTransform: 'uppercase', letterSpacing: '1px' }}>Practical</span>
                        ) : (
                           <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '8px', backgroundColor: 'rgba(29, 199, 209, 0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1px' }}>Theory</span>
                        )}
                     </div>
                     
                     <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Temporal Bound</span>
                           <span style={{ fontSize: '20px', fontWeight: 900, color: idx % 2 === 0 ? 'var(--accent-cyan)' : 'var(--accent-crimson)', textShadow: `0 0 10px ${idx % 2 === 0 ? 'rgba(29, 199, 209, 0.5)' : 'rgba(255, 42, 95, 0.5)'}` }}>{cls.st} - {cls.et}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Module ID</span>
                              <span style={{ fontSize: '13px', fontWeight: 600, padding: '6px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content' }}>{cls.code}</span>
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Location</span>
                              <span style={{ fontSize: '13px', fontWeight: 600, padding: '6px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content' }}>{exactRoom}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </FluidCard>
              </motion.div>
            );
          });
        })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
