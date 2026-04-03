import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { AlertCircle, Plus, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { triggerHaptic } from '../utils/haptics';

export function Attendance() {
  const { data } = useData();

  // 1. STATE MANAGEMENT
  const [daySimulations, setDaySimulations] = useState<Record<string, 'attend' | 'bunk'>>({});
  const [subjectSimulations, setSubjectSimulations] = useState<Record<string, { attend: number, bunk: number }>>({});

  // 2. PARSE UPCOMING CALENDAR DAYS
  const futureWorkingDays = useMemo(() => {
    const validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    // Neutralize time to midnight for secure comparison preventing skipping events today
    now.setHours(0,0,0,0);

    const workingEvents = data.calendar.filter(c => c.type === 'working' && c.title.toLowerCase().includes('day order'));
    
    return workingEvents.filter(c => {
       const mIdx = validMonths.findIndex(vm => c.month.includes(vm));
       const yStr = c.month.split("'")[1];
       const y = 2000 + parseInt(yStr || '25');
       const eventDate = new Date(y, mIdx, parseInt(c.date));
       return eventDate >= now;
    });
  }, [data.calendar]);

  // 3. CORE PREDICTOR CALCULATION MATRIX
  const processedAttendance = useMemo(() => {
    return data.attendance.map(course => {
      let simPresent = course.present;
      let simTotal = course.total;

      // Global Day Predictor Overlay Sequence
      Object.entries(daySimulations).forEach(([dateKey, action]) => {
         const dayEvent = futureWorkingDays.find(d => d.date + d.month === dateKey);
         if (dayEvent) {
             const dayOrderMatch = dayEvent.title.match(/Day Order (\d)/i);
             if (dayOrderMatch) {
                 const dayOrderStr = dayOrderMatch[1];
                 const subjectsThatDay = data.timetable[dayOrderStr];
                 const periods = Array.isArray(subjectsThatDay) ? subjectsThatDay.filter((s: any) => s.code === course.code).length : 0;
                 
                 simTotal += periods;
                 if (action === 'attend') {
                    simPresent += periods;
                 }
             }
         }
      });

      // Local Subject Sandbox Overlay Sequence
      const locSim = subjectSimulations[course.code];
      if (locSim) {
         simTotal += (locSim.attend + locSim.bunk);
         simPresent += locSim.attend;
      }

      // Percentage and Boundary Safety Calculations
      const realPercentage = course.total === 0 ? 0 : (course.present / course.total) * 100;
      const simPercentage = simTotal === 0 ? 0 : (simPresent / simTotal) * 100;
      
      const isSimulated = simTotal !== course.total;

      // Note: Use simulated numbers safely to predict Bunk/Margin bounds natively!
      const simSafe = simPercentage >= 75;

      const marginBunkable = simSafe ? Math.floor((4/3 * simPresent) - simTotal) : 0;
      const marginNeeded = !simSafe ? Math.ceil(3 * simTotal - 4 * simPresent) : 0;
      
      const headerColor = simSafe ? '--accent-cyan' : '--accent-crimson';

      return {
        ...course,
        percentage: simPercentage,
        realPercentage,
        simPresent,
        simTotal,
        isSimulated,
        simSafe,
        marginBunkable,
        marginNeeded,
        headerColor
      };
    });
  }, [data.attendance, data.timetable, futureWorkingDays, daySimulations, subjectSimulations]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const handleGlobalSim = (dateKey: string, action: 'attend' | 'bunk') => {
     triggerHaptic(20);
     setDaySimulations(prev => ({
       ...prev,
       [dateKey]: action
     }));
  };

  const handleLocalSim = (code: string, action: 'attend' | 'bunk') => {
     triggerHaptic(20);
     setSubjectSimulations(prev => {
        const curr = prev[code] || { attend: 0, bunk: 0 };
        return {
           ...prev,
           [code]: {
              attend: curr.attend + (action === 'attend' ? 1 : 0),
              bunk: curr.bunk + (action === 'bunk' ? 1 : 0)
           }
        }
     });
  };

  const clearGlobalSimulations = () => {
    triggerHaptic(40);
    setDaySimulations({});
    setSubjectSimulations({});
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 32px 200px 32px' }}>
      <ScrollHideHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="heading-fluid glow-cyan" style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '2rem' }}>Attendance</h1>
        {(Object.keys(daySimulations).length > 0 || Object.keys(subjectSimulations).length > 0) && (
           <motion.button 
             initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
             onClick={clearGlobalSimulations}
             style={{ 
                padding: '8px 16px', background: 'rgba(255, 42, 95, 0.1)', color: 'var(--accent-crimson)', 
                border: '1px solid rgba(255, 42, 95, 0.3)', borderRadius: '12px', fontSize: '12px', 
                fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
             }}>
             <RotateCcw size={14} /> Reset 
           </motion.button>
        )}
      </ScrollHideHeader>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* --- GLOBAL CALENDAR PREDICTOR --- */}
        {futureWorkingDays.length > 0 && (
           <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <CalendarIcon size={24} color="var(--text-main)" />
                 <h2 style={{ fontSize: '16px', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-main)' }}>Global Sandbox Tracker</h2>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>Simulate a specific day to automatically calculate timetable attendance cascades across all subjects.</p>
              
              <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '16px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                 {futureWorkingDays.slice(0, 15).map(day => {
                    const dateKey = day.date + day.month;
                    const status = daySimulations[dateKey];
                    // Conditional dynamic theme borders mapping inherently securely
                    const borderDef = status === 'attend' ? '1px solid var(--accent-cyan)' : status === 'bunk' ? '1px solid var(--accent-crimson)' : '1px solid rgba(255,255,255,0.1)';
                    const bgDef = status === 'attend' ? 'rgba(29, 199, 209, 0.1)' : status === 'bunk' ? 'rgba(255, 42, 95, 0.1)' : 'var(--card-bg)';
                    
                    return (
                       <FluidCard key={dateKey} innerStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '130px' }} style={{ background: bgDef, border: borderDef, borderRadius: '16px', flexShrink: 0, transition: 'all 0.3s ease' }}>
                           <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{day.day}</span>
                           <span className="heading-fluid" style={{ fontSize: '32px', margin: '4px 0', color: 'var(--text-main)' }}>{day.date}</span>
                           <span style={{ fontSize: '10px', color: 'var(--accent-purple)', fontWeight: 800, margin: '6px 0 16px 0', textAlign: 'center' }}>{day.title}</span>
                           
                           <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
                              <button onClick={() => handleGlobalSim(dateKey, 'attend')} style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: status === 'attend' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)', color: status === 'attend' ? 'var(--bg-color)' : 'var(--text-main)', fontSize: '10px', fontWeight: 800 }}>+ ATD</button>
                              <button onClick={() => handleGlobalSim(dateKey, 'bunk')} style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: status === 'bunk' ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.05)', color: status === 'bunk' ? 'var(--bg-color)' : 'var(--text-main)', fontSize: '10px', fontWeight: 800 }}>- BNK</button>
                           </div>
                       </FluidCard>
                    )
                 })}
              </div>
           </motion.div>
        )}

        {/* --- SUBJECT CARDS --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {processedAttendance.map((course, idx) => {
            return (
              <motion.div key={idx} variants={itemVariants} layout>
                <FluidCard 
                   headerColor={course.headerColor}
                   actionIcon={course.simSafe ? <Plus size={24} color="#050508" /> : <AlertCircle size={24} color="#050508" />}
                   innerStyle={{ paddingTop: '24px' }}
                >
                  {/* Header Content */}
                  <div style={{ marginBottom: '24px', paddingRight: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div>
                         <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', lineHeight: 1.2, color: 'var(--text-main)' }}>{course.name}</h3>
                         <p style={{ fontSize: '13px', letterSpacing: '2px', fontWeight: 600, color: 'var(--accent-purple)', opacity: 0.9 }}>{course.code}</p>
                       </div>
                       {course.isSimulated && (
                          <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(237, 210, 76, 0.1)', color: '#EDD24C', border: '1px solid rgba(237, 210, 76, 0.3)', fontWeight: 800, letterSpacing: '1px' }}>SIMULATED</span>
                       )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '11px', letterSpacing: '2px', opacity: 0.7, fontWeight: 800, textTransform: 'uppercase' }}>Classes</span>
                       <span style={{ fontSize: '32px', fontWeight: 800 }}>{course.simPresent} <span style={{ opacity: 0.5, fontSize: '20px' }}>/ {course.simTotal}</span></span>
                       {course.isSimulated && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Base: {course.present}/{course.total}</span>}
                     </div>
                     <div style={{ textAlign: 'right' }}>
                       <span style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase', color: course.simSafe ? 'var(--accent-cyan)' : 'var(--accent-crimson)' }}>{course.simSafe ? 'Secure' : 'Alert'}</span>
                       <div style={{ fontSize: '36px', fontWeight: 800, color: course.simSafe ? 'var(--accent-cyan)' : 'var(--accent-crimson)', letterSpacing: '-1px', textShadow: `0 0 15px ${course.simSafe ? 'rgba(29,199,209,0.4)' : 'rgba(255,42,95,0.4)'}` }}>{course.percentage.toFixed(1)}%</div>
                       {course.isSimulated && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Base: {course.realPercentage.toFixed(1)}%</span>}
                     </div>
                  </div>

                  {/* Progress Bar Container Cyberspace */}
                  <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', marginBottom: '24px', borderRadius: '4px' }}>
                    {/* Background Base Trace Line highlighting real percentage passively mapped beneath simulation layer purely indicating boundaries securely */}
                    {course.isSimulated && (
                       <motion.div 
                         key="base-bar"
                         initial={{ width: 0 }} 
                         animate={{ width: `${course.realPercentage}%` }}
                         transition={{ duration: 1, type: "spring" }}
                         style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRight: '2px solid rgba(255,255,255,0.5)', zIndex: 1 }}
                       />
                    )}
                    
                    <motion.div 
                      key="live-bar"
                      initial={{ width: 0 }} 
                      animate={{ width: `${course.percentage}%` }}
                      transition={{ duration: 1, type: "spring" }}
                      style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: course.simSafe ? 'var(--accent-cyan)' : 'var(--accent-crimson)', boxShadow: `0 0 10px ${course.simSafe ? 'var(--accent-cyan)' : 'var(--accent-crimson)'}`, zIndex: 2 }}
                    />
                    
                    {/* 75% Marker Hook Cyberspace */}
                    <div style={{ position: 'absolute', top: 0, left: '75%', height: '100%', width: '2px', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 5, boxShadow: '0 0 5px #fff' }} />
                  </div>

                  {/* Sandbox Per-Subject Arrays */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                     <button onClick={() => handleLocalSim(course.code, 'attend')} style={{ padding: '12px', background: 'rgba(29, 199, 209, 0.05)', color: 'var(--accent-cyan)', border: '1px solid rgba(29, 199, 209, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        + Add Attend
                     </button>
                     <button onClick={() => handleLocalSim(course.code, 'bunk')} style={{ padding: '12px', background: 'rgba(255, 42, 95, 0.05)', color: 'var(--accent-crimson)', border: '1px solid rgba(255, 42, 95, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        + Add Bunk
                     </button>
                  </div>

                  {/* Algorithmic Margin Analysis Output computing SIMULATED matrixes exclusively bridging projections dynamically */}
                  <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                     {course.simSafe ? (
                       <>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(29, 199, 209, 0.15)', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(29, 199, 209, 0.3)' }}>
                            <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '20px' }}>{course.marginBunkable}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>Classes Safe to Bunk</span>
                            <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: 500 }}>{course.isSimulated ? 'Projected safe threshold limit' : 'Algorithms predict safe threshold limit'}</span>
                          </div>
                       </>
                     ) : (
                       <>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255, 42, 95, 0.15)', border: '1px solid var(--accent-crimson)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255, 42, 95, 0.3)' }}>
                            <span style={{ color: 'var(--accent-crimson)', fontWeight: 800, fontSize: '20px' }}>{course.marginNeeded}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '1px' }}>Classes Needed</span>
                            <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: 500 }}>{course.isSimulated ? 'Consecutive attendance projected to recover' : 'Consecutive attendance mandatory'}</span>
                          </div>
                       </>
                     )}
                  </div>

                </FluidCard>
              </motion.div>
            );
          })}
        </div>

      </motion.div>
    </div>
  );
}
