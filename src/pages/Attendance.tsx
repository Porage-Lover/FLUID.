import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluidCard } from '../components/FluidCard';
import { useData } from '../context/DataContext';
import { AlertCircle, Plus, RotateCcw, X, Target, PlusCircle, MinusCircle } from 'lucide-react';
import { ScrollHideHeader } from '../components/ScrollHideHeader';
import { triggerHaptic } from '../utils/haptics';

export function Attendance() {
  const { data } = useData();

  // 1. STATE MANAGEMENT
  const [daySimulations, setDaySimulations] = useState<Record<string, 'attend' | 'bunk'>>({});
  const [subjectSimulations, setSubjectSimulations] = useState<Record<string, { attend: number, bunk: number }>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lock body scroll when modal opens
  useEffect(() => {
    if (isModalOpen) {
       document.body.style.overflow = 'hidden';
    } else {
       document.body.style.overflow = 'unset';
    }
  }, [isModalOpen]);

  // 2. PARSE UPCOMING CALENDAR DAYS
  const futureWorkingDays = useMemo(() => {
    // ⚡ Bolt Optimization: Single-pass O(N) loop and O(1) Record lookup for month resolution.
    const MONTH_MAP: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const now = new Date();
    now.setHours(0,0,0,0);
    const nowTime = now.getTime();

    const result = [];
    for (let i = 0; i < data.calendar.length; i++) {
      const c = data.calendar[i];
      if (c.type === 'working' && c.title.toLowerCase().includes('day order')) {
        const mStr = c.month.substring(0, 3);
        const mIdx = MONTH_MAP[mStr];
        if (mIdx !== undefined) {
           const yStr = c.month.split("'")[1];
           const y = 2000 + (yStr ? parseInt(yStr) : 25);
           const eventDate = new Date(y, mIdx, parseInt(c.date));
           if (eventDate.getTime() >= nowTime) {
             result.push(c);
           }
        }
      }
    }
    return result;
  }, [data.calendar]);

  // 3. CORE PREDICTOR CALCULATION MATRIX
  const processedAttendance = useMemo(() => {
    // ⚡ Bolt Optimization: Precompute global day simulation adjustments per subject outside the O(N) course map loop.
    // Extracted the O(N) Array.find() into an O(1) Map pre-computation.
    // Impact: Avoids nested linear scanning and repeated array traversals during state changes,
    // drastically reducing simulation computation time and preventing UI blockages when day arrays scale.
    const globalAdjustments = new Map<string, { attend: number, bunk: number }>();

    const futureDaysMap = new Map<string, any>();
    for (let i = futureWorkingDays.length - 1; i >= 0; i--) {
       const d = futureWorkingDays[i];
       futureDaysMap.set(d.date + d.month, d);
    }

    const simKeys = Object.keys(daySimulations);
    for (let i = 0; i < simKeys.length; i++) {
      const dateKey = simKeys[i];
      const action = daySimulations[dateKey];
      const dayEvent = futureDaysMap.get(dateKey);

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

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* --- SLEEK PREDICTOR TOGGLE (Replaces clutter mapping) --- */}
        {futureWorkingDays.length > 0 && (
           <motion.button 
              variants={itemVariants} 
              onClick={() => { triggerHaptic(20); setIsModalOpen(true); }}
              style={{
                 width: '100%',
                 padding: '24px',
                 background: 'rgba(29, 199, 209, 0.05)',
                 border: '1px solid rgba(29, 199, 209, 0.2)',
                 borderRadius: '24px',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 color: 'var(--accent-cyan)'
              }}
           >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ background: 'var(--accent-cyan)', borderRadius: '50%', padding: '12px', color: 'var(--bg-color)' }}>
                    <Target size={24} />
                 </div>
                 <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Global Timeline Predictor</h3>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>Predict absolute timetable ripples across upcoming days.</p>
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
                             <button onClick={() => handleLocalSim(course.code, 'attend')} style={{ padding: '0', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-cyan)', opacity: 0.8, display: 'flex' }}><PlusCircle size={20} strokeWidth={2.5} /></button>
                             <button onClick={() => handleLocalSim(course.code, 'bunk')} style={{ padding: '0', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-crimson)', opacity: 0.8, display: 'flex' }}><MinusCircle size={20} strokeWidth={2.5} /></button>
                          </div>
                          
                          <div style={{ fontSize: '36px', fontWeight: 800, color: course.simSafe ? 'var(--accent-cyan)' : 'var(--accent-crimson)', letterSpacing: '-1px', textShadow: `0 0 15px ${course.simSafe ? 'rgba(29,199,209,0.4)' : 'rgba(255,42,95,0.4)'}` }}>{course.percentage.toFixed(1)}%</div>
                       </div>
                       {course.isSimulated && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Base: {course.realPercentage.toFixed(1)}%</span>}
                     </div>
                  </div>

                  {/* Progress Bar Container */}
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

                  {/* Simulated Indicator Explicit Breakdown (only shows if local overrides triggered removing horizontal clutter) */}
                  {hasLocalEdits && (
                     <div style={{ padding: '8px 12px', background: 'rgba(237, 210, 76, 0.05)', border: '1px solid rgba(237, 210, 76, 0.2)', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#EDD24C' }}>
                        <span>Local Edits</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                           <span>+ {locSim?.attend || 0} Atd</span>
                           <span>+ {locSim?.bunk || 0} Bnk</span>
                        </div>
                     </div>
                  )}

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

      {/* --- EXCLUSIVE HOLOGRAPHIC PREDICTOR MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
           <motion.div 
             initial={{ opacity: 0, y: 100 }} 
             animate={{ opacity: 1, y: 0 }} 
             exit={{ opacity: 0, y: 200 }}
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(5, 5, 8, 0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                zIndex: 9999, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)'
             }}
           >
              {/* Modal Header */}
              <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Target size={28} color="var(--accent-cyan)" />
                    <div>
                       <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--text-main)', letterSpacing: '1px' }} className="heading-fluid">Predictor</h2>
                       <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Timeline Simulator</span>
                    </div>
                 </div>
                 <button onClick={() => { triggerHaptic(30); setIsModalOpen(false); }} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex' }}>
                    <X size={24} />
                 </button>
              </div>

              {/* Modal Body / Calendar Scroller */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {Object.keys(daySimulations).length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 42, 95, 0.1)', border: '1px solid rgba(255, 42, 95, 0.3)', padding: '16px', borderRadius: '16px', marginBottom: '16px' }}>
                       <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-crimson)', letterSpacing: '1px' }}>{Object.keys(daySimulations).length} Days Tracking</span>
                       <button onClick={() => { triggerHaptic(40); setDaySimulations({}); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-crimson)', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><RotateCcw size={14}/> Reset Timeline</button>
                    </motion.div>
                 )}

                 {futureWorkingDays.map((day, idx) => {
                    const dateKey = day.date + day.month;
                    const status = daySimulations[dateKey];
                    const borderDef = status === 'attend' ? '1px solid var(--accent-cyan)' : status === 'bunk' ? '1px solid var(--accent-crimson)' : '1px solid rgba(255,255,255,0.1)';
                    const bgDef = status === 'attend' ? 'rgba(29, 199, 209, 0.1)' : status === 'bunk' ? 'rgba(255, 42, 95, 0.1)' : 'rgba(255,255,255,0.02)';

                    return (
                       <motion.div 
                          key={dateKey}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: bgDef, border: borderDef, borderRadius: '16px' }}
                       >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                             <span style={{ fontSize: '12px', fontWeight: 800, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase' }}>{day.day}, {day.month}</span>
                             <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>{day.date}</span>
                             <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 800, marginTop: '4px' }}>{day.title}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleGlobalSim(dateKey, 'attend')} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: status === 'attend' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)', color: status === 'attend' ? 'var(--bg-color)' : 'var(--text-main)', transition: 'all 0.2s' }}>
                                 <Plus size={24} />
                              </button>
                              <button onClick={() => handleGlobalSim(dateKey, 'bunk')} style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: status === 'bunk' ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.05)', color: status === 'bunk' ? 'var(--bg-color)' : 'var(--text-main)', transition: 'all 0.2s' }}>
                                 <X size={24} />
                              </button>
                          </div>
                       </motion.div>
                    )
                 })}
                 <div style={{ height: '40px' }} /> {/* Bottom Margin Spacer */}
              </div>
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
