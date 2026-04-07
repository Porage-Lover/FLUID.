import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { AlertCircle, Plus, RotateCcw, X, PlusCircle, MinusCircle, ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon } from 'lucide-react';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { triggerHaptic } from '../utils/haptics';

// --- Constants ---
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function Attendance() {
  const { data } = useData();

  // 1. STATE MANAGEMENT
  const [daySimulations, setDaySimulations] = useState<Record<string, 'attend' | 'bunk'>>({});
  const [subjectSimulations, setSubjectSimulations] = useState<Record<string, { attend: number, bunk: number }>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Lock body scroll securely preventing dashboard layout clipping natively
  useEffect(() => {
    if (isModalOpen) {
       document.body.style.overflow = 'hidden';
    } else {
       document.body.style.overflow = 'unset';
    }
  }, [isModalOpen]);

  // 2. PARSE CALENDAR METADATA IN O(1) MAP
  const { calendarEventMap, futureWorkingDaysArray } = useMemo(() => {
    const map = new Map<string, any>();
    const futureArr = [];
    
    // Neutralize time to midnight securely
    const now = new Date();
    now.setHours(0,0,0,0);
    const nowTime = now.getTime();

    for (let i = 0; i < data.calendar.length; i++) {
       const c = data.calendar[i];
       const mStr = c.month.substring(0, 3);
       const yStr = c.month.split("'")[1];
       const y = 2000 + (yStr ? parseInt(yStr) : 25);
       const mIdx = MONTH_NAMES.indexOf(mStr);
       
       if (mIdx !== -1) {
          const key = `${mStr} '${yStr}-${parseInt(c.date)}`;
          map.set(key, c);
          
          if (c.type === 'working' && c.title.toLowerCase().includes('day order')) {
             const eventDate = new Date(y, mIdx, parseInt(c.date));
             if (eventDate.getTime() >= nowTime) {
                futureArr.push(c);
             }
          }
       }
    }
    return { calendarEventMap: map, futureWorkingDaysArray: futureArr };
  }, [data.calendar]);

  // 3. CORE PREDICTOR CALCULATION MATRIX
  const processedAttendance = useMemo(() => {
    // ⚡ Bolt Optimization: Precompute global day simulation adjustments minimizing map iterations exponentially
    const globalAdjustments = new Map<string, { attend: number, bunk: number }>();

    const simKeys = Object.keys(daySimulations);
    for (let i = 0; i < simKeys.length; i++) {
      const dateKey = simKeys[i];
      const action = daySimulations[dateKey];
      
      // dateKey format: "Apr '26-15"
      const dayEvent = calendarEventMap.get(dateKey);

      if (dayEvent) {
          const dayOrderMatch = dayEvent.title.match(/Day Order (\d)/i);
          if (dayOrderMatch) {
              const dayOrderStr = dayOrderMatch[1];
              const subjectsThatDay = data.timetable[dayOrderStr];

              if (Array.isArray(subjectsThatDay)) {
                  for (let j = 0; j < subjectsThatDay.length; j++) {
                      const s = subjectsThatDay[j];
                      if (!s.code) continue;

                      let current = globalAdjustments.get(s.code);
                      if (!current) {
                          current = { attend: 0, bunk: 0 };
                          globalAdjustments.set(s.code, current);
                      }

                      if (action === 'attend') {
                          current.attend += 1;
                      } else {
                          current.bunk += 1;
                      }
                  }
              }
          }
      }
    }

    return data.attendance.map(course => {
      let simPresent = course.present;
      let simTotal = course.total;

      // Global Day Predictor Overlay Sequence
      const globAdj = globalAdjustments.get(course.code);
      if (globAdj) {
         simTotal += (globAdj.attend + globAdj.bunk);
         simPresent += globAdj.attend;
      }

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
  }, [data.attendance, data.timetable, calendarEventMap, daySimulations, subjectSimulations]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const handleGlobalSimToggle = (dateKey: string) => {
     triggerHaptic(20);
     setDaySimulations(prev => {
        const curr = prev[dateKey];
        const nextState = { ...prev };
        // Cycle: Neutral -> Bunk -> Attend -> Neutral
        if (!curr) {
            nextState[dateKey] = 'bunk';
        } else if (curr === 'bunk') {
            nextState[dateKey] = 'attend';
        } else {
            delete nextState[dateKey];
        }
        return nextState;
     });
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

  // --- CALENDAR LOGIC ---
  const handlePrevMonth = () => {
      triggerHaptic(5);
      if (calMonth === 0) {
          setCalMonth(11);
          setCalYear(prev => prev - 1);
      } else {
          setCalMonth(prev => prev - 1);
      }
  };

  const handleNextMonth = () => {
      triggerHaptic(5);
      if (calMonth === 11) {
          setCalMonth(0);
          setCalYear(prev => prev + 1);
      } else {
          setCalMonth(prev => prev + 1);
      }
  };

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
  
  const calendarBlankPads = Array.from({ length: firstDayOfWeek });
  const calendarDaysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const currentYStr = calYear.toString().slice(-2);
  const currentMStr = MONTH_NAMES[calMonth];

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

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* --- SLEEK PREDICTOR TOGGLE (Replaces clutter mapping) --- */}
        {futureWorkingDaysArray.length > 0 && (
           <motion.button 
              variants={itemVariants} 
              onClick={() => { triggerHaptic(20); setIsModalOpen(true); }}
              style={{
                 width: '100%',
                 padding: '24px',
                 background: 'var(--card-bg)',
                 border: '1px solid rgba(255, 255, 255, 0.05)',
                 borderRadius: '24px',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 color: 'var(--text-main)',
                 boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
              }}
           >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ background: 'rgba(29, 199, 209, 0.15)', border: '1px solid rgba(29, 199, 209, 0.3)', borderRadius: '50%', padding: '12px', color: 'var(--accent-cyan)' }}>
                    <CalendarIcon size={24} />
                 </div>
                 <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Global Timeline Simulator</h3>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, opacity: 0.6 }}>Predict absolute timetable ripples via interactive calendar grids natively.</p>
                 </div>
              </div>
              <Plus size={24} opacity={0.5} />
           </motion.button>
        )}

        {/* --- SUBJECT CARDS --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {processedAttendance.map((course, idx) => {
            const locSim = subjectSimulations[course.code];
            const hasLocalEdits = locSim && (locSim.attend > 0 || locSim.bunk > 0);

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
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '32px', fontWeight: 800 }}>{course.simPresent} <span style={{ opacity: 0.5, fontSize: '20px' }}>/ {course.simTotal}</span></span>
                       </div>
                       {course.isSimulated && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Base: {course.present}/{course.total}</span>}
                     </div>
                     
                     <div style={{ textAlign: 'right' }}>
                       <span style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, textTransform: 'uppercase', color: course.simSafe ? 'var(--accent-cyan)' : 'var(--accent-crimson)' }}>{course.simSafe ? 'Secure' : 'Alert'}</span>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                          
                          {/* MINIMALIST SUBJECT SANDBOX TOGGLES */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <button onClick={() => handleLocalSim(course.code, 'attend')} style={{ padding: '0', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-cyan)', opacity: 0.8, display: 'flex' }} title="+ Attend"><PlusCircle size={20} strokeWidth={2.5} /></button>
                             <button onClick={() => handleLocalSim(course.code, 'bunk')} style={{ padding: '0', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-crimson)', opacity: 0.8, display: 'flex' }} title="+ Bunk"><MinusCircle size={20} strokeWidth={2.5} /></button>
                          </div>
                          
                          <div style={{ fontSize: '36px', fontWeight: 800, color: course.simSafe ? 'var(--accent-cyan)' : 'var(--accent-crimson)', letterSpacing: '-1px', textShadow: `0 0 15px ${course.simSafe ? 'rgba(29,199,209,0.4)' : 'rgba(255,42,95,0.4)'}` }}>{course.percentage.toFixed(1)}%</div>
                       </div>
                       {course.isSimulated && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Base: {course.realPercentage.toFixed(1)}%</span>}
                     </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', marginBottom: '24px', borderRadius: '4px' }}>
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
                    
                    <div style={{ position: 'absolute', top: 0, left: '75%', height: '100%', width: '2px', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 5, boxShadow: '0 0 5px #fff' }} />
                  </div>

                  {/* Simulated Indicator Explicit Breakdown */}
                  {hasLocalEdits && (
                     <div style={{ padding: '8px 12px', background: 'rgba(237, 210, 76, 0.05)', border: '1px solid rgba(237, 210, 76, 0.2)', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#EDD24C' }}>
                        <span>Local Sandbox</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                           <span style={{ color: 'var(--accent-cyan)' }}>+ {locSim?.attend || 0} Atd</span>
                           <span style={{ color: 'var(--accent-crimson)' }}>+ {locSim?.bunk || 0} Bnk</span>
                        </div>
                     </div>
                  )}

                  {/* Algorithmic Margin Analysis Output */}
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

      {/* --- EXCLUSIVE MACOS-STYLE GRID PREDICTOR MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             onClick={() => { triggerHaptic(30); setIsModalOpen(false); }}
             style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
             }}
           >
              <motion.div 
                 onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                 initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 style={{
                    background: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '24px', width: '100%', maxWidth: '420px', overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                 }}
              >
                 {/* Modal Header & Navigation */}
                 <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-main)' }} className="heading-fluid">{currentMStr} {calYear}</span>
                       <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>Predictor Array</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                       <button onClick={handlePrevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                          <ChevronLeft size={20} />
                       </button>
                       <button onClick={handleNextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                          <ChevronRight size={20} />
                       </button>
                    </div>
                 </div>

                 {/* Grid Body */}
                 <div style={{ padding: '24px' }}>
                    {/* Weekday Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
                       {WEEK_DAYS.map((wd, i) => (
                          <div key={i} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{wd}</div>
                       ))}
                    </div>

                    {/* Matrix Calendar Execution Array */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                       {calendarBlankPads.map((_, i) => (
                          <div key={`pad-${i}`} style={{ aspectRatio: '1', borderRadius: '12px', background: 'transparent' }} />
                       ))}

                       {calendarDaysArray.map(dayNum => {
                          const dateKey = `${currentMStr} '${currentYStr}-${dayNum}`;
                          const rawEvent = calendarEventMap.get(dateKey);
                          const isWorkingDay = rawEvent?.type === 'working' && rawEvent?.title?.toLowerCase().includes('day order');
                          
                          const simState = daySimulations[dateKey]; // 'attend' | 'bunk' | undefined
                          
                          // Styling specific dynamically resolving permutations explicitly mimicking MacOS grids natively
                          const hasBorder = !!simState;
                          const borderCol = simState === 'attend' ? 'var(--accent-cyan)' : simState === 'bunk' ? 'var(--accent-crimson)' : 'transparent';
                          const bgCol = simState === 'attend' ? 'rgba(29, 199, 209, 0.1)' : simState === 'bunk' ? 'rgba(255, 42, 95, 0.1)' : (isWorkingDay ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)');
                          
                          const dayTextColor = isWorkingDay ? 'var(--text-main)' : 'rgba(255,255,255,0.15)'; // Grey-out visually bypassing user arrays cleanly

                          return (
                             <motion.button
                                key={dayNum}
                                onClick={() => isWorkingDay && handleGlobalSimToggle(dateKey)}
                                whileHover={{ scale: isWorkingDay ? 1.05 : 1 }}
                                whileTap={{ scale: isWorkingDay ? 0.95 : 1 }}
                                style={{ 
                                   aspectRatio: '1', borderRadius: '12px', background: bgCol, border: hasBorder ? `1px solid ${borderCol}` : '1px solid transparent',
                                   display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                   cursor: isWorkingDay ? 'pointer' : 'default', padding: '4px', outline: 'none'
                                }}
                             >
                                {/* The physical day number inherently bypassing block heights cleanly */}
                                <span style={{ fontSize: '14px', fontWeight: 800, color: dayTextColor }}>{dayNum}</span>
                                
                                {/* Micro-indicator marking simulation triggers gracefully natively */}
                                {simState === 'attend' && <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 800, marginTop: '2px' }}><Check size={12} strokeWidth={4}/></span>}
                                {simState === 'bunk' && <span style={{ fontSize: '10px', color: 'var(--accent-crimson)', fontWeight: 800, marginTop: '2px' }}><X size={12} strokeWidth={4}/></span>}
                                {(!simState && isWorkingDay) && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-purple)', marginTop: '6px', opacity: 0.5 }} />}
                             </motion.button>
                          );
                       })}
                    </div>

                    {/* Explanatory Legend natively nested removing UX confusion bounds dynamically */}
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px', fontWeight: 800, opacity: 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }} /> Attend
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-crimson)' }} /> Bunk
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} /> Holiday
                        </div>
                    </div>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
